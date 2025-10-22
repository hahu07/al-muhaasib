# Fee Structure Update Feature

## Problem Solved

When you edit a fee structure (change amounts, add/remove fees), the changes were not reflecting in:

- **Total Revenue Assigned** in dashboards
- Individual student fee assignments
- Student payment balances

This is because fee structures are templates, and student assignments are separate records.

## Solution Implemented

### 1. Backend Service Methods

Added to `feeStructureService` in `src/services/feeService.ts`:

#### `getAffectedStudents(structureId)`

Returns a list of students who have assignments based on this fee structure:

```typescript
{
  assignmentId: string;
  studentId: string;
  studentName: string;
  currentTotal: number; // What they're assigned now
  newTotal: number; // What the updated structure has
  difference: number; // The change (+/-)
  hasPaid: boolean; // Whether they've made payments
  amountPaid: number; // How much they've paid
}
```

#### `updateStudentAssignments(structureId, studentIds, options)`

Updates specific student assignments to match the new structure:

**Parameters:**

- `structureId` - The fee structure that was updated
- `studentIds` - Array of student IDs to update (empty = all students)
- `options`:
  - `updatePaidStudents` - Whether to update students who already paid (default: false)
  - `preservePayments` - Whether to preserve existing payment data (default: true)

**Returns:**

```typescript
{
  updated: number; // Number of students updated
  skipped: number; // Number skipped (e.g., already paid)
  errors: Array<{
    // Any errors that occurred
    studentId: string;
    error: string;
  }>;
}
```

**How it works:**

1. Gets the updated fee structure
2. Finds all student assignments for that class/term
3. For each selected student:
   - Calculates new fee items based on updated structure
   - Preserves existing payment data (amount paid per category)
   - Recalculates balances and status
   - Updates student's total fees assigned

### 2. UI Component

Created `UpdateStudentFeesModal` in `src/components/fees/UpdateStudentFeesModal.tsx`:

**Features:**

- Shows all affected students with current vs new fees
- Highlights the difference (+/- amount)
- Auto-selects unpaid students
- Option to include students who already paid
- Checkbox to select specific students
- "Select All" / "Deselect All" buttons
- Shows payment status per student
- Preserves existing payments when updating
- Shows success/error results after update

### 3. Integration

Added "Update Students" button (refresh icon) to each fee structure in `FeeStructureManagement.tsx`:

- Appears alongside Edit, Clone, and Delete buttons
- Opens modal showing affected students
- Allows selective update of assignments

## Usage Workflow

### Scenario: You increased tuition fees mid-term

1. **Edit the Fee Structure**
   - Go to Fees → Structures
   - Click Edit on the structure
   - Update fee amounts
   - Save changes
   - ✓ Structure is updated

2. **Update Student Assignments** (NEW!)
   - Click the **refresh icon** (Update Students button)
   - Modal opens showing all students in that class
   - You'll see:
     - Current fees vs new fees
     - The difference for each student
     - Payment status
3. **Select Students to Update**
   - Unpaid students are auto-selected
   - Optionally check "Include students who already paid"
   - Manually select/deselect specific students
   - Or use "Select All" / "Deselect All"

4. **Apply Updates**
   - Click "Update X Student(s)"
   - System updates their assignments
   - Preserves any payments already made
   - Recalculates balances
   - Updates dashboard totals

5. **Result**
   - Selected students now have updated fee assignments
   - Total Revenue Assigned reflects the new amounts
   - Student balances are recalculated
   - Payment records are preserved

## Key Benefits

### ✅ Selective Updates

- Update only specific students
- Skip students who have already paid
- Or force-update everyone including paid students

### ✅ Payment Preservation

- Existing payments are kept intact
- Only outstanding balances are adjusted
- Students who paid old amount won't lose credit

### ✅ Transparency

- See exactly who will be affected before updating
- See the difference (increase/decrease) per student
- Review payment status before deciding

### ✅ Audit Trail

- All updates are logged
- Errors are reported per student
- Success/failure summary shown

## Example Scenarios

### Scenario 1: Fee Increase for Unpaid Students

**Situation:** School increases fees from ₦50,000 to ₦60,000

**Steps:**

1. Edit fee structure (₦50,000 → ₦60,000)
2. Click "Update Students"
3. Leave "Include paid students" unchecked
4. Unpaid students auto-selected
5. Click "Update" → 20 students updated, 5 skipped (already paid)

**Result:**

- 20 unpaid students now owe ₦60,000
- 5 students who paid ₦50,000 keep their "paid" status

### Scenario 2: Apply Discount Retroactively

**Situation:** School gives ₦5,000 discount to all students

**Steps:**

1. Edit fee structure (₦50,000 → ₦45,000)
2. Click "Update Students"
3. Check "Include students who already paid"
4. Select all students
5. Click "Update"

**Result:**

- All students: ₦50,000 → ₦45,000
- Students who paid ₦50,000 now have ₦5,000 credit (overpaid)

### Scenario 3: Update Only Selected Students

**Situation:** Give scholarship to 3 specific students

**Steps:**

1. Create new structure with reduced fees
2. Click "Update Students"
3. Manually select only the 3 scholarship students
4. Click "Update"

**Result:**

- Only those 3 students get the new fee structure
- Others remain unchanged

## Technical Notes

### Payment Preservation Logic

When updating, the system:

1. Maps old fee items to new fee items by category
2. Preserves `amountPaid` for matching categories
3. Recalculates `balance` for each item
4. If new category added: starts with ₦0 paid
5. If category removed: payment is preserved in history

### Status Recalculation

After update, student status is:

- `unpaid` - No payments made
- `partial` - Some payment made, balance > 0
- `paid` - Fully paid, balance = 0
- `overpaid` - Paid more than required, balance < 0

### Student Total Recalculation

After updating assignments, system also updates:

- `student.totalFeesAssigned` - Sum of all assignments
- `student.balance` - Total fees - total paid
- Dashboard metrics automatically reflect changes

## Related Files

- `src/services/feeService.ts` - Backend logic
- `src/components/fees/UpdateStudentFeesModal.tsx` - UI component
- `src/components/fees/FeeStructureManagement.tsx` - Integration
- `src/types/index.ts` - Type definitions

## Future Enhancements

- [ ] Bulk update multiple fee structures at once
- [ ] Schedule updates for future date
- [ ] Send notifications to affected students/parents
- [ ] Export list of affected students before updating
- [ ] Undo/rollback functionality
- [ ] Automated updates when structure changes (optional setting)
