/**
 * Auto-Posting Service
 * Automatically creates journal entries for operational transactions
 * Ensures proper double-entry bookkeeping for all financial activities
 */

import {
  journalEntryService,
  chartOfAccountsService,
} from "./accountingService";
import type { JournalEntryLine } from "@/types";
import { nanoid } from "nanoid";

/**
 * Standard Chart of Accounts Codes
 * These should match your actual COA setup in accountingService.ts
 */
export const ACCOUNT_CODES = {
  // Assets
  CASH: "1110", // Cash on hand
  BANK: "1120", // Bank accounts
  ACCOUNTS_RECEIVABLE: "1130", // Student fees receivable
  FIXED_ASSETS: "1200", // Fixed Assets (parent)
  ACCUMULATED_DEPRECIATION: "1250", // Accumulated Depreciation (contra-asset)

  // Liabilities
  ACCOUNTS_PAYABLE: "2110", // Amounts owed to vendors
  SALARIES_PAYABLE: "2120", // Unpaid salaries
  TAX_PAYABLE: "2130", // Tax payable

  // Equity
  RETAINED_EARNINGS: "3100", // Accumulated profits

  // Revenue
  TUITION_INCOME: "4100", // Tuition fee income
  FEE_INCOME: "4200", // Other fee income
  OTHER_INCOME: "4300", // Other income

  // Expenses
  SALARY_EXPENSE: "5100", // Staff salaries
  RENT_EXPENSE: "5200", // Rent expense (not in defaults, needs to be added)
  UTILITIES_EXPENSE: "5200", // Utility expenses
  SUPPLIES_EXPENSE: "5400", // School supplies
  MAINTENANCE_EXPENSE: "5300", // Maintenance costs
  DEPRECIATION_EXPENSE: "5500", // Depreciation expense
  ADMINISTRATIVE_EXPENSE: "5600", // Administrative expense
  OTHER_EXPENSE: "5900", // Other expenses
} as const;

export interface AutoPostingOptions {
  description: string;
  reference?: string;
  transactionDate: string;
  createdBy: string;
  autoPost?: boolean; // If true, automatically post the entry
}

export class AutoPostingService {
  /**
   * Helper: Get account by code
   */
  private async getAccountByCode(accountCode: string) {
    const account = await chartOfAccountsService.getByAccountCode(accountCode);
    if (!account) {
      throw new Error(
        `Account with code ${accountCode} not found. Please initialize your Chart of Accounts.`,
      );
    }
    return account;
  }

  /**
   * Create journal entry for student payment received
   */
  async postStudentPayment(
    amount: number,
    paymentMethod: "cash" | "bank_transfer" | "cheque" | "pos" | "online",
    studentName: string,
    admissionNumber: string,
    options: AutoPostingOptions,
  ): Promise<string> {
    const debitAccountCode =
      paymentMethod === "cash" ? ACCOUNT_CODES.CASH : ACCOUNT_CODES.BANK;
    const debitAccount = await this.getAccountByCode(debitAccountCode);
    const creditAccount = await this.getAccountByCode(ACCOUNT_CODES.FEE_INCOME);

    const lines: JournalEntryLine[] = [
      {
        accountId: debitAccount.id,
        accountName: debitAccount.accountName,
        accountCode: debitAccount.accountCode,
        debit: amount,
        credit: 0,
        description: `Payment received from ${studentName} (${admissionNumber})`,
      },
      {
        accountId: creditAccount.id,
        accountName: creditAccount.accountName,
        accountCode: creditAccount.accountCode,
        debit: 0,
        credit: amount,
        description: `Fee payment - ${studentName} (${admissionNumber})`,
      },
    ];

    return await this.createAndPostJournalEntry(lines, options);
  }

  /**
   * Create journal entry for expense payment
   */
  async postExpense(
    amount: number,
    expenseCategory: string,
    paymentMethod: "cash" | "bank_transfer" | "cheque" | "pos" | "online",
    vendor: string,
    options: AutoPostingOptions,
  ): Promise<string> {
    const creditAccountCode =
      paymentMethod === "cash" ? ACCOUNT_CODES.CASH : ACCOUNT_CODES.BANK;
    const creditAccount = await this.getAccountByCode(creditAccountCode);
    const expenseAccountCode = this.getExpenseAccountCode(expenseCategory);
    const debitAccount = await this.getAccountByCode(expenseAccountCode);

    const lines: JournalEntryLine[] = [
      {
        accountId: debitAccount.id,
        accountName: debitAccount.accountName,
        accountCode: debitAccount.accountCode,
        debit: amount,
        credit: 0,
        description: `${expenseCategory} expense - ${vendor}`,
      },
      {
        accountId: creditAccount.id,
        accountName: creditAccount.accountName,
        accountCode: creditAccount.accountCode,
        debit: 0,
        credit: amount,
        description: `Payment to ${vendor}`,
      },
    ];

    return await this.createAndPostJournalEntry(lines, options);
  }

  /**
   * Create journal entry for salary payment
   */
  async postSalaryPayment(
    staffName: string,
    staffNumber: string,
    grossSalary: number,
    totalDeductions: number,
    netPay: number,
    taxAmount: number,
    paymentMethod: "cash" | "bank_transfer" | "cheque",
    options: AutoPostingOptions,
  ): Promise<string> {
    const creditAccount = await this.getAccountByCode(
      paymentMethod === "cash" ? ACCOUNT_CODES.CASH : ACCOUNT_CODES.BANK,
    );
    const salaryExpenseAccount = await this.getAccountByCode(
      ACCOUNT_CODES.SALARY_EXPENSE,
    );

    const lines: JournalEntryLine[] = [
      {
        accountId: salaryExpenseAccount.id,
        accountName: salaryExpenseAccount.accountName,
        accountCode: salaryExpenseAccount.accountCode,
        debit: grossSalary,
        credit: 0,
        description: `Salary for ${staffName} (${staffNumber})`,
      },
      {
        accountId: creditAccount.id,
        accountName: creditAccount.accountName,
        accountCode: creditAccount.accountCode,
        debit: 0,
        credit: netPay,
        description: `Net salary paid to ${staffName}`,
      },
    ];

    // Add tax payable if there are taxes
    if (taxAmount > 0) {
      const taxPayableAccount = await this.getAccountByCode(
        ACCOUNT_CODES.TAX_PAYABLE,
      );
      lines.push({
        accountId: taxPayableAccount.id,
        accountName: taxPayableAccount.accountName,
        accountCode: taxPayableAccount.accountCode,
        debit: 0,
        credit: taxAmount,
        description: `PAYE for ${staffName}`,
      });
    }

    // Add other deductions as salaries payable (if any difference)
    const otherDeductions = totalDeductions - taxAmount;
    if (otherDeductions > 0) {
      const salariesPayableAccount = await this.getAccountByCode(
        ACCOUNT_CODES.SALARIES_PAYABLE,
      );
      lines.push({
        accountId: salariesPayableAccount.id,
        accountName: salariesPayableAccount.accountName,
        accountCode: salariesPayableAccount.accountCode,
        debit: 0,
        credit: otherDeductions,
        description: `Other deductions for ${staffName}`,
      });
    }

    return await this.createAndPostJournalEntry(lines, options);
  }

  /**
   * Create journal entry for asset purchase
   */
  async postAssetPurchase(
    assetName: string,
    assetCode: string,
    purchasePrice: number,
    paymentMethod: "cash" | "bank_transfer" | "cheque",
    vendor: string,
    options: AutoPostingOptions,
  ): Promise<string> {
    const creditAccount = await this.getAccountByCode(
      paymentMethod === "cash" ? ACCOUNT_CODES.CASH : ACCOUNT_CODES.BANK,
    );
    const fixedAssetsAccount = await this.getAccountByCode(
      ACCOUNT_CODES.FIXED_ASSETS,
    );

    const lines: JournalEntryLine[] = [
      {
        accountId: fixedAssetsAccount.id,
        accountName: fixedAssetsAccount.accountName,
        accountCode: fixedAssetsAccount.accountCode,
        debit: purchasePrice,
        credit: 0,
        description: `Purchase of ${assetName} (${assetCode})`,
      },
      {
        accountId: creditAccount.id,
        accountName: creditAccount.accountName,
        accountCode: creditAccount.accountCode,
        debit: 0,
        credit: purchasePrice,
        description: `Payment to ${vendor} for ${assetName}`,
      },
    ];

    return await this.createAndPostJournalEntry(lines, options);
  }

  /**
   * Create journal entry for monthly depreciation
   */
  async postDepreciation(
    assetName: string,
    assetCode: string,
    depreciationAmount: number,
    options: AutoPostingOptions,
  ): Promise<string> {
    const depreciationExpenseAccount = await this.getAccountByCode(
      ACCOUNT_CODES.DEPRECIATION_EXPENSE,
    );
    const accumulatedDepreciationAccount = await this.getAccountByCode(
      ACCOUNT_CODES.ACCUMULATED_DEPRECIATION,
    );

    const lines: JournalEntryLine[] = [
      {
        accountId: depreciationExpenseAccount.id,
        accountName: depreciationExpenseAccount.accountName,
        accountCode: depreciationExpenseAccount.accountCode,
        debit: depreciationAmount,
        credit: 0,
        description: `Monthly depreciation - ${assetName} (${assetCode})`,
      },
      {
        accountId: accumulatedDepreciationAccount.id,
        accountName: accumulatedDepreciationAccount.accountName,
        accountCode: accumulatedDepreciationAccount.accountCode,
        debit: 0,
        credit: depreciationAmount,
        description: `Accumulated depreciation - ${assetName}`,
      },
    ];

    return await this.createAndPostJournalEntry(lines, options);
  }

  /**
   * Helper: Create and optionally post a journal entry
   */
  private async createAndPostJournalEntry(
    lines: JournalEntryLine[],
    options: AutoPostingOptions,
  ): Promise<string> {
    const entryId = nanoid();

    const journalEntry = {
      id: entryId,
      entryNumber: `AUTO-${Date.now()}`,
      entryDate: options.transactionDate,
      description: options.description,
      reference: options.reference || "",
      lines,
      status: options.autoPost !== false ? "posted" : "draft",
      createdBy: options.createdBy,
      postedBy: options.autoPost !== false ? options.createdBy : undefined,
      postedAt: options.autoPost !== false ? new Date() : undefined,
    };

    // Validate journal entry is balanced
    const totalDebit = lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = lines.reduce((sum, line) => sum + line.credit, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(
        `Journal entry not balanced. Debit: ${totalDebit}, Credit: ${totalCredit}`,
      );
    }

    await journalEntryService.create(journalEntry);
    return entryId;
  }

  /**
   * Helper: Map expense category to chart of accounts code
   */
  private getExpenseAccountCode(category: string): string {
    const categoryMap: Record<string, string> = {
      "Salaries & Wages": ACCOUNT_CODES.SALARY_EXPENSE,
      Rent: ACCOUNT_CODES.RENT_EXPENSE,
      Utilities: ACCOUNT_CODES.UTILITIES_EXPENSE,
      "Office Supplies": ACCOUNT_CODES.SUPPLIES_EXPENSE,
      Maintenance: ACCOUNT_CODES.MAINTENANCE_EXPENSE,
      Administrative: ACCOUNT_CODES.ADMINISTRATIVE_EXPENSE,
    };

    return categoryMap[category] || ACCOUNT_CODES.OTHER_EXPENSE;
  }

  /**
   * Helper: Get expense account name
   */
  private getExpenseAccountName(category: string): string {
    const nameMap: Record<string, string> = {
      "Salaries & Wages": "Salary Expense",
      Rent: "Rent Expense",
      Utilities: "Utilities Expense",
      "Office Supplies": "Supplies Expense",
      Maintenance: "Maintenance Expense",
      Administrative: "Administrative Expense",
    };

    return nameMap[category] || "Other Expense";
  }
}

// Export singleton instance
export const autoPostingService = new AutoPostingService();
