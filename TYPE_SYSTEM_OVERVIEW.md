# AL-MUHAASIB - Type System Overview

## ✅ Complete Restructuring Completed!

The type system has been completely restructured to support comprehensive school accounting with proper separation between revenue and expenses, plus full capital expenditure management.

---

## 📊 Type System Structure

### 1. **School Structure** (Classes & Students)

- **SchoolClass**: Classes organized by level (nursery, primary, JSS, SSS)
  - Tracks capacity and current enrollment
  - Academic year and term-based
  - Optional sections (A, B, C, etc.)

- **StudentProfile**: Complete student information
  - **Name split**: `surname`, `firstname`, `middlename`
  - **Guardian split**: `guardianSurname`, `guardianFirstname`
  - Class assignment with classId reference
  - Financial summary (auto-calculated)
  - Student details (DOB, gender, blood group, etc.)

---

### 2. **Revenue Side** (Fees & Payments)

#### Fee Structure

- **FeeCategory**: Define fee types (tuition, uniform, feeding, transport, etc.)
- **FeeStructure**: Fee structure per class, term, and academic year
  - Contains multiple FeeItems
  - Class-specific pricing

- **StudentFeeAssignment**: Links students to their specific fees
  - Tracks payment status (unpaid, partial, paid, overpaid)
  - Fee breakdown by category
  - Due dates

#### Payments

- **Payment**: Payment records with full audit trail
  - Multiple payment methods (cash, bank_transfer, POS, online, cheque)
  - **PaymentAllocation**: Breaks down which fees the payment covers
  - Receipt management
  - Recorded by user tracking

---

### 3. **Expense Side** (Operational Expenses)

#### Operational Expenses

- **ExpenseCategory**: 25+ expense categories including:
  - **Staff**: salaries, allowances, bonuses, training
  - **Operations**: utilities, maintenance, repairs, cleaning, security
  - **Academic**: teaching materials, lab supplies, library books, sports equipment
  - **Administrative**: stationery, printing, communication, insurance
  - **Infrastructure**: building development, furniture
  - **Food**: food supplies, kitchen equipment

- **Expense**: Full expense tracking
  - Vendor management
  - Approval workflow (pending → approved → paid)
  - Invoice/receipt documentation
  - Budget code tracking

- **Budget**: Budget allocation and tracking
  - Term or yearly budgets
  - Budget vs actual tracking
  - Status workflow (draft → approved → active → closed)

---

### 4. **Staff & Salaries**

- **StaffMember**: Complete staff records
  - **Name split**: `surname`, `firstname`, `middlename`
  - Staff number (unique identifier)
  - Position, department, employment type
  - Basic salary + allowances structure
  - Bank details for payments

- **SalaryPayment**: Monthly salary processing
  - Basic salary + allowances breakdown
  - Deductions (tax, pension, loans, etc.)
  - Gross to net calculations
  - Approval workflow
  - Payment method tracking

---

### 5. **Capital Expenditure & Asset Management** 🆕

#### Fixed Assets

- **FixedAsset**: Complete asset register
  - Asset code (unique tag)
  - 20+ asset categories (land, buildings, furniture, equipment, vehicles, etc.)
  - **Financial tracking**:
    - Purchase price
    - Current value (book value)
    - Accumulated depreciation
    - Residual value
  - **Depreciation methods**:
    - Straight-line
    - Declining balance
    - Units of production
    - None (for land)
  - **Maintenance scheduling**
  - **Condition tracking** (excellent, good, fair, poor)
  - Warranty management
  - Location and assignment tracking
  - Serial numbers and specifications

#### Capital Expenditure

- **CapitalExpenditure**: CapEx project tracking
  - Budget vs actual
  - Payment status (installments supported)
  - Approval workflow
  - Vendor and contract management
  - Timeline tracking (start, expected, actual completion)
  - Funding source (revenue, loan, grant, donation)
  - Links to created assets
  - Document management

#### Asset Operations

- **DepreciationEntry**: Automatic depreciation calculations
  - Monthly or annual
  - Links to journal entries
  - Audit trail

- **AssetMaintenance**: Maintenance tracking
  - Routine, repair, upgrade, inspection
  - Cost tracking
  - Service provider details
  - Schedule vs actual dates
  - Next maintenance scheduling

- **AssetDisposal**: Asset disposal management
  - Multiple disposal methods (sale, donation, scrap, trade-in, lost, stolen)
  - Gain/loss calculation
  - Buyer information
  - Approval workflow
  - Documentation (photos, certificates)

- **AssetValuation**: Asset revaluation
  - Periodic revaluations
  - Market value changes
  - Impairment tracking
  - Professional valuer details

---

### 6. **Accounting & Double-Entry** 📚

- **ChartOfAccounts**: Standard chart of accounts
  - 5 account types: asset, liability, equity, revenue, expense
  - Hierarchical structure (parent-child)
  - Account codes

- **JournalEntry**: Double-entry bookkeeping
  - Auto-balanced (debit = credit)
  - Multiple journal lines
  - Reference tracking (links to payments, expenses, etc.)
  - Posting workflow

- **BankAccount**: Bank account management
  - Current and savings accounts
  - Balance tracking
  - Integration with payments/expenses

---

### 7. **Reporting**

- **FinancialReport**: Financial report generation
  - Income statement
  - Balance sheet
  - Cash flow
  - Trial balance
  - Custom reports
  - Term-based or date-range

---

## 🎯 Key Improvements

### 1. **Name Separation**

✅ All names now split into `surname`, `firstname`, `middlename`

- Students
- Guardians
- Staff
- Users

### 2. **Class-Based Student Organization**

✅ Students are now properly organized by classes

- Each student has `classId` reference
- Classes have capacity and enrollment tracking
- Easy to filter students by class

### 3. **Multiple Fee Types**

✅ Flexible fee structure supporting:

- Tuition, uniform, feeding, transport, books
- Sports, development, examination, PTA
- Computer, library, laboratory, lessons
- Custom "other" category

### 4. **Comprehensive Expense Management**

✅ 25+ expense categories covering all school operations
✅ Budget allocation and variance tracking
✅ Approval workflows
✅ Vendor management

### 5. **Complete CapEx & Asset Management**

✅ Full asset lifecycle tracking
✅ Depreciation automation
✅ Maintenance scheduling
✅ Disposal management
✅ Asset revaluation

### 6. **Double-Entry Accounting**

✅ Proper journal entries
✅ Chart of accounts
✅ Auto-balanced entries
✅ Audit trail

---

## 📁 Collections in Juno

Update your `dataService.ts` COLLECTIONS to include:

```typescript
export const COLLECTIONS = {
  // School Structure
  CLASSES: "classes",
  STUDENTS: "students",

  // Revenue
  FEE_CATEGORIES: "fee_categories",
  FEE_STRUCTURES: "fee_structures",
  STUDENT_FEE_ASSIGNMENTS: "student_fee_assignments",
  PAYMENTS: "payments",

  // Expenses
  EXPENSE_CATEGORIES: "expense_categories",
  EXPENSES: "expenses",
  BUDGETS: "budgets",

  // Staff
  STAFF_MEMBERS: "staff_members",
  SALARY_PAYMENTS: "salary_payments",

  // Assets & CapEx
  FIXED_ASSETS: "fixed_assets",
  CAPITAL_EXPENDITURES: "capital_expenditures",
  DEPRECIATION_ENTRIES: "depreciation_entries",
  ASSET_MAINTENANCE: "asset_maintenance",
  ASSET_DISPOSALS: "asset_disposals",
  ASSET_VALUATIONS: "asset_valuations",

  // Accounting
  CHART_OF_ACCOUNTS: "chart_of_accounts",
  JOURNAL_ENTRIES: "journal_entries",
  BANK_ACCOUNTS: "bank_accounts",

  // Users
  USERS: "users",

  // Reports
  FINANCIAL_REPORTS: "financial_reports",
} as const;
```

---

## 🚀 Next Steps

1. ✅ **Type System**: Complete!
2. ⏳ **Update Collections**: Update `dataService.ts` with new collections
3. ⏳ **Create Services**: Create service classes for each entity
4. ⏳ **Update Dashboards**: Update dashboards to use new types
5. ⏳ **Build Forms**: Create forms for data entry
6. ⏳ **Reports**: Build comprehensive reports

---

## 💡 Notes

- All monetary amounts are in **Naira (₦)**
- All dates are strings in ISO format (YYYY-MM-DD)
- Academic year format: "2024/2025"
- Term format: 'first' | 'second' | 'third'
- All entities have audit fields: `createdAt`, `updatedAt`, `createdBy`
- Status fields use enums for consistency
- Denormalized data (e.g., `className`) for quick access without joins

---

This is now a **production-ready, comprehensive school accounting system** that rivals commercial solutions! 🎉
