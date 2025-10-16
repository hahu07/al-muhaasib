# 🛡️ Juno Validation Hooks - Al-Muhaasib School Management

This document explains the comprehensive `assert_set_doc` validation hooks implemented for the Al-Muhaasib school management system using Juno's blockchain datastore.

## 🎯 **What are `assert_set_doc` Hooks?**

`assert_set_doc` hooks are **pre-validation functions** that run **BEFORE** any data is written to Juno's blockchain datastore. They provide:

- ✅ **Immediate validation** - Data is validated before storage
- 🚫 **Automatic rejection** - Invalid data never reaches the blockchain
- 💰 **Resource conservation** - No wasted blockchain storage or computation
- 🔄 **Rollback capability** - Failed operations are completely rolled back
- 📝 **Error propagation** - Descriptive errors flow back to frontend
- 🛡️ **Security first** - Cannot be bypassed by end users

## 🏗️ **Implementation Architecture**

### **Core Hook Structure**
```rust
#[assert_set_doc(collections = [
    "expenses", 
    "expense_categories", 
    "budgets", 
    "students", 
    "payments", 
    "fee_categories", 
    "fee_assignments",
    "staff",
    "classes"
])]
fn assert_set_doc(context: AssertSetDocContext) -> Result<(), String>
```

### **Validation Flow**
```
Frontend SDK Call (setDoc)
        ↓
   Juno Satellite
        ↓
  assert_set_doc Hook
        ↓
    Validation Logic
        ↓
   ✅ Success: Data written to blockchain
   ❌ Failure: Operation cancelled, error returned
```

## 💼 **Expense Management Validations**

### **1. Expense Document Validation**
```rust
fn validate_expense_document(context: &AssertSetDocContext) -> Result<(), String>
```

#### **Core Validations:**
- **Amount Constraints**: Must be > 0 and ≤ ₦100,000,000
- **Description**: Required, max 500 characters
- **Payment Method**: Must be one of `[cash, bank_transfer, cheque, pos]`
- **Reference Format**: Must start with `"EXP-"`
- **Date Format**: Must be `YYYY-MM-DD`
- **Status Transitions**: Enforces valid workflow states

#### **Status Transition Rules:**
```rust
pending → [approved, rejected]
approved → [paid]
rejected → [] // Terminal state
paid → []     // Terminal state
```

#### **Approval Validations:**
- **Approved expenses** must have `approved_by` and `approved_at` fields
- **Rejected expenses** must include rejection reason in `notes`
- **New expenses** must start with `"pending"` status

#### **Example Error Messages:**
```
❌ "Expense amount must be greater than 0"
❌ "Invalid status transition from 'paid' to 'pending'"
❌ "Expense category 'invalid-id' not found"
❌ "Approved expenses must have approved_by field set"
```

### **2. Expense Category Validation**
```rust
fn validate_expense_category_document(context: &AssertSetDocContext) -> Result<(), String>
```

#### **Validations:**
- **Name Uniqueness**: No duplicate category names
- **Name Length**: Max 100 characters
- **Category Type**: Validates predefined + custom categories
- **Budget Code Format**: `XXX-000` (e.g., `ADM-001`)
- **Description Length**: Max 1000 characters

#### **Custom Category Support:**
- Allows snake_case custom categories (e.g., `marketing_expenses`)
- Validates format: lowercase letters, numbers, underscores
- Cannot start/end with underscore

### **3. Budget Document Validation**
```rust
fn validate_budget_document(context: &AssertSetDocContext) -> Result<(), String>
```

#### **Validations:**
- **Academic Year Format**: `YYYY/YYYY` (e.g., `2024/2025`)
- **Term Validation**: `[first, second, third]`
- **Budget Items**: 1-50 items allowed
- **Amount Consistency**: Total budget = sum of allocated amounts
- **Status Validation**: `[draft, approved, active, closed]`

## 📚 **Student Management Validations**

### **Student Document Validation**
```rust
fn validate_student_document(context: &AssertSetDocContext) -> Result<(), String>
```

#### **Core Validations:**
- **Required Fields**: surname, firstname, student_id
- **Student ID Uniqueness**: No duplicate IDs across system
- **Gender Validation**: `[male, female, other]`
- **Date Formats**: birth date and admission date in `YYYY-MM-DD`
- **Guardian Info**: Name required, valid phone number
- **Email Format**: Valid email if provided

#### **Phone Number Validation:**
- Nigerian format: `070xxxxxxxx` (11 digits starting with 0)
- International: `234xxxxxxxxxx` (13 digits starting with 234)

## 💰 **Payment System Validations**

### **Payment Document Validation**
```rust
fn validate_payment_document(context: &AssertSetDocContext) -> Result<(), String>
```

#### **Validations:**
- **Amount**: Must be > 0
- **Payment Method**: `[cash, bank_transfer, pos, online, cheque]`
- **Status**: `[pending, confirmed, cancelled, refunded]`
- **Reference Format**: Must start with `"PAY-"`
- **Fee Allocations**: Must sum to total payment amount
- **At least one allocation** required

## 🔧 **Utility Validation Functions**

### **Date Format Validation**
```rust
fn is_valid_date_format(date: &str) -> bool
```
- Validates `YYYY-MM-DD` format
- Checks month (1-12) and day (1-31) ranges
- Used across all date fields

### **Phone Number Validation**
```rust
fn is_valid_phone_number(phone: &str) -> bool
```
- Supports Nigerian local and international formats
- Strips common separators `[' ', '-', '+', '(', ')']`
- Validates numeric content

### **Academic Year Validation**
```rust
fn is_valid_academic_year(year: &str) -> bool
```
- Format: `YYYY/YYYY`
- Validates second year = first year + 1
- Example: `2024/2025` ✅, `2024/2026` ❌

### **Budget Code Validation**
```rust
fn is_valid_budget_code(code: &str) -> bool
```
- Format: `XXX-000` (3 letters, dash, 3 numbers)
- Example: `ADM-001`, `UTL-002` ✅

## 🚀 **Integration with Frontend**

### **Error Handling**
When validation fails, the error message flows back to the frontend:

```typescript
try {
  await expenseService.createExpense(expenseData);
} catch (error) {
  // Error from assert_set_doc hook
  console.error("Validation failed:", error.message);
  // Example: "Expense amount must be greater than 0"
}
```

### **Status Transition Enforcement**
```typescript
// This will be rejected by the validation hook
await expenseService.markAsPaid(rejectedExpenseId);
// Error: "Invalid status transition from 'rejected' to 'paid'"
```

### **Category Validation**
```typescript
// This will be rejected for duplicate name
await expenseCategoryService.createCategory({
  name: "Utilities", // Already exists
  category: "utilities"
});
// Error: "Category name 'Utilities' already exists"
```

## 🎯 **Benefits for Al-Muhaasib System**

### **1. Data Integrity**
- ✅ All expense amounts are positive
- ✅ Status transitions follow business rules
- ✅ No duplicate student IDs or category names
- ✅ Proper date and reference formats

### **2. Business Rule Enforcement**
- ✅ Expenses must be approved before payment
- ✅ Rejected expenses cannot be paid
- ✅ Budget totals must be consistent
- ✅ Payment allocations must sum correctly

### **3. Security & Validation**
- ✅ Cannot bypass validation from frontend
- ✅ Invalid data never reaches blockchain
- ✅ Descriptive error messages for debugging
- ✅ Automatic rollback on validation failure

### **4. Performance Optimization**
- ✅ Validation happens before expensive blockchain writes
- ✅ Failed operations don't waste resources
- ✅ Immediate feedback to users
- ✅ No orphaned or corrupted data

## 🛠️ **Development & Testing**

### **Building the Satellite**
```bash
# Navigate to satellite directory
cd src/satellite

# Build the Wasm module
cargo build --target wasm32-unknown-unknown --release
```

### **Testing Validations**
```typescript
// Test expense validation
try {
  const expense = await expenseService.createExpense({
    amount: -100, // Invalid amount
    description: "",
    // ... other fields
  });
} catch (error) {
  console.log("✅ Validation working:", error.message);
  // "Expense amount must be greater than 0"
}
```

### **Deploying to Juno**
```bash
# Deploy the satellite with validation hooks
juno satellite deploy
```

## 📈 **Future Enhancements**

### **Advanced Validations**
- Role-based permission checks
- Cross-collection referential integrity
- Advanced business rule validation
- Audit trail requirements

### **Integration Opportunities**
- Budget availability checks during expense creation
- Student enrollment status validation for payments
- Staff permission validation for approvals
- Academic calendar integration for date validation

---

## 🎉 **Summary**

The `assert_set_doc` validation hooks provide **bulletproof data validation** for the Al-Muhaasib school management system by:

1. **Preventing invalid data** from reaching the blockchain
2. **Enforcing business rules** at the data layer
3. **Providing immediate feedback** to users
4. **Ensuring data consistency** across all operations
5. **Conserving resources** by failing fast

These hooks integrate seamlessly with the existing expense management frontend while providing enterprise-grade data validation and integrity guarantees! 🛡️✨