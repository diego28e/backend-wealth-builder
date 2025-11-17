import { encode } from '@toon-format/toon';
import type { UserFinancials } from '../models/finance.model.js';

export const analyzeFinancials = async (data: UserFinancials): Promise<string> => {
  
  // This is the prompt for our powerful use case
  const systemPrompt = `
You are an expert financial advisor. You will be given a user's financial profile,
their goals, and their complete transaction history for the last quarter.
The transaction history is formatted using TOON (Token-Oriented Object Notation)
to save tokens. 'amount' is positive for income, negative for expenses.

Your task is to:
1.  Analyze the user's total income, total expenses, and net savings.
2.  Analyze their spending patterns, bucketing expenses into "Needs" (e.g., Groceries, 
    Utilities, Rent) and "Wants" (e.g., Dining, Shopping, Subscriptions).
3.  Compare their spending to the 50/30/20 rule (50% Needs, 30% Wants, 20% Savings).
4.  Provide 3-5 concrete, actionable recommendations tailored *specifically*
    to their \`profile\` and \`goals\`.
Respond *only* with your recommendations in a brief, actionable list.
  `;

  // 1. We encode the *entire* large transaction history into TOON.
  // This is the "translation layer" pattern in action.
  const toonData = encode({ 
    profile: data.profile,
    goals: data.goals.join(','),
    transactions: data.transactions 
  });

  // 2. We construct the final prompt.
  const finalPrompt = `${systemPrompt}\n\nUSER_FINANCIAL_DATA:\n${toonData}`;

  console.log('--- FINAL PROMPT SENT TO LLM (Notice the compact TOON data!) ---');
  console.log(finalPrompt);

  // 3. --- MOCK LLM CALL ---
  // In a real app, you would send `finalPrompt` to your LLM API.
  // For our tutorial, we'll return a mock response based on the
  // user's profile, demonstrating the adaptive logic.

  await new Promise(resolve => setTimeout(resolve, 300)); // Simulate latency

  switch (data.profile) {
    case 'Low-Income':
      return `
Your net savings are very tight. The 50/30/20 rule is tough right now, so let's focus on basics:
1.  **Run a Subscription Audit:** You have $45/mo in 'Wants - Subscriptions'. Review these and cancel any you don't use daily.
2.  **Separate 'Needs' vs. 'Wants' Groceries:** Your 'Groceries' bill is high. Try to identify 'wants' (like snacks, pre-made meals) from 'needs' (staples).
3.  **Focus on Income:** Your primary lever is income. Let's set a goal to build 'Human Capital' by taking a free online course to improve a skill.
4.  **Start a Micro-Investment:** You don't need a lot to start. Open a high-yield savings account or use a micro-investing app and set an automatic $5/week deposit.
      `;
    case 'High-Income/High-Expense':
      return `
Your income is strong, but your 'Wants' category is 55% of your spending, leaving only 5% for savings. Let's fix this.
1.  **Implement 'Zero-Based Budgeting':** Your high 'Wants' spending feels unplanned. Next month, give every dollar a job *before* you spend it.
2.  **Aggressive Subscription Audit:** You have 8 subscriptions totaling $180/mo. Challenge yourself to cut this by 50%.
3.  **Automate Savings *First*:** You are saving what's left. Reverse this. Set up an automatic transfer of 20% of your paycheck to a savings account the *day* you get paid.
4.  **Cap 'Wants - Dining':** Your dining-out expenses ($1,200/mo) are your biggest wealth drain. Set a hard cap of $600 and track it.
      `;
    case 'Wealth-Builder':
      return `
Great job! Your savings rate is 25%, beating the 20% target. Your expenses are controlled. Now, let's make your money work for you.
1.  **Deploy Your Savings:** Your cash savings are growing, but inflation is eating them. It's time to invest.
2.  **Start with Passive Investing:** The simplest, most effective start is a diversified, low-fee index fund (like an S&P 500 ETF).
3.  **Build a 3-6 Month Emergency Fund:** Keep 3-6 months of your 'Needs' expenses in a high-yield savings account. This is your buffer. Do not invest this.
4.  **Maximize Tax-Advantaged Accounts:** Ensure you are contributing the maximum allowed to any available retirement accounts (like a 401(k) or IRA) *before* investing in a standard brokerage account.
      `;
    default:
      return 'Unable to provide recommendations for this profile type.';
  }
};