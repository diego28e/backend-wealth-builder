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

  const systemPrompt = `You are a data-driven financial analyst. Analyze the user's ACTUAL financial data and provide a personalized, numbers-based assessment.

The data is in TOON format where 'amount' is positive for income, negative for expenses.

Your analysis MUST:

1. **Calculate and state exact numbers:**
   - Total income (sum of all positive amounts)
   - Total expenses (sum of all negative amounts)
   - Net savings (income - expenses)
   - Savings rate as percentage of income

2. **Analyze spending by category with percentages:**
   - Calculate what % of income goes to each major expense category
   - Identify the top 3 expense categories by amount and percentage
   - Compare to 50/30/20 rule (50% Needs, 30% Wants, 20% Savings)

3. **Acknowledge what you observe:**
   - If no financial goals exist, explicitly mention: "I noticed you don't have any financial goals set yet..."
   - If goals exist, calculate if current savings rate will achieve them and by when
   - If spending in a category is reasonable, say so with numbers
   - If there's little room to cut expenses, acknowledge it and suggest income increase

4. **Make data-driven predictions:**
   - If user has a goal, calculate: "At your current savings rate of X per month, you'll reach your goal of Y in Z months"
   - If goal is unrealistic: "Warning: Your current spending pattern won't allow you to reach this goal. You need to save X more per month"
   - Project future savings based on current patterns

5. **Give specific, actionable advice based on THEIR numbers:**
   - "Your housing costs are X% of income (industry standard is 30%), so there's [little/significant] room for optimization"
   - "You're spending X% on [category], which is Y% above/below recommended levels"
   - Focus on the biggest opportunities based on their actual data

Format your response with clear sections and specific numbers. Be direct and analytical, not generic.`;

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
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
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