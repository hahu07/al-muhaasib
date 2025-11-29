# Scholarship, Discount & Optional Fees Implementation

## Overview

This document describes the implementation of scholarships, fee discounts/waivers, and optional fees in the Al-Muhaasib school accounting system.

## Features Implemented

### 1. **Scholarships & Discounts**

Scholarships allow schools to provide financial assistance to students through:

- **Percentage-based discounts**: e.g., 25% off total fees
- **Fixed amount discounts**: e.g., ₦50,000 off
- **Full waivers**: 100% fee waiver

#### Scholarship Types

```typescript
export interface Scholarship {
  id: string;
  name: string;
  description?: string;
  type: "percentage" | "fixed_amount" | "full_waiver";
  
  // Discount values
  percentageOff?: number; // 0-100 for percentage type
  fixedAmountOff?: number; // Fixed amount for fixed_amount type
  
  // Applicability
  applicableTo: "all" | "specific_classes" | "specific_students";
  classIds?: string[];
  studentIds?: string[];
  
  // Fee type restrictions
  applicableToFeeTypes?: FeeType[]; // Which fees can be discounted
  excludedFeeTypes?: FeeType[]; // Fees that should not be discounted
  
  // Validity
  startDate: string;
  endDate?: string;
  academicYear?: string;
  terms?: ("first" | "second" | "third")[];
  
  // Limits
  maxBeneficiaries?: number;
  currentBeneficiaries?: number;
  maxDiscountPerStudent?: number;
  
  // Criteria
  criteria?: {
    minAttendancePercentage?: number;
    minGradeAverage?: number;
    requiresApproval?: boolean;
    requiresDocumentation?: boolean;
  };
  
  status: "active" | "suspended" | "expired";
  sponsor?: string;
}
```

### 2. **Optional Fees**

Fees like feeding, extracurricular activities, etc., can be marked as optional. Students can opt in or out of these fees.

#### Fee Structure Enhancement

```typescript
export interface FeeItem {
  categoryId: string;
  categoryName: string;
  type: FeeType;
  amount: number;
  isMandatory: boolean;
  isOptional?: boolean; // NEW: Mark fee as optional
}

export interface StudentFeeItem {
  // ... existing fields
  isOptional?: boolean;
  isSelected?: boolean; // Whether student selected this optional fee
}
```

### 3. **Enhanced Fee Assignments**

Student fee assignments now track original amounts, discounts, and scholarships:

```typescript
export interface StudentFeeAssignment {
  // ... existing fields
  
  // Scholarship tracking
  scholarshipId?: string;
  scholarshipName?: string;
  scholarshipType?: "percentage" | "fixed_amount" | "waiver";
  scholarshipValue?: number;
  discountAmount?: number;
  
  // Amount tracking
  originalAmount?: number; // Before discounts
  totalAmount: number; // After discounts
  amountPaid: number;
  balance: number;
}
```

## Usage Examples

### Creating a Scholarship

```typescript
import { scholarshipService } from "@/services";

// Create a 50% scholarship for Primary 1 students
const scholarship = await scholarshipService.create({
  name: "Merit Scholarship - Primary 1",
  description: "50% discount for top-performing Primary 1 students",
  type: "percentage",
  percentageOff: 50,
  applicableTo: "specific_classes",
  classIds: ["primary-1-class-id"],
  startDate: "2024-09-01",
  endDate: "2025-08-31",
  academicYear: "2024/2025",
  terms: ["first", "second", "third"],
  maxBeneficiaries: 10,
  currentBeneficiaries: 0,
  status: "active",
  createdBy: "user-id",
});
```

### Assigning Fees with Scholarship

```typescript
import { studentFeeAssignmentService } from "@/services";

// Assign fees to a student with a scholarship
await studentFeeAssignmentService.assignFeesToStudent(
  studentId,
  studentName,
  classId,
  className,
  feeStructureId,
  academicYear,
  term,
  feeItems,
  dueDate,
  {
    scholarshipId: "scholarship-id",
    selectedOptionalFees: ["feeding-fee-id"], // Student opts into feeding
  }
);
```

### Assigning Fees with Optional Fee Selection

```typescript
// Create fee structure with optional fees
const feeStructure = await feeStructureService.create({
  classId: "primary-1",
  className: "Primary 1",
  academicYear: "2024/2025",
  term: "first",
  feeItems: [
    {
      categoryId: "tuition-id",
      categoryName: "Tuition",
      type: "tuition",
      amount: 150000,
      isMandatory: true,
      isOptional: false,
    },
    {
      categoryId: "feeding-id",
      categoryName: "Feeding",
      type: "feeding",
      amount: 30000,
      isMandatory: false,
      isOptional: true, // Optional fee
    },
    {
      categoryId: "transport-id",
      categoryName: "Transport",
      type: "transport",
      amount: 25000,
      isMandatory: false,
      isOptional: true, // Optional fee
    },
  ],
});

// Assign with selected optional fees
await studentFeeAssignmentService.assignFeesToStudent(
  studentId,
  studentName,
  classId,
  className,
  feeStructure.id,
  academicYear,
  term,
  feeStructure.feeItems,
  undefined,
  {
    selectedOptionalFees: ["feeding-id"], // Student only opts into feeding, not transport
  }
);
```

### Getting Applicable Scholarships

```typescript
import { scholarshipService } from "@/services";

// Get scholarships applicable to a specific student
const scholarships = await scholarshipService.getApplicableScholarships(
  studentId,
  classId,
  academicYear,
  term
);

// Calculate discount
scholarships.forEach((scholarship) => {
  const discount = scholarshipService.calculateDiscount(
    scholarship,
    totalFeeAmount
  );
  console.log(`${scholarship.name}: ₦${discount} discount`);
});
```

## Service Layer

### ScholarshipService

Located in `src/services/scholarshipService.ts`

**Key Methods:**
- `getActiveScholarships()`: Get all currently active scholarships
- `getApplicableScholarships(studentId, classId, academicYear, term)`: Get scholarships applicable to a specific student
- `calculateDiscount(scholarship, totalAmount, feeType?)`: Calculate discount amount
- `incrementBeneficiaries(scholarshipId)`: Increment beneficiary count
- `decrementBeneficiaries(scholarshipId)`: Decrement beneficiary count
- `getByAcademicYear(academicYear)`: Get scholarships for academic year

### ScholarshipApplicationService

Manages scholarship applications for students requiring approval.

**Key Methods:**
- `getByStudentId(studentId)`: Get applications by student
- `getPendingApplications()`: Get all pending applications
- `approveApplication(applicationId, approvedBy, ...)`: Approve an application
- `rejectApplication(applicationId, rejectedBy, ...)`: Reject an application
- `hasActiveScholarship(studentId, academicYear, term)`: Check if student has active scholarship

### Updated FeeService

The `assignFeesToStudent` method now accepts optional parameters:

```typescript
async assignFeesToStudent(
  // ... existing parameters
  options?: {
    scholarshipId?: string;
    selectedOptionalFees?: string[]; // categoryIds
  }
): Promise<StudentFeeAssignment>
```

## Satellite Validation

Server-side validation rules enforce data integrity in `src/satellite/src/modules/fees.rs`:

### Scholarship Validation

- ✅ Name is required and non-empty
- ✅ Type must be valid: "percentage", "fixed_amount", or "full_waiver"
- ✅ Percentage must be 0-100
- ✅ Fixed amount must be > 0
- ✅ ApplicableTo must be valid with required IDs
- ✅ Start date required, end date must be after start date
- ✅ Beneficiary counts cannot exceed limits
- ✅ Status must be valid

### Fee Assignment Validation

- ✅ All required fields present
- ✅ Fee items cannot be empty
- ✅ Fee amounts must be non-negative
- ✅ Fees cannot be both mandatory and optional
- ✅ Optional fees properly tracked with isSelected flag
- ✅ Scholarship discount calculations validated
- ✅ DiscountAmount cannot exceed originalAmount
- ✅ TotalAmount = originalAmount - discountAmount
- ✅ Balance = totalAmount - amountPaid
- ✅ Status matches payment amounts
- ✅ Percentage scholarships must have value 0-100

## Database Collections

Two new Juno collections added:

1. **`scholarships`**: Stores scholarship definitions
2. **`scholarship_applications`**: Stores scholarship applications requiring approval

Added to `COLLECTIONS` constant in `src/services/dataService.ts`.

## Example Scenarios

### Scenario 1: Merit Scholarship

A school wants to give a 30% discount to top students in JSS 1:

```typescript
const scholarship = await scholarshipService.create({
  name: "Merit Award - JSS 1",
  type: "percentage",
  percentageOff: 30,
  applicableTo: "specific_classes",
  classIds: ["jss-1-id"],
  startDate: "2024-09-01",
  endDate: "2025-08-31",
  academicYear: "2024/2025",
  criteria: {
    minGradeAverage: 80,
    requiresApproval: true,
  },
  status: "active",
  createdBy: "bursar-id",
});
```

### Scenario 2: Sponsored Full Waiver

A sponsor provides full fee waiver for 5 orphaned students:

```typescript
const waiver = await scholarshipService.create({
  name: "Orphan Support Program",
  type: "full_waiver",
  applicableTo: "specific_students",
  studentIds: ["student-1", "student-2", "student-3", "student-4", "student-5"],
  startDate: "2024-09-01",
  academicYear: "2024/2025",
  maxBeneficiaries: 5,
  sponsor: "XYZ Foundation",
  status: "active",
  createdBy: "bursar-id",
});
```

### Scenario 3: Optional Feeding Fee

A student opts into feeding but not transport:

```typescript
await studentFeeAssignmentService.assignFeesToStudent(
  "student-id",
  "John Doe",
  "primary-3",
  "Primary 3",
  feeStructureId,
  "2024/2025",
  "first",
  feeItems,
  "2025-11-30",
  {
    selectedOptionalFees: ["feeding-fee-id"], // Only feeding, not transport
  }
);
// Result: Student is only charged for mandatory fees + feeding
```

### Scenario 4: Sibling Discount

Fixed ₦20,000 discount for second child in family:

```typescript
const siblingDiscount = await scholarshipService.create({
  name: "Sibling Discount",
  type: "fixed_amount",
  fixedAmountOff: 20000,
  applicableTo: "specific_students",
  studentIds: ["second-child-id"],
  excludedFeeTypes: ["uniform", "books"], // Don't discount these
  startDate: "2024-09-01",
  academicYear: "2024/2025",
  status: "active",
  createdBy: "bursar-id",
});
```

## Best Practices

1. **Always validate scholarship eligibility** before assignment
2. **Track originalAmount** when applying scholarships for audit trail
3. **Use scholarship applications** for merit-based scholarships requiring approval
4. **Set maxBeneficiaries** to control scholarship budget
5. **Exclude specific fee types** (like books/uniforms) from scholarships when needed
6. **Review currentBeneficiaries** periodically to ensure limits aren't exceeded
7. **Use optional fees** for services students can opt out of (feeding, transport, extracurricular)
8. **Document scholarship criteria** clearly for transparency

## Future Enhancements

Potential improvements:

- **Automatic scholarship matching**: Auto-apply eligible scholarships based on criteria
- **Scholarship budget tracking**: Monitor total scholarship spending
- **Partial optional fees**: Allow students to select specific days for feeding
- **Scholarship reports**: Analytics on scholarship utilization
- **Multi-scholarship support**: Apply multiple scholarships to one student
- **Scholarship renewal**: Auto-renew scholarships for subsequent terms

## Testing

Example test scenarios:

```typescript
// Test scholarship calculation
const scholarship = {
  type: "percentage",
  percentageOff: 25,
  // ...
};

const discount = scholarshipService.calculateDiscount(scholarship, 100000);
console.assert(discount === 25000, "25% of ₦100,000 should be ₦25,000");

// Test optional fee filtering
const feeItems = [
  { categoryId: "1", amount: 50000, isMandatory: true, isOptional: false },
  { categoryId: "2", amount: 20000, isMandatory: false, isOptional: true },
];

const selected = feeItems.filter((f) => 
  f.isMandatory || (f.isOptional && selectedOptionalFees.includes(f.categoryId))
);
```

## Support

For questions or issues, refer to:
- Type definitions: `src/types/index.ts`
- Service implementation: `src/services/scholarshipService.ts` and `src/services/feeService.ts`
- Validation rules: `src/satellite/src/modules/fees.rs`
