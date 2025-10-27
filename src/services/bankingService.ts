import { BaseDataService, COLLECTIONS } from "./dataService";
import type {
  BankTransaction,
  BankStatement,
  BankReconciliation,
  InterAccountTransfer,
  CashFlowProjection,
} from "@/types";
import { customAlphabet } from "nanoid";
import { bankAccountService, journalEntryService } from "./accountingService";
import { autoPostBankTransaction } from "./bankingAutoPostService";

const nanoid = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", 8);

// ============================================
// BANK TRANSACTION SERVICE
// ============================================

export class BankTransactionService extends BaseDataService<BankTransaction> {
  constructor() {
    super(COLLECTIONS.BANK_TRANSACTIONS);
  }

  /**
   * Record a bank transaction
   */
  async recordTransaction(data: {
    bankAccountId: string;
    transactionDate: string;
    valueDate: string;
    description: string;
    debitAmount: number;
    creditAmount: number;
    balance: number;
    transactionType: BankTransaction["transactionType"];
    reference?: string;
    category?: string;
    notes?: string;
    createdBy: string;
  }): Promise<BankTransaction> {
    // Validate amounts
    if (data.debitAmount < 0 || data.creditAmount < 0) {
      throw new Error("Transaction amounts cannot be negative");
    }

    if (data.debitAmount > 0 && data.creditAmount > 0) {
      throw new Error("Transaction cannot have both debit and credit amounts");
    }

    const transaction = await this.create({
      ...data,
      status: "cleared",
      isReconciled: false,
    });

    // Update bank account balance
    const netAmount = data.creditAmount - data.debitAmount;
    await bankAccountService.updateBalance(data.bankAccountId, netAmount);

    // Auto-post to General Ledger if bank account is linked to GL
    try {
      const bankAccount = await bankAccountService.getById(data.bankAccountId);
      if (bankAccount && bankAccount.glAccountId) {
        await autoPostBankTransaction(transaction, bankAccount, data.createdBy);
      }
    } catch (error) {
      console.error("Failed to auto-post bank transaction to GL:", error);
      // Don't fail the transaction if GL posting fails
    }

    return transaction;
  }

  /**
   * Get transactions by bank account
   */
  async getByBankAccount(bankAccountId: string): Promise<BankTransaction[]> {
    const transactions = await this.list();
    return transactions
      .filter((t) => t.bankAccountId === bankAccountId)
      .sort((a, b) => b.transactionDate.localeCompare(a.transactionDate));
  }

  /**
   * Get transactions by date range
   */
  async getByDateRange(
    bankAccountId: string,
    startDate: string,
    endDate: string
  ): Promise<BankTransaction[]> {
    const transactions = await this.getByBankAccount(bankAccountId);
    return transactions.filter(
      (t) => t.transactionDate >= startDate && t.transactionDate <= endDate
    );
  }

  /**
   * Get unreconciled transactions
   */
  async getUnreconciled(bankAccountId?: string): Promise<BankTransaction[]> {
    const transactions = await this.list();
    return transactions.filter(
      (t) =>
        !t.isReconciled && (!bankAccountId || t.bankAccountId === bankAccountId)
    );
  }

  /**
   * Match transaction with payment/expense
   */
  async matchTransaction(
    transactionId: string,
    matchType: "payment" | "expense" | "transfer",
    matchId: string
  ): Promise<BankTransaction> {
    const updateData: Partial<BankTransaction> = {};

    if (matchType === "payment") {
      updateData.matchedPaymentId = matchId;
    } else if (matchType === "expense") {
      updateData.matchedExpenseId = matchId;
    } else if (matchType === "transfer") {
      updateData.matchedTransferId = matchId;
    }

    return this.update(transactionId, updateData);
  }

  /**
   * Mark transaction as reconciled
   */
  async markReconciled(
    transactionId: string,
    reconciledBy: string
  ): Promise<BankTransaction> {
    return this.update(transactionId, {
      isReconciled: true,
      reconciledBy,
      reconciledAt: BigInt(Date.now()) * BigInt(1_000_000),
      status: "reconciled",
    });
  }

  /**
   * Import transactions from CSV
   */
  async importFromCSV(
    bankAccountId: string,
    csvData: Array<Record<string, string>>,
    importedBy: string
  ): Promise<{ imported: number; errors: string[] }> {
    const errors: string[] = [];
    let imported = 0;

    for (const row of csvData) {
      try {
        await this.recordTransaction({
          bankAccountId,
          transactionDate: row.date || "",
          valueDate: row.valueDate || row.date || "",
          description: row.description || "",
          debitAmount: parseFloat(row.debit || "0"),
          creditAmount: parseFloat(row.credit || "0"),
          balance: parseFloat(row.balance || "0"),
          transactionType: this.inferTransactionType(row.description || ""),
          reference: row.reference,
          createdBy: importedBy,
        });
        imported++;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        errors.push(`Row ${imported + 1}: ${errorMessage}`);
      }
    }

    return { imported, errors };
  }

  private inferTransactionType(
    description: string
  ): BankTransaction["transactionType"] {
    const desc = description.toLowerCase();
    if (desc.includes("transfer")) return "transfer";
    if (desc.includes("fee") || desc.includes("charge")) return "fee";
    if (desc.includes("interest")) return "interest";
    if (desc.includes("withdrawal") || desc.includes("debit"))
      return "withdrawal";
    return "deposit";
  }
}

// ============================================
// BANK STATEMENT SERVICE
// ============================================

export class BankStatementService extends BaseDataService<BankStatement> {
  constructor() {
    super(COLLECTIONS.BANK_STATEMENTS);
  }

  /**
   * Create bank statement
   */
  async createStatement(data: {
    bankAccountId: string;
    statementDate: string;
    periodStart: string;
    periodEnd: string;
    openingBalance: number;
    closingBalance: number;
    transactionIds: string[];
    createdBy: string;
  }): Promise<BankStatement> {
    const account = await bankAccountService.getById(data.bankAccountId);
    if (!account) {
      throw new Error("Bank account not found");
    }

    // Calculate totals from transactions
    const transactions = await Promise.all(
      data.transactionIds.map((id) => bankTransactionService.getById(id))
    );

    const totalDebits = transactions.reduce(
      (sum, t) => sum + (t?.debitAmount || 0),
      0
    );
    const totalCredits = transactions.reduce(
      (sum, t) => sum + (t?.creditAmount || 0),
      0
    );

    return this.create({
      ...data,
      bankAccountName: account.accountName,
      accountNumber: account.accountNumber,
      totalDebits,
      totalCredits,
      transactionCount: transactions.length,
      isReconciled: false,
    });
  }

  /**
   * Get statements by bank account
   */
  async getByBankAccount(bankAccountId: string): Promise<BankStatement[]> {
    const statements = await this.list();
    return statements
      .filter((s) => s.bankAccountId === bankAccountId)
      .sort((a, b) => b.statementDate.localeCompare(a.statementDate));
  }
}

// ============================================
// BANK RECONCILIATION SERVICE
// ============================================

export class BankReconciliationService extends BaseDataService<BankReconciliation> {
  constructor() {
    super(COLLECTIONS.BANK_RECONCILIATIONS);
  }

  /**
   * Start new reconciliation
   */
  async startReconciliation(data: {
    bankAccountId: string;
    reconciliationDate: string;
    periodStart: string;
    periodEnd: string;
    statementBalance: number;
    reconciledBy: string;
  }): Promise<BankReconciliation> {
    const account = await bankAccountService.getById(data.bankAccountId);
    if (!account) {
      throw new Error("Bank account not found");
    }

    return this.create({
      ...data,
      bankAccountName: account.accountName,
      bookBalance: account.balance,
      difference: data.statementBalance - account.balance,
      unreconciledDeposits: 0,
      unreconciledWithdrawals: 0,
      bankCharges: 0,
      outstandingChecks: 0,
      depositsInTransit: 0,
      adjustments: [],
      totalAdjustments: 0,
      matchedItemIds: [],
      unmatchedBankItems: [],
      unmatchedBookItems: [],
      status: "in-progress",
    });
  }

  /**
   * Complete reconciliation
   */
  async completeReconciliation(
    reconciliationId: string
  ): Promise<BankReconciliation> {
    const reconciliation = await this.getById(reconciliationId);
    if (!reconciliation) {
      throw new Error("Reconciliation not found");
    }

    // Mark all matched transactions as reconciled
    for (const transactionId of reconciliation.matchedItemIds) {
      await bankTransactionService.markReconciled(
        transactionId,
        reconciliation.reconciledBy
      );
    }

    return this.update(reconciliationId, {
      status: "completed",
    });
  }

  /**
   * Get reconciliations by bank account
   */
  async getByBankAccount(
    bankAccountId: string
  ): Promise<BankReconciliation[]> {
    const reconciliations = await this.list();
    return reconciliations
      .filter((r) => r.bankAccountId === bankAccountId)
      .sort((a, b) =>
        b.reconciliationDate.localeCompare(a.reconciliationDate)
      );
  }
}

// ============================================
// INTER-ACCOUNT TRANSFER SERVICE
// ============================================

export class InterAccountTransferService extends BaseDataService<InterAccountTransfer> {
  constructor() {
    super(COLLECTIONS.INTER_ACCOUNT_TRANSFERS);
  }

  /**
   * Create transfer between accounts
   */
  async createTransfer(data: {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    transferDate: string;
    description: string;
    purpose?: string;
    requiresApproval?: boolean;
    createdBy: string;
  }): Promise<InterAccountTransfer> {
    // Validate accounts
    const [fromAccount, toAccount] = await Promise.all([
      bankAccountService.getById(data.fromAccountId),
      bankAccountService.getById(data.toAccountId),
    ]);

    if (!fromAccount || !toAccount) {
      throw new Error("One or both accounts not found");
    }

    if (fromAccount.id === toAccount.id) {
      throw new Error("Cannot transfer to same account");
    }

    // Check sufficient balance
    if (fromAccount.balance < data.amount) {
      throw new Error("Insufficient balance in source account");
    }

    // Generate reference
    const reference = `TRF-${new Date().getFullYear()}-${nanoid()}`;

    const transfer = await this.create({
      ...data,
      fromAccountName: fromAccount.accountName,
      fromAccountNumber: fromAccount.accountNumber,
      toAccountName: toAccount.accountName,
      toAccountNumber: toAccount.accountNumber,
      reference,
      status: data.requiresApproval ? "pending" : "completed",
      requiresApproval: data.requiresApproval || false,
    });

    // If no approval required, execute immediately
    if (!data.requiresApproval) {
      await this.executeTransfer(transfer.id);
    }

    return transfer;
  }

  /**
   * Execute approved transfer
   */
  async executeTransfer(transferId: string): Promise<InterAccountTransfer> {
    const transfer = await this.getById(transferId);
    if (!transfer) {
      throw new Error("Transfer not found");
    }

    if (transfer.status !== "pending" && transfer.status !== "completed") {
      throw new Error("Transfer cannot be executed");
    }

    // Create journal entry for transfer
    const journalEntry = await journalEntryService.createJournalEntry({
      entryDate: transfer.transferDate,
      description: `Inter-account transfer: ${transfer.description}`,
      lines: [
        {
          accountId: transfer.toAccountId,
          accountName: transfer.toAccountName,
          accountCode: "1120",
          debit: transfer.amount,
          credit: 0,
          description: `Transfer from ${transfer.fromAccountName}`,
        },
        {
          accountId: transfer.fromAccountId,
          accountName: transfer.fromAccountName,
          accountCode: "1120",
          debit: 0,
          credit: transfer.amount,
          description: `Transfer to ${transfer.toAccountName}`,
        },
      ],
      referenceType: "other",
      referenceId: transferId,
      createdBy: transfer.createdBy,
    });

    // Update account balances
    await bankAccountService.updateBalance(
      transfer.fromAccountId,
      -transfer.amount
    );
    await bankAccountService.updateBalance(transfer.toAccountId, transfer.amount);

    return this.update(transferId, {
      status: "completed",
      journalEntryId: journalEntry.id,
    });
  }

  /**
   * Approve transfer
   */
  async approveTransfer(
    transferId: string,
    approvedBy: string
  ): Promise<InterAccountTransfer> {
    const transfer = await this.getById(transferId);
    if (!transfer) {
      throw new Error("Transfer not found");
    }

    if (transfer.status !== "pending") {
      throw new Error("Only pending transfers can be approved");
    }

    await this.update(transferId, {
      approvedBy,
      approvedAt: BigInt(Date.now()) * BigInt(1_000_000),
    });

    return this.executeTransfer(transferId);
  }

  /**
   * Cancel transfer
   */
  async cancelTransfer(transferId: string): Promise<InterAccountTransfer> {
    const transfer = await this.getById(transferId);
    if (!transfer) {
      throw new Error("Transfer not found");
    }

    if (transfer.status === "completed") {
      throw new Error("Cannot cancel completed transfer");
    }

    return this.update(transferId, {
      status: "cancelled",
    });
  }

  /**
   * Get transfers by bank account (from or to)
   */
  async getByBankAccount(
    bankAccountId: string
  ): Promise<InterAccountTransfer[]> {
    const transfers = await this.list();
    return transfers
      .filter(
        (t) =>
          t.fromAccountId === bankAccountId || t.toAccountId === bankAccountId
      )
      .sort((a, b) => b.transferDate.localeCompare(a.transferDate));
  }
}

// ============================================
// CASH FLOW PROJECTION SERVICE
// ============================================

export class CashFlowProjectionService extends BaseDataService<CashFlowProjection> {
  constructor() {
    super(COLLECTIONS.CASH_FLOW_PROJECTIONS);
  }

  /**
   * Create cash flow projection
   */
  async createProjection(data: {
    projectionDate: string;
    periodStart: string;
    periodEnd: string;
    openingBalance: number;
    projectedRevenue: number;
    projectedFeeCollection: number;
    projectedOtherIncome: number;
    projectedSalaries: number;
    projectedOperationalExpenses: number;
    projectedCapitalExpenditure: number;
    projectedLoanPayments: number;
    assumptions: string[];
    notes?: string;
    createdBy: string;
  }): Promise<CashFlowProjection> {
    const totalProjectedInflows =
      data.projectedRevenue +
      data.projectedFeeCollection +
      data.projectedOtherIncome;

    const totalProjectedOutflows =
      data.projectedSalaries +
      data.projectedOperationalExpenses +
      data.projectedCapitalExpenditure +
      data.projectedLoanPayments;

    const projectedNetCashFlow =
      totalProjectedInflows - totalProjectedOutflows;
    const projectedClosingBalance = data.openingBalance + projectedNetCashFlow;

    // Calculate days of cash on hand (assuming daily operational expense)
    const dailyOperationalExpense = data.projectedOperationalExpenses / 30; // Rough monthly average
    const daysOfCashOnHand =
      dailyOperationalExpense > 0
        ? Math.floor(projectedClosingBalance / dailyOperationalExpense)
        : 0;

    // Determine liquidity status
    let liquidityStatus: CashFlowProjection["liquidityStatus"];
    if (daysOfCashOnHand >= 60) {
      liquidityStatus = "healthy";
    } else if (daysOfCashOnHand >= 30) {
      liquidityStatus = "adequate";
    } else if (daysOfCashOnHand >= 15) {
      liquidityStatus = "tight";
    } else {
      liquidityStatus = "critical";
    }

    return this.create({
      ...data,
      totalProjectedInflows,
      totalProjectedOutflows,
      projectedNetCashFlow,
      projectedClosingBalance,
      daysOfCashOnHand,
      liquidityStatus,
    });
  }

  /**
   * Get projections by date range
   */
  async getByDateRange(
    startDate: string,
    endDate: string
  ): Promise<CashFlowProjection[]> {
    const projections = await this.list();
    return projections
      .filter((p) => p.projectionDate >= startDate && p.projectionDate <= endDate)
      .sort((a, b) => b.projectionDate.localeCompare(a.projectionDate));
  }
}

// Export singleton instances
export const bankTransactionService = new BankTransactionService();
export const bankStatementService = new BankStatementService();
export const bankReconciliationService = new BankReconciliationService();
export const interAccountTransferService = new InterAccountTransferService();
export const cashFlowProjectionService = new CashFlowProjectionService();
