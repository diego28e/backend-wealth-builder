import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '../../config/supabase.js';
import { ReceiptDataSchema } from '../models/receipt.model.js';
import type { ReceiptData } from '../models/receipt.model.js';
import type { Transaction, Category } from '../models/finance.model.js';
import * as financeService from './finance.service.js';

export const processReceiptImage = async (
  imageBase64: string,
  userId: string,
  userCategories: Category[]
): Promise<ReceiptData> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY is required');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const categoryList = userCategories
    .map(c => `- ${c.name} (ID: ${c.id})`)
    .join('\n');

  const currentYear = new Date().getFullYear();
  const prompt = `Analyze this receipt/bill image and extract structured data.

Available categories for item classification:
${categoryList}

IMPORTANT: 
- Date MUST be in ISO 8601 format: "YYYY-MM-DD". 
- If the receipt shows a date without a year (e.g., "Feb 11"), assume the current year is ${currentYear}.
- If the date is ambiguous, prefer the current year ${currentYear}.
- Amounts must be in CENTS (smallest currency unit). 
  - Example: $450.00 becomes 45000.
  - Example: 50,000 COP becomes 5000000. 
  - If the receipt says "450", and it's COP, it's likely 45000 cents. Use your best judgment for the currency.

Return ONLY valid JSON (no markdown, no explanation):
{
  "merchant_name": "Store name",
  "date": "${currentYear}-01-15T12:00:00Z",
  "currency_code": "COP",
  "total_amount": 5000000, 
  "items": [
    {
      "item_name": "Product name",
      "quantity": 2,
      "unit_price": 1500000,
      "total_amount": 3000000,
      "suggested_category_id": "uuid-from-list-or-null"
    }
  ]
}`;

  // Clean the base64 string (remove data:image/...;base64, prefix if present)
  // Gemini API expects raw base64 data
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64Data
      }
    }
  ]);

  const text = result.response.text();
  console.log('🤖 AI Response:', text.substring(0, 500));

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse receipt data from AI response');
  }

  const parsed = JSON.parse(jsonMatch[0]);
  console.log('📋 Parsed date:', parsed.date);

  // Normalize date to ISO 8601 and fix year if needed
  if (parsed.date) {
    let dateObj = new Date(parsed.date);
    const now = new Date();

    // If the date is invalid, default to today
    if (isNaN(dateObj.getTime())) {
      dateObj = now;
    }

    // If the year is older than 2 years (likely a hallucination or old receipt), assume current year
    // or if the year is in the future
    if (dateObj.getFullYear() < now.getFullYear() - 1 || dateObj.getFullYear() > now.getFullYear()) {
      console.log(`⚠️ Date year ${dateObj.getFullYear()} seems off. Adjusting to ${now.getFullYear()}`);
      dateObj.setFullYear(now.getFullYear());
    }

    parsed.date = dateObj.toISOString();
    console.log('🔧 Normalized date to:', parsed.date);
  } else {
    parsed.date = new Date().toISOString();
  }

  // Sanity check for amounts (Super basic heurisitc)
  // If amount is small (< 1000) and currency is COP, implies it wasn't converted to cents or it's just wrong. 
  // But strictly following the prompt instructions is better. 
  // The prompt now explicitly asks for cents.

  return ReceiptDataSchema.parse(parsed);
};

export const createTransactionFromReceipt = async (
  receiptData: ReceiptData,
  userId: string,
  receiptImageUrl: string,
  accountId: string
): Promise<Transaction> => {
  // Use first item's category or fallback to first available category
  const { data: fallbackCategory } = await supabase
    .from('categories')
    .select('id')
    .or(`user_id.eq.${userId},user_id.is.null`)
    .limit(1)
    .single();

  const categoryId = receiptData.items[0]?.suggested_category_id || fallbackCategory?.id;
  if (!categoryId) {
    throw new Error('No category available for transaction');
  }

  // Create main transaction using the finance service
  // This ensures validation and automated fee processing
  const transaction = await financeService.createTransaction({
    user_id: userId,
    account_id: accountId,
    category_id: categoryId,
    date: receiptData.date,
    amount: receiptData.total_amount,
    type: 'Expense',
    description: receiptData.merchant_name || 'Receipt Upload',
    currency_code: receiptData.currency_code,
    receipt_image_url: receiptImageUrl,
    merchant_name: receiptData.merchant_name,
    has_line_items: true,
    receipt_processed_at: new Date().toISOString()
  });

  // Create line items separately
  if (receiptData.items.length > 0) {
    const items = receiptData.items.map((item, index) => ({
      transaction_id: transaction.id, // transaction.id is now valid UUID
      item_name: item.item_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_amount: item.total_amount,
      category_id: item.suggested_category_id || null,
      sort_order: index
    }));

    const { error: itemsError } = await supabase
      .from('transaction_items')
      .insert(items);

    if (itemsError) throw new Error(`Failed to create items: ${itemsError.message}`);
  }

  return transaction;
};
