/**
 * Banking Auto-Post Service
 * 
 * Automatically creates journal entries when bank transactions are recorded.
 * Ensures seamless integration between Banking and Accounting modules.
 */

import { journalEntryService, chartOfAccountsService } from "./accountingService";
import type { BankAccount, BankTransaction, JournalLine } from "@/types";

/**
 * Auto-post bank transaction to General Ledger
 * 
 * Creates a journal entry when a bank transaction is recorded.
 * Only posts if bank account is linked to a GL account.
 * 
 * @param transaction - The bank transaction to post
 * @param bankAccount - The bank account the transaction belongs to
 * @param createdBy - User ID who created the transaction
 * @returns Journal entry ID if posted, null if not linked to GL
 */
export async function autoPostBankTransaction(
  transaction: BankTransaction,
  bankAccount: BankAccount,
  createdBy: string
): Promise<string | null> {
  // Only auto-post if bank account is linked to GL
  if (!bankAccount.glAccountId) {
    console.log(`Bank account ${bankAccount.accountName} not linked to GL. Skipping auto-post.`);
    return null;
  }

  try {
    // Determine the contra account (where the other side of the transaction goes)
    const contraAccount = await determineContraAccount(transaction.transactionType);

    // Build journal entry lines based on transaction type
    const lines = buildJournalLines(
      transaction,
      bankAccount,
      contraAccount
    );

    // Create journal entry
    const journalEntry = await journalEntryService.createJournalEntry({
      entryDate: transaction.transactionDate,
      description: `Bank ${transaction.transactionType}: ${transaction.description}`,
      lines,
      referenceType: "other",
      referenceId: transaction.id,
      createdBy,
    });

    // Auto-post immediately (no draft mode for bank transactions)
    await journalEntryService.postJournalEntry(journalEntry.id, createdBy);

    console.log(`✅ Auto-posted bank transaction ${transaction.id} to journal entry ${journalEntry.id}`);
    return journalEntry.id;
  } catch (error) {
    console.error(`Failed to auto-post bank transaction ${transaction.id}:`, error);
    // Don't throw - bank transaction should still be created even if GL posting fails
    return null;
  }
}

/**
 * Build journal entry lines for a bank transaction
 * 
 * Double-entry rules:
 * - Deposit (money in): Debit Bank, Credit Contra (Revenue/Suspense)
 * - Withdrawal (money out): Debit Contra (Expense/Suspense), Credit Bank
 * - Transfer: Handled separately via transfer service
 */
function buildJournalLines(
  transaction: BankTransaction,
  bankAccount: BankAccount,
  contraAccount: { id: string; code: string; name: string }
): JournalLine[] {
  const lines: JournalLine[] = [];

  if (transaction.creditAmount > 0) {
    // DEPOSIT: Money IN
    // Debit: Bank Account (increase asset)
    lines.push({
      accountId: bankAccount.glAccountId!,
      accountCode: bankAccount.glAccountCode!,
      accountName: bankAccount.glAccountName!,
      debit: transaction.creditAmount,
      credit: 0,
      description: transaction.description,
    });

    // Credit: Contra Account (revenue, suspense, or other)
    lines.push({
      accountId: contraAccount.id,
      accountCode: contraAccount.code,
      accountName: contraAccount.name,
      debit: 0,
      credit: transaction.creditAmount,
      description: transaction.description,
    });
  } else if (transaction.debitAmount > 0) {
    // WITHDRAWAL: Money OUT
    // Debit: Contra Account (expense, suspense, or other)
    lines.push({
      accountId: contraAccount.id,
      accountCode: contraAccount.code,
      accountName: contraAccount.name,
      debit: transaction.debitAmount,
      credit: 0,
      description: transaction.description,
    });

    // Credit: Bank Account (decrease asset)
    lines.push({
      accountId: bankAccount.glAccountId!,
      accountCode: bankAccount.glAccountCode!,
      accountName: bankAccount.glAccountName!,
      debit: 0,
      credit: transaction.debitAmount,
      description: transaction.description,
    });
  }

  return lines;
}

/**
 * Determine contra account based on transaction type
 * 
 * Returns appropriate GL account for the other side of the entry.
 * Falls back to Suspense Account if specific account not found.
 */
async function determineContraAccount(
  transactionType: BankTransaction["transactionType"]
): Promise<{ id: string; code: string; name: string }> {
  // Default suspense account (will be created if doesn't exist)
  const suspenseDefault = {
    id: "suspense_clearing",
    code: "1190",
    name: "Suspense Clearing Account",
  };

  try {
    const accounts = await chartOfAccountsService.getActiveAccounts();

    // Map transaction types to appropriate GL accounts
    switch (transactionType) {
      case "deposit":
        // Look for revenue/income accounts (4000-4999)
        const revenueAccount = accounts.find(
          (acc) => acc.accountType === "revenue" && acc.accountCode.startsWith("4")
        );
        if (revenueAccount) {
          return {
            id: revenueAccount.id,
            code: revenueAccount.accountCode,
            name: revenueAccount.accountName,
          };
        }
        break;

      case "withdrawal":
        // Look for expense accounts (5000-5999)
        const expenseAccount = accounts.find(
          (acc) => acc.accountType === "expense" && acc.accountCode.startsWith("5")
        );
        if (expenseAccount) {
          return {
            id: expenseAccount.id,
            code: expenseAccount.accountCode,
            name: expenseAccount.accountName,
          };
        }
        break;

      case "fee":
      case "charge":
        // Bank charges - look for bank charges expense account
        const chargesAccount = accounts.find(
          (acc) => acc.accountName.toLowerCase().includes("bank charges") ||
                   acc.accountName.toLowerCase().includes("bank fees")
        );
        if (chargesAccount) {
          return {
            id: chargesAccount.id,
            code: chargesAccount.accountCode,
            name: chargesAccount.accountName,
          };
        }
        break;

      case "interest":
        // Interest income - look for interest income account
        const interestAccount = accounts.find(
          (acc) => acc.accountName.toLowerCase().includes("interest income") ||
                   acc.accountName.toLowerCase().includes("interest earned")
        );
        if (interestAccount) {
          return {
            id: interestAccount.id,
            code: interestAccount.accountCode,
            name: interestAccount.accountName,
          };
        }
        break;

      case "transfer":
        // Transfers are handled separately - shouldn't reach here
        break;
    }

    // Fallback: Look for suspense/clearing account
    const suspenseAccount = accounts.find(
      (acc) => acc.accountName.toLowerCase().includes("suspense") ||
               acc.accountName.toLowerCase().includes("clearing")
    );
    
    if (suspenseAccount) {
      return {
        id: suspenseAccount.id,
        code: suspenseAccount.accountCode,
        name: suspenseAccount.accountName,
      };
    }

    // Final fallback
    return suspenseDefault;
  } catch (error) {
    console.error("Error determining contra account:", error);
    return suspenseDefault;
  }
}

/**
 * Auto-post inter-account transfer to General Ledger
 * 
 * Creates a journal entry for transfers between bank accounts.
 * Only posts if both accounts are linked to GL.
 * 
 * @param fromAccount - Source bank account
 * @param toAccount - Destination bank account
 * @param amount - Transfer amount
 * @param description - Transfer description
 * @param transferDate - Date of transfer
 * @param transferId - Transfer reference ID
 * @param createdBy - User ID who created the transfer
 * @returns Journal entry ID if posted, null if accounts not linked
 */
export async function autoPostTransfer(
  fromAccount: BankAccount,
  toAccount: BankAccount,
  amount: number,
  description: string,
  transferDate: string,
  transferId: string,
  createdBy: string
): Promise<string | null> {
  // Both accounts must be linked to GL
  if (!fromAccount.glAccountId || !toAccount.glAccountId) {
    console.log(`Transfer between ${fromAccount.accountName} and ${toAccount.accountName} not fully linked to GL. Skipping auto-post.`);
    return null;
  }

  try {
    const lines: JournalLine[] = [
      // Debit: Destination account (increase)
      {
        accountId: toAccount.glAccountId,
        accountCode: toAccount.glAccountCode!,
        accountName: toAccount.glAccountName!,
        debit: amount,
        credit: 0,
        description,
      },
      // Credit: Source account (decrease)
      {
        accountId: fromAccount.glAccountId,
        accountCode: fromAccount.glAccountCode!,
        accountName: fromAccount.glAccountName!,
        debit: 0,
        credit: amount,
        description,
      },
    ];

    const journalEntry = await journalEntryService.createJournalEntry({
      entryDate: transferDate,
      description: `Inter-account transfer: ${description}`,
      lines,
      referenceType: "other",
      referenceId: transferId,
      createdBy,
    });

    // Auto-post immediately
    await journalEntryService.postJournalEntry(journalEntry.id, createdBy);

    console.log(`✅ Auto-posted transfer ${transferId} to journal entry ${journalEntry.id}`);
    return journalEntry.id;
  } catch (error) {
    console.error(`Failed to auto-post transfer ${transferId}:`, error);
    return null;
  }
}

/**
 * Get GL balance for a bank account
 * 
 * Fetches the current balance from the General Ledger for comparison.
 * Used for reconciliation.
 */
export async function getGLBalance(glAccountId: string): Promise<number> {
  try {
    // This would query journal entries for the account and calculate balance
    // For now, we'll return a placeholder
    // TODO: Implement actual GL balance calculation from journal entries
    console.log(`Fetching GL balance for account ${glAccountId}`);
    return 0;
  } catch (error) {
    console.error("Error fetching GL balance:", error);
    return 0;
  }
}
