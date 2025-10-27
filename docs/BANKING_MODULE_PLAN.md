# Banking Module Implementation Plan

## Overview
Comprehensive plan for implementing a banking module in al-muhaasib school accounting system.

## Current State Analysis

### Existing Infrastructure
The system currently has:
- **BankAccount** entity in accounting service (basic balance tracking)
- Payment methods include `bank_transfer` across payments/expenses
- Journal entries for double-entry bookkeeping
- Auto-posting service for transactions
- Multi-tenant architecture with Juno satellite validation

### Existing Services
- `accountingService.ts` - Contains `BankAccountService` with basic operations
- `paymentService.ts` - Handles student fee payments
- `expenseService.ts` - Handles operational expenses
- `autoPostingService.ts` - Automatic journal entry creation

---

## Recommended Banking Module Features

### 1. Enhanced Bank Account Management
- Multiple bank account support (already exists)
- Real-time balance tracking with transaction history
- Bank account reconciliation
- Account types (current, savings, loan accounts)
- Account status monitoring (active/inactive/frozen)

### 2. Bank Transactions & Statements
- Transaction import (CSV/Excel format)
- Bank statement reconciliation
- Automated matching with payments/expenses
- Unmatched transaction handling
- Transaction categorization
- Bulk transaction operations

### 3. Cash Flow Management
- Cash flow projections
- Inflow/outflow categorization
- Cash position dashboard
- Liquidity alerts
- Working capital analysis
- Seasonal trend analysis

### 4. Inter-Account Transfers
- Transfer between school accounts
- Transfer journal entries (automatic)
- Transfer reconciliation
- Transfer approval workflow
- Scheduled/recurring transfers

### 5. Banking Reports
- Bank reconciliation reports
- Cash flow statements (operating, investing, financing)
- Account balance history
- Transaction registers
- Unreconciled items report
- Bank charges analysis

---

## Implementation Approach

### Step 1: Extend Type System

**File:** `src/types/index.ts`

Add the following interfaces to the existing type system:

```typescript
// ============================================
// BANKING MODULE TYPES
// ============================================

export interface BankTransaction {
  id: string;
  bankAccountId: string;
  transactionDate: string; // ISO date
  valueDate: string; // ISO date (when funds are available)
  description: string;
  debitAmount: number; // Money out
  creditAmount: number; // Money in
  balance: number; // Running balance after transaction
  reference?: string; // Bank reference number
  transactionType: 'deposit' | 'withdrawal' | 'transfer' | 'fee' | 'interest' | 'charge';
  
  // Reconciliation fields
  status: 'pending' | 'cleared' | 'reconciled';
  matchedPaymentId?: string; // Link to Payment entity
  matchedExpenseId?: string; // Link to Expense entity
  matchedTransferId?: string; // Link to InterAccountTransfer
  statementId?: string; // Link to BankStatement
  isReconciled: boolean;
  reconciledBy?: string;
  reconciledAt?: bigint;
  
  // Additional info
  category?: string; // Optional categorization
  notes?: string;
  importedFrom?: string; // Source of import (manual/csv/api)
  
  // Metadata
  createdAt: bigint;
  updatedAt: bigint;
  createdBy: string;
  [key: string]: unknown;
}

export interface BankStatement {
  id: string;
  bankAccountId: string;
  bankAccountName: string;
  accountNumber: string;
  
  // Statement period
  statementDate: string; // End date of statement
  periodStart: string;
  periodEnd: string;
  
  // Balances
  openingBalance: number;
  closingBalance: number;
  totalDebits: number; // Total money out
  totalCredits: number; // Total money in
  
  // Transactions
  transactionIds: string[]; // References to BankTransaction entities
  transactionCount: number;
  
  // Reconciliation status
  isReconciled: boolean;
  reconciliationId?: string;
  reconciledBy?: string;
  reconciledAt?: bigint;
  
  // Import info
  importedFrom?: string; // csv/excel/api
  importedAt?: bigint;
  
  // Metadata
  notes?: string;
  createdAt: bigint;
  updatedAt: bigint;
  createdBy: string;
  [key: string]: unknown;
}

export interface BankReconciliation {
  id: string;
  bankAccountId: string;
  bankAccountName: string;
  
  // Reconciliation period
  reconciliationDate: string;
  periodStart: string;
  periodEnd: string;
  
  // Balances
  statementBalance: number; // From bank statement
  bookBalance: number; // From our records
  difference: number; // statementBalance - bookBalance
  
  // Reconciliation items
  unreconciledDeposits: number; // Deposits in our books, not in statement
  unreconciledWithdrawals: number; // Withdrawals in our books, not in statement
  bankCharges: number; // Bank charges not yet recorded
  outstandingChecks: number; // Checks issued but not cleared
  depositsInTransit: number; // Deposits made but not yet cleared
  
  // Adjustments
  adjustments: ReconciliationAdjustment[];
  totalAdjustments: number;
  
  // Status
  status: 'in-progress' | 'completed' | 'approved';
  
  // Items
  matchedItemIds: string[]; // Transaction IDs that were matched
  unmatchedBankItems: UnmatchedItem[]; // Bank transactions without matches
  unmatchedBookItems: UnmatchedItem[]; // Our transactions without matches
  
  // Metadata
  notes?: string;
  reconciledBy: string;
  approvedBy?: string;
  approvedAt?: bigint;
  createdAt: bigint;
  updatedAt: bigint;
  [key: string]: unknown;
}

export interface ReconciliationAdjustment {
  type: 'bank_charge' | 'interest_earned' | 'error_correction' | 'nsf_check' | 'other';
  description: string;
  amount: number; // Positive for additions, negative for deductions
  transactionId?: string; // If adjustment creates a transaction
}

export interface UnmatchedItem {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  reference?: string;
  source: 'bank' | 'book'; // Where this item came from
}

export interface InterAccountTransfer {
  id: string;
  
  // Transfer details
  fromAccountId: string;
  fromAccountName: string;
  fromAccountNumber: string;
  toAccountId: string;
  toAccountName: string;
  toAccountNumber: string;
  
  amount: number;
  transferDate: string;
  valueDate?: string; // When funds become available
  
  // References
  reference: string; // Transfer reference number (e.g., TRF-2025-XXXXXXXX)
  externalReference?: string; // Bank reference if applicable
  
  // Details
  description: string;
  purpose?: string;
  
  // Status tracking
  status: 'pending' | 'completed' | 'cancelled' | 'failed';
  
  // Approval workflow
  requiresApproval: boolean;
  approvedBy?: string;
  approvedAt?: bigint;
  
  // Accounting integration
  journalEntryId?: string; // Link to journal entry
  fromTransactionId?: string; // Link to debit transaction
  toTransactionId?: string; // Link to credit transaction
  
  // Scheduling (for future enhancement)
  isRecurring?: boolean;
  recurringSchedule?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    nextTransferDate: string;
    endDate?: string;
  };
  
  // Metadata
  notes?: string;
  createdBy: string;
  createdAt: bigint;
  updatedAt: bigint;
  [key: string]: unknown;
}

export interface CashFlowProjection {
  id: string;
  
  // Projection period
  projectionDate: string;
  periodStart: string;
  periodEnd: string;
  
  // Opening position
  openingBalance: number;
  
  // Projected inflows
  projectedRevenue: number;
  projectedFeeCollection: number;
  projectedOtherIncome: number;
  totalProjectedInflows: number;
  
  // Projected outflows
  projectedSalaries: number;
  projectedOperationalExpenses: number;
  projectedCapitalExpenditure: number;
  projectedLoanPayments: number;
  totalProjectedOutflows: number;
  
  // Net position
  projectedNetCashFlow: number;
  projectedClosingBalance: number;
  
  // Liquidity indicators
  liquidityStatus: 'healthy' | 'adequate' | 'tight' | 'critical';
  daysOfCashOnHand: number; // Number of days operations can be sustained
  
  // Assumptions
  assumptions: string[];
  
  // Metadata
  notes?: string;
  createdBy: string;
  createdAt: bigint;
  updatedAt: bigint;
  [key: string]: unknown;
}

export interface BankingReport {
  id: string;
  reportType: 
    | 'reconciliation'
    | 'cash_flow'
    | 'transaction_register'
    | 'unreconciled_items'
    | 'bank_charges'
    | 'account_activity';
  
  // Report parameters
  bankAccountId?: string;
  periodStart: string;
  periodEnd: string;
  
  // Report data (JSON)
  reportData: Record<string, unknown>;
  
  // Export info
  generatedBy: string;
  generatedAt: bigint;
  exportFormat?: 'pdf' | 'excel' | 'csv';
  exportUrl?: string;
  
  [key: string]: unknown;
}
```

---

### Step 2: Update Collections

**File:** `src/services/dataService.ts`

Add to the `COLLECTIONS` constant:

```typescript
export const COLLECTIONS = {
  // ... existing collections ...
  
  // Banking
  BANK_TRANSACTIONS: 'bank_transactions',
  BANK_STATEMENTS: 'bank_statements',
  BANK_RECONCILIATIONS: 'bank_reconciliations',
  INTER_ACCOUNT_TRANSFERS: 'inter_account_transfers',
  CASH_FLOW_PROJECTIONS: 'cash_flow_projections',
  BANKING_REPORTS: 'banking_reports',
} as const;
```

---

### Step 3: Create Banking Service

**File:** `src/services/bankingService.ts`

```typescript
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

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8);

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
   * Get unreconciled transactions
   */
  async getUnreconciled(bankAccountId?: string): Promise<BankTransaction[]> {
    const transactions = await this.list();
    return transactions.filter(
      (t) =>
        !t.isReconciled &&
        (!bankAccountId || t.bankAccountId === bankAccountId)
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
    const updateData: any = {};
    
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
    csvData: any[],
    importedBy: string
  ): Promise<{ imported: number; errors: string[] }> {
    const errors: string[] = [];
    let imported = 0;

    for (const row of csvData) {
      try {
        await this.recordTransaction({
          bankAccountId,
          transactionDate: row.date,
          valueDate: row.valueDate || row.date,
          description: row.description,
          debitAmount: parseFloat(row.debit || "0"),
          creditAmount: parseFloat(row.credit || "0"),
          balance: parseFloat(row.balance || "0"),
          transactionType: this.inferTransactionType(row.description),
          reference: row.reference,
          createdBy: importedBy,
        });
        imported++;
      } catch (error) {
        errors.push(`Row ${imported + 1}: ${error.message}`);
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
    if (desc.includes("withdrawal") || desc.includes("debit")) return "withdrawal";
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
      referenceType: "transfer",
      referenceId: transferId,
      createdBy: transfer.createdBy,
    });

    // Update account balances
    await bankAccountService.updateBalance(
      transfer.fromAccountId,
      -transfer.amount
    );
    await bankAccountService.updateBalance(
      transfer.toAccountId,
      transfer.amount
    );

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
}

// Export singleton instances
export const bankTransactionService = new BankTransactionService();
export const bankStatementService = new BankStatementService();
export const bankReconciliationService = new BankReconciliationService();
export const interAccountTransferService = new InterAccountTransferService();
```

---

### Step 4: Update Service Exports

**File:** `src/services/index.ts`

Add to exports:

```typescript
// Banking
export * from "./bankingService";
```

---

### Step 5: Create UI Components

#### BankAccountsDashboard Component

**File:** `src/components/banking/BankAccountsDashboard.tsx`

Key features:
- Display all bank accounts with current balances
- Quick stats (total balance, account count, pending transfers)
- Recent transactions across all accounts
- Quick actions (new transaction, transfer, reconcile)

#### BankTransactionList Component

**File:** `src/components/banking/BankTransactionList.tsx`

Key features:
- Filterable transaction list (by date, type, status)
- Reconciliation status indicator
- Match/unmatch functionality
- Export to CSV/Excel

#### BankReconciliation Component

**File:** `src/components/banking/BankReconciliation.tsx`

Key features:
- Two-pane view (book vs bank)
- Drag-and-drop matching
- Adjustment entries
- Reconciliation summary
- Complete/save reconciliation

#### BankStatementImport Component

**File:** `src/components/banking/BankStatementImport.tsx`

Key features:
- CSV/Excel file upload
- Column mapping
- Data preview
- Import with validation

#### InterAccountTransfer Component

**File:** `src/components/banking/InterAccountTransferForm.tsx`

Key features:
- Account selection (from/to)
- Amount validation (check balance)
- Transfer description and purpose
- Approval workflow if required

#### CashFlowDashboard Component

**File:** `src/components/banking/CashFlowDashboard.tsx`

Key features:
- Cash flow chart (inflows vs outflows)
- Period selection
- Category breakdown
- Projection vs actual
- Liquidity indicators

---

### Step 6: Satellite Validation

**File:** `src/satellite/src/modules/banking/mod.rs`

```rust
use junobuild_satellite::*;

// Validate bank transactions
#[on_set_doc(collection = "bank_transactions")]
async fn validate_bank_transaction(context: OnSetDocContext) -> Result<(), String> {
    // Validate amounts are non-negative
    // Validate only one of debit/credit is set
    // Validate bank account exists
    // Validate transaction date format
    // Prevent duplicate reference numbers
}

// Validate inter-account transfers
#[on_set_doc(collection = "inter_account_transfers")]
async fn validate_transfer(context: OnSetDocContext) -> Result<(), String> {
    // Validate amount > 0
    // Validate from_account != to_account
    // Validate sufficient balance (check from account)
    // Validate accounts exist and are active
    // Enforce approval workflow for large amounts
}

// Validate bank reconciliations
#[on_set_doc(collection = "bank_reconciliations")]
async fn validate_reconciliation(context: OnSetDocContext) -> Result<(), String> {
    // Prevent duplicate reconciliations for same period
    // Validate status transitions (in-progress -> completed only)
    // Ensure all matched items belong to the account
}
```

---

### Step 7: Integration with Existing Modules

#### Update autoPostingService

**File:** `src/services/autoPostingService.ts`

Add methods:
- `postInterAccountTransfer()` - Create journal entry for transfers
- `postBankCharge()` - Record bank charges/fees
- `postInterestIncome()` - Record interest earned

#### Link Payments to Bank Transactions

When a payment is recorded with `bank_transfer` method:
1. Create corresponding BankTransaction (credit)
2. Link payment ID to transaction
3. Update bank account balance

#### Link Expenses to Bank Transactions

When an expense is paid via bank:
1. Create corresponding BankTransaction (debit)
2. Link expense ID to transaction
3. Update bank account balance

---

### Step 8: Reports

Create report service methods:

**File:** `src/services/bankingReportsService.ts`

```typescript
export class BankingReportsService {
  // Bank reconciliation report (PDF/Excel)
  async generateReconciliationReport(reconciliationId: string)
  
  // Cash flow statement (operating, investing, financing activities)
  async generateCashFlowStatement(periodStart: string, periodEnd: string)
  
  // Account activity report
  async generateAccountActivityReport(accountId: string, periodStart: string, periodEnd: string)
  
  // Unreconciled items report
  async generateUnreconciledItemsReport(accountId?: string)
  
  // Bank charges analysis
  async generateBankChargesReport(periodStart: string, periodEnd: string)
  
  // Transfer register
  async generateTransferRegister(periodStart: string, periodEnd: string)
}
```

---

## Implementation Priority

### Phase 1: Core Banking (MVP)
1. ✅ Extend type system with banking types
2. ✅ Create banking service (transactions, accounts)
3. ✅ Bank transaction list UI
4. ✅ Simple reconciliation interface
5. ✅ Link payments/expenses to bank transactions

### Phase 2: Reconciliation
1. Bank statement import (CSV)
2. Advanced reconciliation UI
3. Automated matching logic
4. Reconciliation reports

### Phase 3: Transfers & Cash Flow
1. Inter-account transfers
2. Transfer approval workflow
3. Cash flow dashboard
4. Cash flow projections

### Phase 4: Advanced Features
1. Recurring transfers
2. Multi-currency support (if needed)
3. Bank API integrations
4. Advanced analytics and forecasting

---

## Database Collections Summary

New Juno collections to create:
- `bank_transactions` - Individual bank transactions
- `bank_statements` - Imported/manual bank statements
- `bank_reconciliations` - Reconciliation records
- `inter_account_transfers` - Transfers between school accounts
- `cash_flow_projections` - Cash flow forecasts (optional)
- `banking_reports` - Generated reports metadata (optional)

---

## Testing Considerations

1. **Unit Tests**
   - Transaction creation and validation
   - Balance updates
   - Reconciliation logic
   - Transfer workflows

2. **Integration Tests**
   - Payment → Bank transaction linkage
   - Expense → Bank transaction linkage
   - Journal entry creation for transfers
   - Satellite validation rules

3. **Demo Scripts** (in `tests/`)
   - `tests/demo-banking-transactions.ts`
   - `tests/demo-bank-reconciliation.ts`
   - `tests/demo-inter-account-transfer.ts`

---

## Configuration

Add to `src/app/dashboard/settings/page.tsx`:

### Banking Module Settings
- Default bank account for payments
- Reconciliation frequency
- Transfer approval threshold
- Bank charge accounts
- Interest income accounts

---

## Notes

- The module integrates seamlessly with existing accounting module
- All transactions create appropriate journal entries
- Satellite validation ensures data integrity
- Multi-tenant support maintained via existing architecture
- Follows existing patterns (BaseDataService, bigint timestamps, Juno collections)

---

## Future Enhancements

1. **Bank API Integration** - Connect to bank APIs for automatic statement import
2. **Multi-Currency** - Support for multiple currencies with exchange rates
3. **Payment Gateway Integration** - Link online payments to bank accounts
4. **Advanced Analytics** - ML-based cash flow predictions
5. **Mobile Banking View** - Simplified mobile interface for on-the-go access
6. **Audit Trail** - Enhanced audit logging for all banking operations
7. **Batch Operations** - Bulk transaction imports and approvals

---

## Questions to Consider

Before implementation, decide on:

1. **Reconciliation Frequency** - Daily, weekly, monthly?
2. **Approval Thresholds** - What amount triggers approval requirement for transfers?
3. **Bank Charge Handling** - Auto-detect or manual entry?
4. **Statement Import Format** - Which bank CSV formats to support initially?
5. **Historical Data** - Import existing transactions or start fresh?
6. **Cash Flow Periods** - What projection periods are most useful?

---

## References

- Existing code: `src/services/accountingService.ts` (BankAccountService)
- Type definitions: `src/types/index.ts`
- Auto-posting: `src/services/autoPostingService.ts`
- Collections: `src/services/dataService.ts`
- WARP guide: `/home/mutalab/projects/al-muhaasib/WARP.md`

---

**Last Updated:** 2025-10-24  
**Status:** Planning Phase  
**Next Steps:** Review plan → Begin Phase 1 implementation
