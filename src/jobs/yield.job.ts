import cron from 'node-cron';
import * as financeService from '../api/services/finance.service.js';

// Schedule: 4:00 AM Colombia Time (UTC-5)
// Server is likely UTC. 4 AM COT = 09:00 UTC.
const CRON_SCHEDULE = '0 9 * * *';

export const startYieldJob = () => {
    cron.schedule(CRON_SCHEDULE, async () => {
        console.log('💰 [Cron] Running Daily Yield Calculation...');

        try {
            const accounts = await financeService.getActiveAccountsWithYield();
            console.log(`[Cron] Found ${accounts.length} accounts with active yield.`);

            for (const account of accounts) {
                if (!account.interest_rate || account.interest_rate <= 0) continue;
                if (!account.current_balance || account.current_balance <= 0) continue;

                // Formula: Daily Yield = Balance * ((1 + Rate/100)^(1/365) - 1)
                // Rate is Annual Effective Rate (E.A.)
                const dailyRate = Math.pow(1 + (account.interest_rate / 100), 1 / 365) - 1;
                const rawYield = account.current_balance * dailyRate;
                const yieldAmount = Math.round(rawYield);

                if (yieldAmount > 0) {
                    try {
                        const userId = account.user_id;
                        const categoryId = await financeService.getInterestCategoryId(userId);

                        if (!categoryId) {
                            console.warn(`[Cron] Skipping yield for account ${account.id}: No category found.`);
                            continue;
                        }

                        // Create Transaction as INCOME
                        // This automatically triggers the DB Balance Trigger to update the account balance!
                        await financeService.createTransaction({
                            user_id: userId,
                            account_id: account.id!, // Non-null assertion as ID comes from DB
                            category_id: categoryId,
                            date: new Date().toISOString(),
                            type: 'Income',
                            amount: yieldAmount,
                            currency_code: account.currency_code,
                            description: 'Daily Yield',
                            notes: `Automated interest deposit. Rate: ${account.interest_rate}% E.A.`,
                            merchant_name: account.name
                        });

                        console.log(`[Cron] Added yield of ${yieldAmount} to account ${account.name} (${account.id})`);
                    } catch (err) {
                        console.error(`[Cron] Failed to process yield for account ${account.id}:`, err);
                    }
                }
            }
            console.log('✅ [Cron] Daily Yield Calculation Complete.');
        } catch (error) {
            console.error('❌ [Cron] Critical error in yield job:', error);
        }
    });

    console.log(`⏰ Yield Job Scheduled (Schedule: ${CRON_SCHEDULE} UTC)`);
};
