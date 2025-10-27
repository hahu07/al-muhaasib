/**
 * Auto-Posting Service
 * Automatically creates journal entries for operational transactions
 * Ensures proper double-entry bookkeeping for all financial activities
 */

import {
  journalEntryService,
  chartOfAccountsService,
} from "./accountingService";
import { accountMappingService } from "./accountMappingService";
import type { JournalEntryLine, FeeType } from "@/types";
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
  NHF_PAYABLE: "2140", // National Housing Fund payable
  PENSION_PAYABLE: "2150", // Pension contributions payable
  NHIS_PAYABLE: "2160", // NHIS contributions payable

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
  PENSION_EXPENSE: "5700", // Employer pension contribution expense
  OTHER_EXPENSE: "5900", // Other expenses
} as const;

export interface AutoPostingOptions {
  description: string;
  reference?: string;
  transactionDate: string;
  createdBy: string;
  autoPost?: boolean; // If true, automatically post the entry
  statutoryDeductions?: {
    nhf: number;
    pensionEmployee: number;
    pensionEmployer: number;
    nhis: number;
    totalEmployeeDeductions: number;
    totalEmployerContributions: number;
  };
}

export class AutoPostingService {
  /**
   * Dynamically map fee type to revenue account code using database
   * This allows for flexible configuration through the UI
   */
  private async getRevenueAccountForFeeType(feeType: FeeType): Promise<string> {
    // Try to get mapping from database
    const mapping = await accountMappingService.getMappingForSource(
      "revenue",
      feeType,
    );

    if (mapping) {
      return mapping.accountCode;
    }

    // Fallback to default accounts if mapping not found
    console.warn(
      `No mapping found for fee type: ${feeType}. Using fallback account.`,
    );
    return ACCOUNT_CODES.OTHER_INCOME;
  }

  /**
   * Dynamically map expense category to expense account code using database
   */
  private async getExpenseAccountForCategory(
    category: string,
  ): Promise<string> {
    // Try to get mapping from database
    const mapping = await accountMappingService.getMappingForSource(
      "expense",
      category.toLowerCase(),
    );

    if (mapping) {
      return mapping.accountCode;
    }

    // Fallback using the old hardcoded method
    return this.getExpenseAccountCode(category);
  }

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
   * Create journal entry for fee assignment (recognizes revenue and receivable)
   * Debit: Accounts Receivable
   * Credit: Revenue (by fee type)
   */
  async postFeeAssignment(
    studentName: string,
    admissionNumber: string,
    feeAllocations: { feeType: FeeType; amount: number }[],
    options: AutoPostingOptions,
  ): Promise<string> {
    const receivableAccount = await this.getAccountByCode(
      ACCOUNT_CODES.ACCOUNTS_RECEIVABLE,
    );

    // Calculate total amount
    const totalAmount = feeAllocations.reduce(
      (sum, alloc) => sum + alloc.amount,
      0,
    );

    const lines: JournalEntryLine[] = [
      {
        accountId: receivableAccount.id,
        accountName: receivableAccount.accountName,
        accountCode: receivableAccount.accountCode,
        debit: totalAmount,
        credit: 0,
        description: `Fees assigned to ${studentName} (${admissionNumber})`,
      },
    ];

    // Create credit lines by fee type allocations (recognizing revenue)
    for (const alloc of feeAllocations) {
      const creditCode = await this.getRevenueAccountForFeeType(alloc.feeType);
      const creditAccount = await this.getAccountByCode(creditCode);
      lines.push({
        accountId: creditAccount.id,
        accountName: creditAccount.accountName,
        accountCode: creditAccount.accountCode,
        debit: 0,
        credit: alloc.amount,
        description: `Fee assigned (${alloc.feeType}) - ${studentName}`,
      });
    }

    return await this.createAndPostJournalEntry(lines, options);
  }

  /**
   * Create journal entry for student payment received
   * Debit: Cash/Bank
   * Credit: Accounts Receivable
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
    const receivableAccount = await this.getAccountByCode(
      ACCOUNT_CODES.ACCOUNTS_RECEIVABLE,
    );

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
        accountId: receivableAccount.id,
        accountName: receivableAccount.accountName,
        accountCode: receivableAccount.accountCode,
        debit: 0,
        credit: amount,
        description: `Payment received from ${studentName} (${admissionNumber})`,
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
    const expenseAccountCode = await this.getExpenseAccountForCategory(
      expenseCategory,
    );
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
   * Create journal entry for salary payment with statutory deductions
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

    // Add statutory deductions as separate liability accounts
    const statutory = options.statutoryDeductions;
    if (statutory) {
      // NHF Payable
      if (statutory.nhf > 0) {
        const nhfAccount = await this.getAccountByCode(ACCOUNT_CODES.NHF_PAYABLE);
        lines.push({
          accountId: nhfAccount.id,
          accountName: nhfAccount.accountName,
          accountCode: nhfAccount.accountCode,
          debit: 0,
          credit: statutory.nhf,
          description: `NHF deduction for ${staffName}`,
        });
      }

      // Pension Payable (Employee + Employer)
      const totalPension = statutory.pensionEmployee + statutory.pensionEmployer;
      if (totalPension > 0) {
        const pensionAccount = await this.getAccountByCode(ACCOUNT_CODES.PENSION_PAYABLE);
        lines.push({
          accountId: pensionAccount.id,
          accountName: pensionAccount.accountName,
          accountCode: pensionAccount.accountCode,
          debit: 0,
          credit: totalPension,
          description: `Pension contribution for ${staffName} (Employee: ₦${statutory.pensionEmployee}, Employer: ₦${statutory.pensionEmployer})`,
        });
      }

      // Employer pension as expense (in addition to salary expense)
      if (statutory.pensionEmployer > 0) {
        const pensionExpenseAccount = await this.getAccountByCode(ACCOUNT_CODES.PENSION_EXPENSE);
        lines.push({
          accountId: pensionExpenseAccount.id,
          accountName: pensionExpenseAccount.accountName,
          accountCode: pensionExpenseAccount.accountCode,
          debit: statutory.pensionEmployer,
          credit: 0,
          description: `Employer pension contribution for ${staffName}`,
        });
      }

      // NHIS Payable
      if (statutory.nhis > 0) {
        const nhisAccount = await this.getAccountByCode(ACCOUNT_CODES.NHIS_PAYABLE);
        lines.push({
          accountId: nhisAccount.id,
          accountName: nhisAccount.accountName,
          accountCode: nhisAccount.accountCode,
          debit: 0,
          credit: statutory.nhis,
          description: `NHIS contribution for ${staffName}`,
        });
      }
    }

    // Add tax payable (PAYE) if there are taxes
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
    // Calculate statutory total for comparison
    const statutoryTotal = statutory
      ? statutory.nhf + statutory.pensionEmployee + statutory.nhis
      : 0;
    const otherDeductions = totalDeductions - taxAmount - statutoryTotal;
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
   * Dynamically map asset type to asset account code using database
   */
  private async getAssetAccountForType(assetType: string): Promise<string> {
    // Try to get mapping from database
    const mapping = await accountMappingService.getMappingForSource(
      "asset",
      assetType.toLowerCase(),
    );

    if (mapping) {
      return mapping.accountCode;
    }

    // Fallback to Fixed Assets account
    console.warn(
      `No mapping found for asset type: ${assetType}. Using fallback Fixed Assets account.`,
    );
    return ACCOUNT_CODES.FIXED_ASSETS;
  }

  /**
   * Create journal entry for asset purchase with dynamic mapping
   */
  async postAssetPurchase(
    assetName: string,
    assetCode: string,
    assetType: string,
    purchasePrice: number,
    paymentMethod: "cash" | "bank_transfer" | "cheque",
    vendor: string,
    options: AutoPostingOptions,
  ): Promise<string> {
    const creditAccount = await this.getAccountByCode(
      paymentMethod === "cash" ? ACCOUNT_CODES.CASH : ACCOUNT_CODES.BANK,
    );
    
    // Use dynamic mapping for asset type
    const assetAccountCode = await this.getAssetAccountForType(assetType);
    const assetAccount = await this.getAccountByCode(assetAccountCode);

    const lines: JournalEntryLine[] = [
      {
        accountId: assetAccount.id,
        accountName: assetAccount.accountName,
        accountCode: assetAccount.accountCode,
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
}

// Export singleton instance
export const autoPostingService = new AutoPostingService();
