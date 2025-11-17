// Simple test script to verify Gemini API key
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
console.log('🔑 API Key status:', apiKey ? `Present (${apiKey.substring(0, 10)}...)` : 'Missing');
console.log('🔑 API Key length:', apiKey?.length || 0);

if (!apiKey || apiKey === 'your_gemini_api_key_here') {
  console.error('❌ Please set a valid GEMINI_API_KEY in .env file');
  process.exit(1);
}

// Test API call
const testPrompt = 'Hello, please respond with "API working" if you can read this.';

try {
  console.log('🚀 Testing Gemini API...');
  
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey.trim()}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: testPrompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 100,
      }
    })
  });

  console.log('📊 Response status:', response.status);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ API Error:', errorText);
  } else {
    const result = await response.json();
    console.log('✅ API Response:', result.candidates?.[0]?.content?.parts?.[0]?.text || 'No text in response');
  }
} catch (error) {
  console.error('❌ Test failed:', error.message);
}