# Expense Approval Workflow - Complete Guide

This document explains how expenses move through the approval process in the Al-Muhaasib school management system, from creation to payment.

## 🎯 Overview

The expense approval system follows a structured workflow to ensure proper financial controls and audit trails:

```
📝 CREATE → 👔 APPROVE/REJECT → 💰 PAY
```

### Status Flow
- **PENDING** → **APPROVED** → **PAID** ✅ (Success path)
- **PENDING** → **REJECTED** ❌ (Rejection path)

## 📋 Step-by-Step Workflow

### Step 1: 📝 Expense Creation (PENDING)
**Who:** Any staff member  
**Status:** `pending`  

When a staff member creates an expense:
1. Fill out the expense form with all required details
2. System automatically assigns status: `pending`
3. Generates unique reference (e.g., `EXP-2024-ABC12345`)
4. Expense appears in admin approval queue

**Required Information:**
- Category and amount
- Description and purpose
- Vendor details
- Payment method and date
- Supporting documents (optional)

### Step 2: 👔 Admin Review (APPROVE/REJECT)
**Who:** Admin users only  
**Status:** `approved` or `rejected`  

Admins can see all pending expenses and take action:

#### ✅ **APPROVAL Process**
```typescript
await expenseService.approveExpense(expenseId, adminUserId);
```
- Status changes to: `approved`
- Records approver ID and timestamp
- Moves to payment queue
- Email notification sent (optional)

#### ❌ **REJECTION Process**
```typescript
await expenseService.rejectExpense(expenseId, rejectionReason);
```
- Status changes to: `rejected`  
- Rejection reason recorded in notes
- Process ends (expense cannot be paid)
- Staff member notified of rejection

### Step 3: 💰 Payment Processing (PAID)
**Who:** Finance team or Admin  
**Status:** `paid`  

For approved expenses only:
```typescript
await expenseService.markAsPaid(expenseId);
```
- Status changes to: `paid`
- Payment recorded with timestamp
- Appears in financial reports
- Expense workflow complete

## 🔐 Role-Based Access Control

### 📚 **Staff Members**
- ✅ Create new expenses
- ✅ View their own expenses
- ❌ Cannot approve/reject
- ❌ Cannot mark as paid

### 👔 **Admin Users**
- ✅ All staff permissions
- ✅ View all pending expenses
- ✅ Approve or reject expenses
- ✅ Mark approved expenses as paid
- ✅ Access approval dashboard

### 💼 **Finance Team** (if separate role)
- ✅ View approved expenses
- ✅ Mark as paid
- ❌ Cannot approve/reject

## 🖥️ User Interface Components

### 1. **ExpenseRecordingForm**
```typescript
<ExpenseRecordingForm 
  onSuccess={(expenseId) => console.log('Expense created:', expenseId)}
  onCancel={() => setShowForm(false)}
/>
```
- Used by all staff to create expenses
- Validates input and checks budget availability
- Shows category selection with dynamic options

### 2. **ExpenseList** 
```typescript
<ExpenseList 
  showActions={user?.role === 'admin'}
  onExpenseSelect={(expense) => setSelected(expense)}
/>
```
- Shows all expenses with filtering options
- Admin users see approve/reject buttons
- Real-time status updates

### 3. **ExpenseApprovalDashboard** (New!)
```typescript
<ExpenseApprovalDashboard />
```
- Dedicated admin dashboard for approvals
- Statistics and priority indicators
- Bulk approval capabilities
- Filtering by amount and category

## 📊 Service Layer Methods

### Core Approval Methods
```typescript
// Get pending expenses
const pending = await expenseService.getPendingApprovals();

// Approve expense
const approved = await expenseService.approveExpense(expenseId, adminId);

// Reject expense
const rejected = await expenseService.rejectExpense(expenseId, reason);

// Mark as paid
const paid = await expenseService.markAsPaid(expenseId);

// Get by status
const approvedExpenses = await expenseService.getByStatus('approved');
```

### Bulk Operations
```typescript
// Bulk approve multiple expenses
await ExpenseApprovalWorkflow.bulkApprove(expenseIds, adminId);

// Get approval statistics
const stats = await ExpenseApprovalWorkflow.getApprovalStats();
```

## 💡 Smart Features

### 🚨 **Priority Detection**
- High-value expenses (>₦50,000) flagged as "High Priority"
- Sorted by amount (highest first) in approval queue
- Visual indicators for urgent items

### 🔍 **Filtering & Search**
- Filter by amount ranges (low/medium/high)
- Filter by expense category
- Search by description, vendor, reference
- Date range filtering

### 📈 **Dashboard Analytics**
- Total pending approval count and value
- Approved expenses awaiting payment
- High priority expense alerts
- Average expense amount calculations

### 🔄 **Bulk Operations**
- Approve multiple expenses at once
- Filter and approve visible expenses
- Bulk payment processing

## 📝 Example Usage

### Creating and Approving Expenses
```typescript
// 1. Staff creates expense
const expense = await expenseService.createExpense({
  categoryId: 'utilities-category-id',
  categoryName: 'Utilities',
  category: 'utilities',
  amount: 25000,
  description: 'Monthly electricity bill',
  paymentMethod: 'bank_transfer',
  paymentDate: '2024-12-01',
  vendorName: 'Power Company Ltd',
  recordedBy: 'staff-user-001'
});
// Status: 'pending'

// 2. Admin approves
const approved = await expenseService.approveExpense(
  expense.id, 
  'admin-user-001'
);
// Status: 'approved', approvedBy: 'admin-user-001', approvedAt: timestamp

// 3. Finance marks as paid
const paid = await expenseService.markAsPaid(expense.id);
// Status: 'paid'
```

### Using the Approval Dashboard
```typescript
// Check what needs approval
const pendingCount = await expenseService.getByStatus('pending');
console.log(`${pendingCount.length} expenses need approval`);

// Get approval statistics
const stats = await ExpenseApprovalWorkflow.getApprovalStats();
console.log('Approval Stats:', stats);
```

## 🔔 Integration Points

### Dashboard Notifications
- Show pending approval count in admin dashboard
- High-value expense alerts
- Overdue approval warnings

### Budget Integration
- Check budget availability before approval
- Update budget spending after payment
- Budget overrun alerts

### Reporting
- Expense approval timeline reports
- Admin performance metrics
- Financial audit trails

## 🛡️ Security & Audit

### Audit Trail
Every expense maintains complete history:
- Who created it and when
- Who approved/rejected it and when
- Rejection reasons
- Payment processing details

### Data Integrity
- Status transitions are controlled
- Cannot skip approval steps
- Rejected expenses cannot be paid
- Timestamps and user tracking on all actions

### Access Control
- Role-based UI rendering
- Server-side permission validation
- Audit logs for all actions

## 🚀 Getting Started

1. **Set up categories:**
```bash
# Run the category initialization
npm run expense:init-categories
```

2. **Add to your admin dashboard:**
```tsx
import { ExpenseApprovalDashboard } from '@/components/expenses/ExpenseApprovalDashboard';

// In your admin dashboard
<ExpenseApprovalDashboard />
```

3. **Test the workflow:**
```bash
# Run the demo script
npm run expense:demo-approval
```

## 📚 Related Components

- **ExpenseRecordingForm** - Create new expenses
- **ExpenseList** - View and manage expenses
- **ExpenseApprovalDashboard** - Admin approval interface
- **ExpenseCategoryManager** - Manage expense categories
- **ExpenseAnalytics** - Reporting and analytics

---

*This workflow ensures proper financial controls while maintaining efficiency and transparency in expense management.*