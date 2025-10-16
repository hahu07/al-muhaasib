import { BaseDataService, COLLECTIONS } from './dataService';
import type { ChartOfAccounts, JournalEntry, JournalLine, BankAccount } from '@/types';
import { nanoid } from 'nanoid';

export class ChartOfAccountsService extends BaseDataService<ChartOfAccounts> {
  constructor() {
    super(COLLECTIONS.CHART_OF_ACCOUNTS);
  }

  /**
   * Get active accounts
   */
  async getActiveAccounts(): Promise<ChartOfAccounts[]> {
    const accounts = await this.list();
    return accounts.filter(a => a.isActive);
  }

  /**
   * Get accounts by type
   */
  async getByAccountType(type: ChartOfAccounts['accountType']): Promise<ChartOfAccounts[]> {
    const accounts = await this.getActiveAccounts();
    return accounts.filter(a => a.accountType === type);
  }

  /**
   * Get parent accounts (accounts without a parent)
   */
  async getParentAccounts(): Promise<ChartOfAccounts[]> {
    const accounts = await this.getActiveAccounts();
    return accounts.filter(a => !a.parentAccountId);
  }

  /**
   * Get child accounts
   */
  async getChildAccounts(parentAccountId: string): Promise<ChartOfAccounts[]> {
    const accounts = await this.getActiveAccounts();
    return accounts.filter(a => a.parentAccountId === parentAccountId);
  }

  /**
   * Get account by code
   */
  async getByAccountCode(accountCode: string): Promise<ChartOfAccounts | null> {
    const accounts = await this.list();
    return accounts.find(a => a.accountCode === accountCode) || null;
  }

  /**
   * Get hierarchical chart of accounts
   */
  async getHierarchicalAccounts(): Promise<(ChartOfAccounts & { children?: ChartOfAccounts[] })[]> {
    const accounts = await this.getActiveAccounts();
    const parentAccounts = accounts.filter(a => !a.parentAccountId);

    return parentAccounts.map(parent => ({
      ...parent,
      children: accounts.filter(a => a.parentAccountId === parent.id),
    }));
  }

  /**
   * Initialize default chart of accounts
   */
  async initializeDefaultAccounts(): Promise<ChartOfAccounts[]> {
    const defaultAccounts = [
      // Assets
      { accountCode: '1000', accountName: 'Assets', accountType: 'asset' as const, description: 'All assets' },
      { accountCode: '1100', accountName: 'Current Assets', accountType: 'asset' as const, description: 'Current assets' },
      { accountCode: '1110', accountName: 'Cash', accountType: 'asset' as const, description: 'Cash on hand' },
      { accountCode: '1120', accountName: 'Bank Accounts', accountType: 'asset' as const, description: 'Bank accounts' },
      { accountCode: '1130', accountName: 'Accounts Receivable', accountType: 'asset' as const, description: 'Student fees receivable' },
      { accountCode: '1200', accountName: 'Fixed Assets', accountType: 'asset' as const, description: 'Long-term assets' },
      { accountCode: '1210', accountName: 'Buildings', accountType: 'asset' as const, description: 'School buildings' },
      { accountCode: '1220', accountName: 'Equipment', accountType: 'asset' as const, description: 'School equipment' },
      { accountCode: '1230', accountName: 'Furniture', accountType: 'asset' as const, description: 'School furniture' },
      
      // Liabilities
      { accountCode: '2000', accountName: 'Liabilities', accountType: 'liability' as const, description: 'All liabilities' },
      { accountCode: '2100', accountName: 'Current Liabilities', accountType: 'liability' as const, description: 'Short-term liabilities' },
      { accountCode: '2110', accountName: 'Accounts Payable', accountType: 'liability' as const, description: 'Amounts owed to vendors' },
      { accountCode: '2120', accountName: 'Salaries Payable', accountType: 'liability' as const, description: 'Unpaid salaries' },
      
      // Equity
      { accountCode: '3000', accountName: 'Equity', accountType: 'equity' as const, description: 'Owner\'s equity' },
      { accountCode: '3100', accountName: 'Retained Earnings', accountType: 'equity' as const, description: 'Accumulated profits' },
      
      // Revenue
      { accountCode: '4000', accountName: 'Revenue', accountType: 'revenue' as const, description: 'All revenue' },
      { accountCode: '4100', accountName: 'Tuition Fees', accountType: 'revenue' as const, description: 'Tuition fee income' },
      { accountCode: '4200', accountName: 'Other Fees', accountType: 'revenue' as const, description: 'Other fee income' },
      
      // Expenses
      { accountCode: '5000', accountName: 'Expenses', accountType: 'expense' as const, description: 'All expenses' },
      { accountCode: '5100', accountName: 'Salaries & Wages', accountType: 'expense' as const, description: 'Staff salaries' },
      { accountCode: '5200', accountName: 'Utilities', accountType: 'expense' as const, description: 'Utility expenses' },
      { accountCode: '5300', accountName: 'Maintenance', accountType: 'expense' as const, description: 'Maintenance costs' },
      { accountCode: '5400', accountName: 'Supplies', accountType: 'expense' as const, description: 'School supplies' },
    ];

    const createdAccounts: ChartOfAccounts[] = [];
    for (const account of defaultAccounts) {
      const existing = await this.getByAccountCode(account.accountCode);
      if (!existing) {
        const created = await this.create({
          ...account,
          isActive: true,
        });
        createdAccounts.push(created);
      }
    }

    return createdAccounts;
  }
}

export class JournalEntryService extends BaseDataService<JournalEntry> {
  constructor() {
    super(COLLECTIONS.JOURNAL_ENTRIES);
  }

  /**
   * Create a journal entry
   */
  async createJournalEntry(data: {
    entryDate: string;
    description: string;
    lines: JournalLine[];
    referenceType?: JournalEntry['referenceType'];
    referenceId?: string;
    createdBy: string;
  }): Promise<JournalEntry> {
    // Generate entry number
    const entryNumber = `JE-${new Date().getFullYear()}-${nanoid(6).toUpperCase()}`;

    // Validate that debits equal credits
    const totalDebit = data.lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = data.lines.reduce((sum, line) => sum + line.credit, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error('Journal entry is not balanced. Debits must equal credits.');
    }

    return this.create({
      ...data,
      entryNumber,
      totalDebit,
      totalCredit,
      status: 'draft',
    });
  }

  /**
   * Get journal entries by status
   */
  async getByStatus(status: JournalEntry['status']): Promise<JournalEntry[]> {
    const entries = await this.list();
    return entries.filter(e => e.status === status);
  }

  /**
   * Get journal entries by date range
   */
  async getByDateRange(startDate: string, endDate: string): Promise<JournalEntry[]> {
    const entries = await this.list();
    return entries.filter(e => {
      const entryDate = e.entryDate;
      return entryDate >= startDate && entryDate <= endDate;
    });
  }

  /**
   * Get journal entries by reference
   */
  async getByReference(referenceType: JournalEntry['referenceType'], referenceId: string): Promise<JournalEntry[]> {
    const entries = await this.list();
    return entries.filter(e => e.referenceType === referenceType && e.referenceId === referenceId);
  }

  /**
   * Post a journal entry
   */
  async postJournalEntry(entryId: string): Promise<JournalEntry> {
    const entry = await this.getById(entryId);
    if (!entry) {
      throw new Error('Journal entry not found');
    }

    if (entry.status === 'posted') {
      throw new Error('Journal entry already posted');
    }

    // Validate balance again
    if (Math.abs(entry.totalDebit - entry.totalCredit) > 0.01) {
      throw new Error('Cannot post unbalanced journal entry');
    }

    return this.update(entryId, {
      status: 'posted',
      postedAt: new Date(),
    });
  }

  /**
   * Create journal entry for payment
   */
  async createPaymentEntry(data: {
    paymentDate: string;
    amount: number;
    paymentId: string;
    studentName: string;
    bankAccountId: string;
    revenueAccountId: string;
    createdBy: string;
  }): Promise<JournalEntry> {
    const lines: JournalLine[] = [
      {
        accountId: data.bankAccountId,
        accountName: 'Bank',
        accountCode: '1120',
        debit: data.amount,
        credit: 0,
        description: `Payment from ${data.studentName}`,
      },
      {
        accountId: data.revenueAccountId,
        accountName: 'Tuition Fees',
        accountCode: '4100',
        debit: 0,
        credit: data.amount,
        description: `Fee payment from ${data.studentName}`,
      },
    ];

    return this.createJournalEntry({
      entryDate: data.paymentDate,
      description: `Student fee payment - ${data.studentName}`,
      lines,
      referenceType: 'payment',
      referenceId: data.paymentId,
      createdBy: data.createdBy,
    });
  }

  /**
   * Create journal entry for expense
   */
  async createExpenseEntry(data: {
    expenseDate: string;
    amount: number;
    expenseId: string;
    expenseDescription: string;
    expenseAccountId: string;
    paymentAccountId: string;
    createdBy: string;
  }): Promise<JournalEntry> {
    const lines: JournalLine[] = [
      {
        accountId: data.expenseAccountId,
        accountName: 'Expense',
        accountCode: '5000',
        debit: data.amount,
        credit: 0,
        description: data.expenseDescription,
      },
      {
        accountId: data.paymentAccountId,
        accountName: 'Bank/Cash',
        accountCode: '1120',
        debit: 0,
        credit: data.amount,
        description: `Payment for ${data.expenseDescription}`,
      },
    ];

    return this.createJournalEntry({
      entryDate: data.expenseDate,
      description: `Expense: ${data.expenseDescription}`,
      lines,
      referenceType: 'expense',
      referenceId: data.expenseId,
      createdBy: data.createdBy,
    });
  }

  /**
   * Create journal entry for salary payment
   */
  async createSalaryEntry(data: {
    paymentDate: string;
    netPay: number;
    salaryPaymentId: string;
    staffName: string;
    salaryAccountId: string;
    bankAccountId: string;
    createdBy: string;
  }): Promise<JournalEntry> {
    const lines: JournalLine[] = [
      {
        accountId: data.salaryAccountId,
        accountName: 'Salaries & Wages',
        accountCode: '5100',
        debit: data.netPay,
        credit: 0,
        description: `Salary for ${data.staffName}`,
      },
      {
        accountId: data.bankAccountId,
        accountName: 'Bank',
        accountCode: '1120',
        debit: 0,
        credit: data.netPay,
        description: `Salary payment to ${data.staffName}`,
      },
    ];

    return this.createJournalEntry({
      entryDate: data.paymentDate,
      description: `Salary payment - ${data.staffName}`,
      lines,
      referenceType: 'salary',
      referenceId: data.salaryPaymentId,
      createdBy: data.createdBy,
    });
  }

  /**
   * Create journal entry for depreciation
   */
  async createDepreciationEntry(data: {
    depreciationDate: string;
    amount: number;
    assetName: string;
    depreciationExpenseAccountId: string;
    accumulatedDepreciationAccountId: string;
    createdBy: string;
  }): Promise<JournalEntry> {
    const lines: JournalLine[] = [
      {
        accountId: data.depreciationExpenseAccountId,
        accountName: 'Depreciation Expense',
        accountCode: '5000',
        debit: data.amount,
        credit: 0,
        description: `Depreciation for ${data.assetName}`,
      },
      {
        accountId: data.accumulatedDepreciationAccountId,
        accountName: 'Accumulated Depreciation',
        accountCode: '1290',
        debit: 0,
        credit: data.amount,
        description: `Accumulated depreciation for ${data.assetName}`,
      },
    ];

    return this.createJournalEntry({
      entryDate: data.depreciationDate,
      description: `Depreciation - ${data.assetName}`,
      lines,
      referenceType: 'depreciation',
      createdBy: data.createdBy,
    });
  }

  /**
   * Get trial balance
   */
  async getTrialBalance(asOfDate?: string): Promise<{
    accounts: { accountCode: string; accountName: string; debit: number; credit: number }[];
    totalDebit: number;
    totalCredit: number;
    isBalanced: boolean;
  }> {
    let entries: JournalEntry[];
    if (asOfDate) {
      entries = await this.getByDateRange('1900-01-01', asOfDate);
    } else {
      entries = await this.list();
    }

    const postedEntries = entries.filter(e => e.status === 'posted');
    const accountBalances = new Map<string, { accountCode: string; accountName: string; debit: number; credit: number }>();

    postedEntries.forEach(entry => {
      entry.lines.forEach(line => {
        const existing = accountBalances.get(line.accountId) || {
          accountCode: line.accountCode,
          accountName: line.accountName,
          debit: 0,
          credit: 0,
        };

        accountBalances.set(line.accountId, {
          ...existing,
          debit: existing.debit + line.debit,
          credit: existing.credit + line.credit,
        });
      });
    });

    const accounts = Array.from(accountBalances.values());
    const totalDebit = accounts.reduce((sum, a) => sum + a.debit, 0);
    const totalCredit = accounts.reduce((sum, a) => sum + a.credit, 0);

    return {
      accounts,
      totalDebit,
      totalCredit,
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
    };
  }
}

export class BankAccountService extends BaseDataService<BankAccount> {
  constructor() {
    super(COLLECTIONS.BANK_ACCOUNTS);
  }

  /**
   * Get active bank accounts
   */
  async getActiveAccounts(): Promise<BankAccount[]> {
    const accounts = await this.list();
    return accounts.filter(a => a.isActive);
  }

  /**
   * Get account by account number
   */
  async getByAccountNumber(accountNumber: string): Promise<BankAccount | null> {
    const accounts = await this.list();
    return accounts.find(a => a.accountNumber === accountNumber) || null;
  }

  /**
   * Update bank account balance
   */
  async updateBalance(accountId: string, amount: number): Promise<BankAccount> {
    const account = await this.getById(accountId);
    if (!account) {
      throw new Error('Bank account not found');
    }

    const newBalance = account.balance + amount;

    return this.update(accountId, {
      balance: newBalance,
    });
  }

  /**
   * Get total balance across all accounts
   */
  async getTotalBalance(): Promise<number> {
    const accounts = await this.getActiveAccounts();
    return accounts.reduce((sum, a) => sum + a.balance, 0);
  }

  /**
   * Get balance summary by account type
   */
  async getBalanceSummary(): Promise<{
    totalBalance: number;
    byType: Record<string, number>;
    accounts: BankAccount[];
  }> {
    const accounts = await this.getActiveAccounts();

    const byType: Record<string, number> = {};
    accounts.forEach(a => {
      byType[a.accountType] = (byType[a.accountType] || 0) + a.balance;
    });

    return {
      totalBalance: accounts.reduce((sum, a) => sum + a.balance, 0),
      byType,
      accounts,
    };
  }
}

// Export singleton instances
export const chartOfAccountsService = new ChartOfAccountsService();
export const journalEntryService = new JournalEntryService();
export const bankAccountService = new BankAccountService();
