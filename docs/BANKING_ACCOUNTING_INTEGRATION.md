# Banking & Accounting Module Integration Guide

## Current Status

### ✅ What's Implemented
- **Banking Module**: Operational bank account tracking (bank_accounts collection)
- **Accounting Module**: Chart of Accounts (GL) with double-entry bookkeeping
- **Type Support**: `BankAccount` now has optional GL mapping fields (`glAccountId`, `glAccountCode`, `glAccountName`)

### ⚠️ What's Missing
- **No automatic linkage** between bank accounts and GL accounts
- **No auto-posting** of bank transactions to journal entries
- **Manual reconciliation** between banking and accounting balances

---

## Architecture: How It Should Work

```
┌────────────────────────────────────────────────────────────┐
│                  CHART OF ACCOUNTS (GL)                     │
│                                                             │
│  1000 - Assets                                             │
│  └─ 1100 - Current Assets                                  │
│     ├─ 1110 - Cash in Bank - GTBank (GL Account)          │
│     ├─ 1120 - Cash in Bank - First Bank (GL Account)      │
│     └─ 1130 - Petty Cash (GL Account)                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ glAccountId link
                      ▼
┌────────────────────────────────────────────────────────────┐
│                    BANK ACCOUNTS                            │
│                                                             │
│  GTBank - School Current Account                           │
│  ├─ glAccountId: "acc_1110_gtbank"  ◄─ Links to GL       │
│  ├─ Balance: ₦10,000,000                                  │
│  └─ Account #: 0123456789                                  │
│                                                             │
│  First Bank - Savings                                      │
│  ├─ glAccountId: "acc_1120_firstbank"  ◄─ Links to GL    │
│  ├─ Balance: ₦2,000,000                                   │
│  └─ Account #: 2011234567                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Roadmap

### Phase 1: Manual Linking (Immediate)

**Current State**: Bank accounts can be created independently

**Action Required**:
1. User creates GL account in **Chart of Accounts** (e.g., "1110 - Cash in Bank - GTBank")
2. User creates Bank Account in **Banking Module** with same name
3. **Manual tracking** - User must remember which bank account maps to which GL account

**Pro**: Simple, works immediately
**Con**: No auto-sync, prone to errors

---

### Phase 2: Explicit GL Account Selection (Recommended Next Step)

**Update AddBankAccountForm to include GL account dropdown**:

```tsx
// Add GL Account Selection Field
<div className="md:col-span-2">
  <label>
    Link to General Ledger Account (Optional)
  </label>
  <select 
    value={formData.glAccountId}
    onChange={(e) => setFormData({ ...formData, glAccountId: e.target.value })}
  >
    <option value="">-- No GL Account Link --</option>
    {bankGLAccounts.map((account) => (
      <option key={account.id} value={account.id}>
        {account.accountCode} - {account.accountName}
      </option>
    ))}
  </select>
  <p className="text-xs text-gray-500">
    Link this bank account to a GL account for automatic journal entry posting
  </p>
</div>
```

**When user creates bank account**:
```javascript
await bankAccountService.create({
  bankName: "GTBank",
  accountName: "School Current Account",
  accountNumber: "0123456789",
  accountType: "current",
  balance: 10000000,
  glAccountId: "acc_1110_gtbank",  // ← Linked to GL
  glAccountCode: "1110",
  glAccountName: "Cash in Bank - GTBank",
  isActive: true,
});
```

---

### Phase 3: Auto-Posting to Journal Entries (Advanced)

**When a bank transaction is created**:

```javascript
// 1. User deposits ₦500,000 in GTBank
const transaction = await bankTransactionService.recordTransaction({
  bankAccountId: "bank_gtbank_001",
  transactionType: "deposit",
  creditAmount: 500000,
  description: "Student fee collection",
  // ... other fields
});

// 2. If bank account has glAccountId, auto-post to accounting
if (bankAccount.glAccountId) {
  await journalEntryService.createJournalEntry({
    entryDate: transaction.transactionDate,
    description: `Bank ${transaction.transactionType}: ${transaction.description}`,
    lines: [
      {
        accountId: bankAccount.glAccountId,  // 1110 - Cash in Bank
        accountCode: bankAccount.glAccountCode,
        accountName: bankAccount.glAccountName,
        debit: transaction.creditAmount,  // Money IN = Debit to asset
        credit: 0,
      },
      {
        accountId: suspenseAccountId,  // 1190 - Suspense (or specific revenue account)
        accountCode: "1190",
        accountName: "Suspense Account",
        debit: 0,
        credit: transaction.creditAmount,
      },
    ],
    referenceType: "bank_transaction",
    referenceId: transaction.id,
    status: "posted",
  });
}
```

---

### Phase 4: Full Reconciliation (Production-Grade)

**Bank Reconciliation Process**:

1. **GL Balance** (from Accounting Module)
   ```
   Account: 1110 - Cash in Bank - GTBank
   Balance: ₦10,000,000
   ```

2. **Bank Balance** (from Banking Module)
   ```
   GTBank - Current Account
   Balance: ₦10,000,000
   ```

3. **Reconciliation**:
   - Match bank transactions with journal entries
   - Identify unreconciled items (outstanding checks, deposits in transit)
   - Create adjusting entries for bank charges, interest, etc.

---

## Migration Strategy

### Option A: Keep Separate (Current Approach)
**Best for**: Schools that want simple bank tracking without complex accounting

- Banking Module = Operational cash tracking
- Accounting Module = Financial reporting
- Manual reconciliation at month-end

### Option B: Integrate (Recommended for Production)
**Best for**: Schools that need full accounting integration

1. **Add GL account linking** to AddBankAccountForm
2. **Create auto-posting service** for bank transactions → journal entries
3. **Build reconciliation UI** to match bank vs GL balances

---

## Quick Start: Manual Integration (Today)

### Step 1: Create GL Account
```
Accounting → Chart of Accounts → Add Account
Code: 1110
Name: Cash in Bank - GTBank
Type: Asset
Category: Current Asset
```

### Step 2: Create Bank Account
```
Banking → Add Account
Bank Name: GTBank
Account Name: School Current Account
Account Number: 0123456789
Opening Balance: ₦10,000,000
```

### Step 3: Manual Reconciliation (Month-End)
```
1. Get bank balance from Banking dashboard: ₦10,000,000
2. Get GL balance from Trial Balance: ₦10,000,000
3. If they match → ✅ Reconciled
4. If they don't match → Investigate differences
```

---

## Next Steps

1. ✅ **Type definitions updated** - `BankAccount` now supports GL linking
2. ⏳ **Update AddBankAccountForm** - Add GL account selection dropdown
3. ⏳ **Create auto-posting service** - Bank transactions → Journal entries
4. ⏳ **Build reconciliation UI** - Visual GL vs Bank balance comparison

---

## Summary

**Current State**: Banking and Accounting are separate modules
**Future State**: Fully integrated with auto-posting and reconciliation
**Recommendation**: Start with Phase 2 (explicit GL account selection) for proper production use
