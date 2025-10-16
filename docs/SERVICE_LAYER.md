# AL-MUHAASIB Service Layer Documentation

## Overview

The Al-Muhaasib service layer provides a comprehensive, type-safe API for managing all aspects of school accounting and management. All services extend from `BaseDataService` which provides standard CRUD operations with built-in caching.

## Architecture

### Base Services

#### `BaseDataService<T>`
Generic CRUD service with caching support:
- `create(data)` - Create new record
- `getById(id)` - Get single record with caching
- `list(filter?)` - List all records with optional filtering
- `count(filter?)` - Count records
- `update(id, data)` - Update existing record
- `delete(id)` - Delete record
- Built-in 3-minute cache (optimized for mobile)
- Automatic cache invalidation on mutations

---

## School Management Services

### 1. ClassService (`classService.ts`)

Manages school classes and enrollment.

**Methods:**
- `getByAcademicYear(year)` - Get classes for academic year
- `getByLevel(level)` - Get classes by level (nursery/primary/jss/sss)
- `getClassesWithCapacity()` - Get classes with available slots
- `updateEnrollment(classId, change)` - Update enrollment count
- `getByNameAndSection(name, section, year)` - Find specific class
- `getActiveClasses()` - Get all active classes
- `getEnrollmentStats()` - Get enrollment statistics

**Example:**
```typescript
import { classService } from '@/services';

// Get classes for current academic year
const classes = await classService.getByAcademicYear('2024/2025');

// Get enrollment stats
const stats = await classService.getEnrollmentStats();
console.log(`Utilization: ${stats.utilizationRate}%`);
```

---

## Revenue Management Services

### 2. Fee Services (`feeService.ts`)

Three services for comprehensive fee management:

#### FeeCategoryService
Manage fee categories (tuition, uniforms, feeding, etc.)

**Methods:**
- `getActiveFeeCategories()` - Get active categories
- `getByType(type)` - Get categories by type

#### FeeStructureService
Define fee structures per class and term

**Methods:**
- `createFeeStructure(data)` - Create with automatic total calculation
- `updateFeeStructure(id, data)` - Update with recalculation
- `getByClassAndTerm(classId, year, term)` - Get specific structure
- `getByAcademicYear(year)` - Get all structures for year
- `cloneFeeStructure(sourceId, targetClassId, year, term)` - Clone to another class

#### StudentFeeAssignmentService
Assign and track fees per student

**Methods:**
- `assignFeesToStudent(...)` - Assign fees to student
- `getByStudentId(studentId)` - Get student's fee assignments
- `getByClassAndTerm(classId, year, term)` - Get assignments for class
- `getByStatus(status)` - Filter by payment status
- `recordPayment(assignmentId, amount, allocations)` - Record payment
- `getPaymentSummary(year, term)` - Get payment summary

**Example:**
```typescript
import { feeStructureService, studentFeeAssignmentService } from '@/services';

// Create fee structure for a class
const structure = await feeStructureService.createFeeStructure({
  classId: 'class123',
  className: 'JSS 1A',
  academicYear: '2024/2025',
  term: 'first',
  feeItems: [
    { categoryId: 'cat1', categoryName: 'Tuition', type: 'tuition', amount: 50000, isMandatory: true },
    { categoryId: 'cat2', categoryName: 'Uniform', type: 'uniform', amount: 15000, isMandatory: true }
  ],
  isActive: true
});

// Assign fees to a student
const assignment = await studentFeeAssignmentService.assignFeesToStudent(
  'student123',
  'John Doe',
  'class123',
  'JSS 1A',
  structure.id,
  '2024/2025',
  'first',
  structure.feeItems
);

// Record payment
await studentFeeAssignmentService.recordPayment(
  assignment.id,
  30000,
  [
    { categoryId: 'cat1', amount: 25000 },
    { categoryId: 'cat2', amount: 5000 }
  ]
);
```

### 3. EnhancedPaymentService (`paymentService.ts`)

Comprehensive payment processing and analytics.

**Methods:**
- `recordPayment(data)` - Record payment with automatic reference generation
- `getByStudentId(studentId)` - Get student's payments
- `getByDateRange(start, end)` - Get payments in date range
- `getByPaymentMethod(method)` - Filter by payment method
- `getByStatus(status)` - Filter by status
- `cancelPayment(paymentId, reason)` - Cancel payment
- `getPaymentAnalytics(start, end)` - Detailed analytics
- `getRevenueSummary(start?, end?)` - Revenue summary with monthly trends
- `generateReceipt(paymentId)` - Generate receipt data

**Example:**
```typescript
import { enhancedPaymentService } from '@/services';

// Record a payment
const payment = await enhancedPaymentService.recordPayment({
  studentId: 'student123',
  studentName: 'John Doe',
  classId: 'class123',
  className: 'JSS 1A',
  feeAssignmentId: 'assignment123',
  amount: 30000,
  paymentMethod: 'bank_transfer',
  paymentDate: '2024-10-12',
  feeAllocations: [
    { categoryId: 'cat1', categoryName: 'Tuition', type: 'tuition', amount: 25000 },
    { categoryId: 'cat2', categoryName: 'Uniform', type: 'uniform', amount: 5000 }
  ],
  recordedBy: 'user123'
});

// Get analytics
const analytics = await enhancedPaymentService.getPaymentAnalytics(
  '2024-01-01',
  '2024-12-31'
);
console.log(`Total revenue: ₦${analytics.totalAmount.toLocaleString()}`);
console.log(`Average payment: ₦${analytics.averagePayment.toLocaleString()}`);
```

---

## Expense Management Services

### 4. Expense Services (`expenseService.ts`)

#### ExpenseService
Record and track operational expenses

**Methods:**
- `createExpense(data)` - Create expense with auto reference
- `getByStatus(status)` - Filter by status (pending/approved/paid)
- `getByCategory(category)` - Filter by expense category
- `getByDateRange(start, end)` - Get expenses in range
- `approveExpense(expenseId, approvedBy)` - Approve expense
- `rejectExpense(expenseId, reason)` - Reject expense
- `markAsPaid(expenseId)` - Mark as paid
- `getExpenseSummary(start?, end?)` - Get expense summary
- `getPendingApprovals()` - Get pending approvals

#### BudgetService
Budget planning and tracking

**Methods:**
- `createBudget(data)` - Create budget with auto calculations
- `getByAcademicYearAndTerm(year, term?)` - Get budget for period
- `approveBudget(budgetId, approvedBy)` - Approve budget
- `activateBudget(budgetId)` - Activate budget
- `updateSpending(budgetId, categoryId, amount)` - Record spending
- `getBudgetUtilization(budgetId)` - Get utilization stats
- `checkBudgetAvailability(year, categoryId, amount, term?)` - Check budget

**Example:**
```typescript
import { expenseService, budgetService } from '@/services';

// Create expense
const expense = await expenseService.createExpense({
  categoryId: 'cat1',
  categoryName: 'Utilities',
  category: 'utilities',
  amount: 25000,
  description: 'Electricity bill for September',
  paymentMethod: 'bank_transfer',
  paymentDate: '2024-09-30',
  vendorName: 'Power Company',
  recordedBy: 'user123'
});

// Check budget before approval
const budgetCheck = await budgetService.checkBudgetAvailability(
  '2024/2025',
  'cat1',
  25000,
  'first'
);

if (budgetCheck.available) {
  await expenseService.approveExpense(expense.id, 'admin123');
}
```

---

## Staff & Payroll Services

### 5. Staff Services (`staffService.ts`)

#### StaffService
Manage staff members

**Methods:**
- `getActiveStaff()` - Get active staff
- `getByEmploymentType(type)` - Filter by employment type
- `getByDepartment(dept)` - Filter by department
- `getByStaffNumber(number)` - Find by staff number
- `deactivateStaff(staffId)` / `reactivateStaff(staffId)` - Manage status
- `calculateTotalCompensation(staff)` - Calculate total pay
- `getStaffSummary()` - Get staff statistics

#### SalaryPaymentService
Process and track salary payments

**Methods:**
- `calculateSalary(data)` - Calculate gross, deductions, net pay
- `processSalaryPayment(data)` - Process salary with auto reference
- `getByStaffId(staffId)` - Get staff's salary history
- `getByMonthAndYear(month, year)` - Get payroll for period
- `getByStatus(status)` - Filter by status
- `approveSalaryPayment(paymentId, approvedBy)` - Approve
- `markAsPaid(paymentId)` - Mark as paid
- `hasBeenPaid(staffId, month, year)` - Check if paid
- `getPayrollSummary(month, year)` - Get payroll summary
- `getStaffPaymentHistory(staffId, limit?)` - Get history
- `calculateYTDEarnings(staffId, year)` - Year-to-date earnings
- `generatePayslip(paymentId)` - Generate payslip

**Example:**
```typescript
import { salaryPaymentService } from '@/services';

// Process salary
const salary = await salaryPaymentService.processSalaryPayment({
  staffId: 'staff123',
  staffName: 'Jane Smith',
  staffNumber: 'ST001',
  month: '10',
  year: '2024',
  basicSalary: 150000,
  allowances: [
    { name: 'Housing', amount: 50000 },
    { name: 'Transport', amount: 30000 }
  ],
  deductions: [
    { name: 'Tax', amount: 15000 },
    { name: 'Pension', amount: 7500 }
  ],
  paymentMethod: 'bank_transfer',
  paymentDate: '2024-10-31',
  recordedBy: 'user123'
});

// Get payroll summary
const summary = await salaryPaymentService.getPayrollSummary('10', '2024');
console.log(`Total payroll: ₦${summary.totalNetPay.toLocaleString()}`);
```

---

## Asset Management Services

### 6. Asset Services (`assetService.ts`)

Six services for comprehensive asset management:

#### FixedAssetService
Track fixed assets

**Methods:**
- `createAsset(data)` - Create with auto asset code
- `getByCategory(category)` / `getByStatus(status)` - Filter assets
- `getActiveAssets()` - Get active assets
- `getByLocation(location)` - Filter by location
- `updateDepreciation(assetId, amount)` - Update depreciation
- `calculateStraightLineDepreciation(asset)` - Calculate depreciation
- `getAssetSummary()` - Get asset statistics

#### CapitalExpenditureService
Manage capital projects

**Methods:**
- `createCapEx(data)` - Create CapEx project
- `getByStatus(status)` - Filter by status
- `approveCapEx(capExId, approvedBy)` - Approve project
- `recordPayment(capExId, amount)` - Record payment
- `getCapExSummary()` - Get summary

#### DepreciationService, AssetMaintenanceService, AssetDisposalService, AssetValuationService
Complete lifecycle management

---

## Accounting Services

### 7. Accounting Services (`accountingService.ts`)

#### ChartOfAccountsService
Manage chart of accounts

**Methods:**
- `getActiveAccounts()` - Get active accounts
- `getByAccountType(type)` - Filter by type
- `getParentAccounts()` / `getChildAccounts(parentId)` - Hierarchy
- `getByAccountCode(code)` - Find by code
- `getHierarchicalAccounts()` - Get full hierarchy
- `initializeDefaultAccounts()` - Initialize default chart

#### JournalEntryService
Double-entry bookkeeping

**Methods:**
- `createJournalEntry(data)` - Create balanced entry
- `getByStatus(status)` / `getByDateRange(start, end)` - Filter entries
- `getByReference(type, id)` - Find by reference
- `postJournalEntry(entryId)` - Post entry
- `createPaymentEntry(data)` - Auto-generate for payment
- `createExpenseEntry(data)` - Auto-generate for expense
- `createSalaryEntry(data)` - Auto-generate for salary
- `createDepreciationEntry(data)` - Auto-generate for depreciation
- `getTrialBalance(asOfDate?)` - Generate trial balance

#### BankAccountService
Manage bank accounts

**Methods:**
- `getActiveAccounts()` - Get active bank accounts
- `getByAccountNumber(number)` - Find by account number
- `updateBalance(accountId, amount)` - Update balance
- `getTotalBalance()` - Total across all accounts
- `getBalanceSummary()` - Summary by account type

**Example:**
```typescript
import { journalEntryService, chartOfAccountsService } from '@/services';

// Initialize chart of accounts
await chartOfAccountsService.initializeDefaultAccounts();

// Create payment journal entry
const entry = await journalEntryService.createPaymentEntry({
  paymentDate: '2024-10-12',
  amount: 50000,
  paymentId: 'payment123',
  studentName: 'John Doe',
  bankAccountId: 'bank123',
  revenueAccountId: 'revenue123',
  createdBy: 'user123'
});

// Post the entry
await journalEntryService.postJournalEntry(entry.id);

// Get trial balance
const trialBalance = await journalEntryService.getTrialBalance();
console.log(`Balanced: ${trialBalance.isBalanced}`);
```

---

## Features

### Common Features Across All Services

1. **Type Safety**: Full TypeScript support
2. **Caching**: 3-minute cache for read operations
3. **Auto-generation**: Reference numbers, codes, calculations
4. **Validation**: Built-in business logic validation
5. **Error Handling**: Consistent error classes
6. **Audit Trail**: CreatedAt, UpdatedAt timestamps
7. **Optimistic Locking**: Version tracking for updates

### Mobile Optimization

- Shorter cache TTL (3 minutes)
- Limited cache size (50 entries)
- Efficient filtering and querying

---

## Usage Patterns

### Import Services
```typescript
import {
  classService,
  feeStructureService,
  studentFeeAssignmentService,
  enhancedPaymentService,
  expenseService,
  budgetService,
  staffService,
  salaryPaymentService,
  fixedAssetService,
  chartOfAccountsService,
  journalEntryService,
  bankAccountService
} from '@/services';
```

### Error Handling
```typescript
try {
  const payment = await enhancedPaymentService.recordPayment(data);
} catch (error) {
  if (error instanceof DataServiceError) {
    console.error('Service error:', error.message, error.code);
  }
}
```

### Transactions Pattern
```typescript
// Record payment + update assignment + create journal entry
const payment = await enhancedPaymentService.recordPayment(paymentData);
await studentFeeAssignmentService.recordPayment(assignmentId, amount, allocations);
await journalEntryService.createPaymentEntry(journalData);
```

---

## Best Practices

1. **Always validate before mutations**
2. **Use service methods instead of direct BaseDataService**
3. **Clear cache after bulk operations**
4. **Use transactions for related operations**
5. **Handle errors gracefully**
6. **Use TypeScript types for type safety**
7. **Leverage automatic calculations**

---

## Next Steps

- Implement service tests
- Add more helper methods as needed
- Create aggregation services for complex queries
- Add real-time subscriptions
- Implement batch operations
