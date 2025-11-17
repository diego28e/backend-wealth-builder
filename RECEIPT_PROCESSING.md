# Receipt Processing Feature

## Overview
AI-powered receipt/bill image processing that automatically extracts transaction details and line items.

## Database Schema Updates
Already applied to your database:
- `transaction_items` table for storing individual receipt line items
- Added to `transactions` table:
  - `receipt_image_url` - URL to stored receipt image
  - `receipt_processed_at` - Timestamp of AI processing
  - `merchant_name` - Store/merchant name
  - `has_line_items` - Flag indicating detailed breakdown exists

## New Files Created

### Models
- `src/api/models/receipt.model.ts` - Receipt data schemas and types

### Services
- `src/api/services/receipt.service.ts` - AI processing and transaction creation logic

### Controllers
- `src/controllers/receipt.controller.ts` - HTTP request handler for receipt upload

## API Endpoint

### POST /api/v1/receipts/upload
Upload and process a receipt image.

**Request Body:**
```json
{
  "user_id": "uuid",
  "image_base64": "base64-encoded-image-string"
}
```

**Response:**
```json
{
  "transaction": {
    "id": "uuid",
    "user_id": "uuid",
    "merchant_name": "Store Name",
    "amount": 50000,
    "currency_code": "COP",
    "receipt_image_url": "https://...",
    "has_line_items": true,
    ...
  },
  "receipt_data": {
    "merchant_name": "Store Name",
    "date": "2024-01-15T10:30:00Z",
    "currency_code": "COP",
    "total_amount": 50000,
    "items": [
      {
        "item_name": "Product 1",
        "quantity": 2,
        "unit_price": 15000,
        "total_amount": 30000,
        "suggested_category_id": "uuid"
      }
    ]
  },
  "message": "Receipt processed successfully"
}
```

## How It Works

1. **Image Upload**: Frontend sends base64-encoded receipt image
2. **AI Processing**: Gemini Vision AI extracts:
   - Merchant name
   - Transaction date
   - Currency
   - Line items (name, quantity, price)
   - Suggested categories for each item
3. **Storage**: Image stored in Supabase Storage bucket `receipts/`
4. **Database**: Creates:
   - Main transaction record with receipt metadata
   - Individual line items in `transaction_items` table

## Configuration Required

### Environment Variables
Ensure `.env` has:
```
GEMINI_API_KEY=your_actual_api_key
```

### Supabase Storage
Create a storage bucket named `receipts`:
1. Go to Supabase Dashboard > Storage
2. Create new bucket: `receipts`
3. Set to public or configure appropriate policies

## Benefits

- **Fine-grained Analysis**: Track spending per product type
- **Automatic Categorization**: AI suggests categories for items
- **Audit Trail**: Original receipt image preserved
- **Flexible**: Supports both simple manual entry and detailed AI processing
- **Smart Queries**: `has_line_items` flag enables efficient filtering

## Example Usage

```javascript
// Frontend example
const imageFile = document.getElementById('receipt').files[0];
const reader = new FileReader();

reader.onload = async () => {
  const base64 = reader.result.split(',')[1];
  
  const response = await fetch('/api/v1/receipts/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: currentUserId,
      image_base64: base64
    })
  });
  
  const result = await response.json();
  console.log('Transaction created:', result.transaction.id);
};

reader.readAsDataURL(imageFile);
```

## TypeScript Compilation
✅ All types validated - no compilation errors
