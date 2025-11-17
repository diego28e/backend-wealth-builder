import { encode } from '@toon-format/toon';
import type { UserFinancials } from '../models/finance.model.js';

export const analyzeFinancials = async (data: UserFinancials): Promise<string> => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required');
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

  const finalPrompt = `${systemPrompt}\n\nUSER_FINANCIAL_DATA:\n${toonData}`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
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

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const result = await response.json() as {
      candidates: Array<{
        content: {
          parts: Array<{ text: string }>
        }
      }>
    };
    
    if (!result.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response from Gemini API');
    }
    
    return result.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('Failed to generate financial analysis');
  }
};