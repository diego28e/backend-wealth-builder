import { encode } from '@toon-format/toon';
import type { UserFinancials } from '../models/finance.model.js';

export const analyzeFinancials = async (data: UserFinancials): Promise<string> => {
  console.log('🔍 Starting financial analysis...');
  console.log('📊 User profile:', data.profile);
  console.log('📈 Transaction count:', data.transactions.length);
  
  const apiKey = process.env.GEMINI_API_KEY;
  console.log('🔑 API Key status:', apiKey ? `Present (${apiKey.substring(0, 10)}...)` : 'Missing');
  console.log('🔑 API Key length:', apiKey?.length || 0);
  console.log('🔑 API Key type:', typeof apiKey);
  
  if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey.trim() === '') {
    console.error('❌ GEMINI_API_KEY environment variable is missing or invalid');
    throw new Error('GEMINI_API_KEY environment variable is required and must be a valid API key');
  }

  const systemPrompt = `
You are an expert financial advisor. You will be given a user's financial profile,
their goals, and their complete transaction history.
The transaction history is formatted using TOON (Token-Oriented Object Notation)
to save tokens. 'amount' is positive for income, negative for expenses.

Your task is to:
1. Analyze the user's total income, total expenses, and net savings.
2. Analyze their spending patterns, bucketing expenses into "Needs" (e.g., Groceries, 
   Utilities, Rent) and "Wants" (e.g., Dining, Shopping, Subscriptions).
3. Compare their spending to the 50/30/20 rule (50% Needs, 30% Wants, 20% Savings).
4. Provide 3-5 concrete, actionable recommendations tailored specifically
   to their profile and goals.

Respond only with your recommendations in a brief, actionable list.
  `;

  const toonData = encode({ 
    profile: data.profile,
    goals: data.goals.join(','),
    transactions: data.transactions 
  });

  const finalPrompt = `${systemPrompt}

USER_FINANCIAL_DATA:
${toonData}`;
  
  console.log('📝 TOON Data length:', toonData.length);
  console.log('📝 Final prompt preview:', finalPrompt.substring(0, 200) + '...');

  try {
    console.log('🚀 Making request to Gemini API...');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey.trim()}`;
    console.log('🔗 API URL (without key):', url.replace(/key=.*/, 'key=***'));
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: finalPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    console.log('📊 Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Gemini API error response:', errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json() as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>
        }
      }>
    };
    
    console.log('📝 Raw API response:', JSON.stringify(result, null, 2));
    
    if (!result.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error('❌ Invalid response structure from Gemini API');
      console.error('Response:', result);
      throw new Error('Invalid response from Gemini API');
    }
    
    const analysis = result.candidates[0].content.parts[0].text;
    console.log('✅ Analysis generated successfully, length:', analysis.length);
    return analysis;
  } catch (error) {
    console.error('❌ Gemini API error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to generate financial analysis');
  }
};