import type { Request, Response } from 'express';
import { processReceiptImage, createTransactionFromReceipt } from '../api/services/receipt.service.js';
import { getUserCategories } from '../api/services/finance.service.js';
import { supabase } from '../config/supabase.js';

export const uploadReceipt = async (req: Request, res: Response): Promise<void> => {
  try {
    const { image_base64, user_id } = req.body;

    if (!image_base64) {
      res.status(400).json({ error: 'image_base64 is required' });
      return;
    }

    if (!user_id) {
      res.status(400).json({ error: 'user_id is required' });
      return;
    }

    console.log('📸 Processing receipt for user:', user_id);

    // Get user categories
    const categories = await getUserCategories(user_id);
    console.log('📂 Found', categories.length, 'categories');

    // Process receipt with AI
    console.log('🤖 Analyzing receipt image...');
    const receiptData = await processReceiptImage(image_base64, user_id, categories);
    console.log('✅ Receipt analyzed:', receiptData.merchant_name, receiptData.items.length, 'items');

    // Upload image to Supabase Storage
    const fileName = `${user_id}/${Date.now()}.jpg`;
    const imageBuffer = Buffer.from(image_base64, 'base64');
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(fileName, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Storage upload error:', uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage
      .from('receipts')
      .getPublicUrl(uploadData.path);

    console.log('📦 Image uploaded:', urlData.publicUrl);

    // Create transaction with line items
    const transaction = await createTransactionFromReceipt(
      receiptData,
      user_id,
      urlData.publicUrl
    );

    console.log('✅ Transaction created:', transaction.id);

    res.status(201).json({
      transaction,
      receipt_data: receiptData,
      message: 'Receipt processed successfully'
    });
  } catch (error) {
    console.error('❌ Receipt upload error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to process receipt'
    });
  }
};
