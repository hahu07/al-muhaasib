/**
 * AL-MUHAASIB - COMPREHENSIVE TYPE SYSTEM
 * School Accounting & Management System
 *
 * Complete TypeScript types for:
 * - School structure (classes, students)
 * - Revenue management (fees, payments)
 * - Expense management (operational expenses, salaries)
 * - Capital expenditure & asset management
 * - Double-entry accounting
 */

// ============================================
// SCHOOL CONFIGURATION & MULTI-TENANT TYPES
// ============================================

export type ModuleName =
  | "students"
  | "fees"
  | "payments"
  | "expenses"
  | "staff"
  | "assets"
  | "reports"
  | "accounting"
  | "banking"; // Bank transaction tracking, reconciliation, and cash flow

export type AcademicTerm = "first" | "second" | "third";

export interface SchoolBranding {
  logo?: string; // URL or data URL for uploaded logo
  logoStorageKey?: string; // Juno storage key for uploaded file
  favicon?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily?: string;
}

export interface AcademicSession {
  id: string;
  name: string; // e.g., "2024/2025"
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface TermSettings {
  id: string;
  name: AcademicTerm;
  label: string; // e.g., "First Term"
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface SchoolConfig {
  id: string;

  // Basic Information
  schoolName: string;
  schoolCode: string; // Unique identifier
  motto?: string;

  // Contact Information
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
  phone: string;
  email: string;
  website?: string;

  // Branding
  branding: SchoolBranding;

  // Regional Settings
  currency: string; // e.g., "NGN", "USD"
  currencySymbol: string; // e.g., "₦", "$"
  timezone: string; // e.g., "Africa/Lagos"
  locale: string; // e.g., "en-NG"
  dateFormat: string; // e.g., "DD/MM/YYYY"

  // Academic Settings
  currentSession: string; // e.g., "2024/2025"
  currentTerm: AcademicTerm;
  sessions: AcademicSession[];
  terms: TermSettings[];

  // System Configuration
  enabledModules: ModuleName[];

  // Payment Settings
  allowPartialPayments: boolean;
  lateFeePercentage?: number;
  defaultPaymentMethods: (
    | "cash"
    | "bank_transfer"
    | "pos"
    | "online"
    | "cheque"
  )[];

  // Default Bank Accounts (for automatic bank transaction creation)
  // Flexible: can add any custom transaction type (e.g., contributions, donations, petty_cash)
  defaultBankAccounts?: Record<string, string>; // { transactionType: bankAccountId }

  // Reporting Settings
  reportHeader?: string;
  reportFooter?: string;

  // Custom Fields
  customFields?: Record<string, unknown>;

  // Multi-tenant
  satelliteId: string; // Juno satellite ID

  // Status
  isActive: boolean;
  subscriptionStatus?: "trial" | "active" | "suspended" | "cancelled";
  subscriptionExpiresAt?: string;

  // Metadata
  createdAt: bigint;
  updatedAt: bigint;
  createdBy: string;
  [key: string]: unknown;
}

export interface SchoolLicense {
  id: string;
  schoolId: string;
  licenseKey: string;
  plan: "basic" | "standard" | "premium" | "enterprise";
  maxUsers: number;
  maxStudents: number;
  features: string[];
  startDate: string;
  expiryDate: string;
  isActive: boolean;
  createdAt: bigint;
  updatedAt: bigint;
  [key: string]: unknown;
}

// ============================================
// USER & AUTHENTICATION TYPES
// ============================================

export type UserRole =
  | "super_admin" // Full system access
  | "bursar" // Financial head - full financial access
  | "accountant" // Accounting staff - most financial operations
  | "auditor" // Read-only financial access for auditing
  | "data_entry"; // Limited access for data entry only

// Permission categories for accounting system
export const PERMISSIONS = {
  // User Management
  USERS_VIEW: "users.view",
  USERS_CREATE: "users.create",
  USERS_EDIT: "users.edit",
  USERS_DELETE: "users.delete",
  USERS_MANAGE_ROLES: "users.manage_roles",

  // Student Management
  STUDENTS_VIEW: "students.view",
  STUDENTS_CREATE: "students.create",
  STUDENTS_EDIT: "students.edit",
  STUDENTS_DELETE: "students.delete",

  // Fee Management
  FEES_VIEW: "fees.view",
  FEES_CREATE: "fees.create",
  FEES_EDIT: "fees.edit",
  FEES_DELETE: "fees.delete",

  // Payment Management
  PAYMENTS_VIEW: "payments.view",
  PAYMENTS_CREATE: "payments.create",
  PAYMENTS_EDIT: "payments.edit",
  PAYMENTS_DELETE: "payments.delete",
  PAYMENTS_REVERSE: "payments.reverse",

  // Scholarship Management
  SCHOLARSHIPS_VIEW: "scholarships.view",
  SCHOLARSHIPS_CREATE: "scholarships.create",
  SCHOLARSHIPS_EDIT: "scholarships.edit",
  SCHOLARSHIPS_DELETE: "scholarships.delete",

  // Expense Management
  EXPENSES_VIEW: "expenses.view",
  EXPENSES_CREATE: "expenses.create",
  EXPENSES_EDIT: "expenses.edit",
  EXPENSES_DELETE: "expenses.delete",
  EXPENSES_APPROVE: "expenses.approve",

  // Staff Management
  STAFF_VIEW: "staff.view",
  STAFF_CREATE: "staff.create",
  STAFF_EDIT: "staff.edit",
  STAFF_DELETE: "staff.delete",
  STAFF_PROCESS_SALARY: "staff.process_salary",
  STAFF_APPROVE_SALARY: "staff.approve_salary",

  // Asset Management
  ASSETS_VIEW: "assets.view",
  ASSETS_CREATE: "assets.create",
  ASSETS_EDIT: "assets.edit",
  ASSETS_DELETE: "assets.delete",
  ASSETS_DEPRECIATE: "assets.depreciate",
  ASSETS_DISPOSE: "assets.dispose",

  // Accounting & Journal Entries
  ACCOUNTING_VIEW: "accounting.view",
  ACCOUNTING_CREATE_ENTRIES: "accounting.create_entries",
  ACCOUNTING_POST_ENTRIES: "accounting.post_entries",
  ACCOUNTING_REVERSE_ENTRIES: "accounting.reverse_entries",
  ACCOUNTING_MANAGE_COA: "accounting.manage_coa",

  // Banking Module
  BANKING_VIEW: "banking.view",
  BANKING_CREATE_TRANSACTIONS: "banking.create_transactions",
  BANKING_RECONCILE: "banking.reconcile",
  BANKING_TRANSFER: "banking.transfer",
  BANKING_APPROVE_TRANSFER: "banking.approve_transfer",
  BANKING_IMPORT_STATEMENTS: "banking.import_statements",

  // Reports
  REPORTS_VIEW: "reports.view",
  REPORTS_FINANCIAL: "reports.financial",
  REPORTS_EXPORT: "reports.export",
  REPORTS_AUDIT: "reports.audit",

  // Settings & Configuration
  SETTINGS_VIEW: "settings.view",
  SETTINGS_EDIT_SCHOOL: "settings.edit_school",
  SETTINGS_EDIT_SYSTEM: "settings.edit_system",
  SETTINGS_BACKUP: "settings.backup",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export interface AppUser {
  id: string;
  internetIdentityId: string;
  surname: string;
  firstname: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  permissions: string[];
  createdAt: bigint;
  updatedAt: bigint;
  lastLogin?: bigint;
  [key: string]: unknown;
}

// ============================================
// SCHOOL STRUCTURE TYPES
// ============================================

export interface SchoolClass {
  id: string;
  name: string; // e.g., "Primary 1", "JSS 2"
  section?: string; // e.g., "A", "B"
  level: "nursery" | "primary" | "jss" | "sss";
  academicYear: string; // e.g., "2024/2025"
  capacity?: number;
  currentEnrollment: number;
  room?: string;
  description?: string;
  isActive: boolean;
  createdAt: bigint;
  updatedAt: bigint;
  [key: string]: unknown;
}

export interface StudentProfile {
  id: string;

  // Personal Information
  surname: string;
  firstname: string;
  middlename?: string;
  admissionNumber: string;

  // Class Information
  classId: string;
  className: string;

  // Guardian Information
  guardianSurname: string;
  guardianFirstname: string;
  guardianPhone: string;
  guardianEmail?: string;
  guardianAddress?: string;
  guardianRelationship?: "father" | "mother" | "guardian" | "other";

  // Student Details
  dateOfBirth?: string;
  gender?: "male" | "female";
  admissionDate: string;
  bloodGroup?: string;

  // Financial Summary
  totalFeesAssigned: number;
  totalPaid: number;
  balance: number;

  // Status
  isActive: boolean;

  // Metadata
  createdAt: bigint;
  updatedAt: bigint;
  [key: string]: unknown;
}

// ============================================
// REVENUE: FEE STRUCTURE TYPES
// ============================================

export type FeeType =
  | "tuition"
  | "uniform"
  | "feeding"
  | "transport"
  | "books"
  | "sports"
  | "development"
  | "examination"
  | "pta"
  | "computer"
  | "library"
  | "laboratory"
  | "lesson"
  | "other";

export interface FeeCategory {
  id: string;
  name: string;
  type: FeeType;
  description?: string;
  isActive: boolean;
  createdAt: bigint;
  updatedAt: bigint;
  [key: string]: unknown;
}

export interface FeeStructure {
  id: string;
  classId: string;
  className: string;
  academicYear: string;
  term: "first" | "second" | "third";
  feeItems: FeeItem[];
  totalAmount: number;
  isActive: boolean;
  createdAt: bigint;
  updatedAt: bigint;
  [key: string]: unknown;
}

export interface FeeItem {
  categoryId: string;
  categoryName: string;
  type: FeeType;
  amount: number;
  isMandatory: boolean;
  isOptional?: boolean; // True for optional fees like feeding
  description?: string;
}

export interface StudentFeeAssignment {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  feeStructureId: string;
  academicYear: string;
  term: "first" | "second" | "third";
  feeItems: StudentFeeItem[];
  
  // Scholarship/Discount fields
  scholarshipId?: string;
  scholarshipName?: string;
  scholarshipType?: "percentage" | "fixed_amount" | "waiver";
  scholarshipValue?: number; // Percentage (0-100) or fixed amount
  discountAmount?: number; // Actual discount applied
  
  // Amounts
  originalAmount?: number; // Total before any discounts
  totalAmount: number; // After discounts
  amountPaid: number;
  balance: number;
  
  status: "unpaid" | "partial" | "paid" | "overpaid";
  dueDate?: string;
  notes?: string;
  createdAt: bigint;
  updatedAt: bigint;
  [key: string]: unknown;
}

export interface StudentFeeItem {
  categoryId: string;
  categoryName: string;
  type: FeeType;
  amount: number;
  amountPaid: number;
  balance: number;
  isMandatory: boolean;
  isOptional?: boolean; // True for optional fees
  isSelected?: boolean; // Whether student opted into this optional fee
}

// ============================================
// SCHOLARSHIPS & DISCOUNTS
// ============================================

export type ScholarshipType = "percentage" | "fixed_amount" | "full_waiver";
export type ScholarshipStatus = "active" | "suspended" | "expired";

export interface Scholarship {
  id: string;
  name: string;
  description?: string;
  type: ScholarshipType;
  
  // Discount value
  percentageOff?: number; // For percentage type (0-100)
  fixedAmountOff?: number; // For fixed_amount type
  
  // Applicability
  applicableTo: "all" | "specific_classes" | "specific_students";
  classIds?: string[]; // If applicableTo is specific_classes
  studentIds?: string[]; // If applicableTo is specific_students
  
  // Fee type restrictions (which fees can be discounted)
  applicableToFeeTypes?: FeeType[]; // If empty, applies to all
  excludedFeeTypes?: FeeType[]; // Fees that should not be discounted
  
  // Validity period
  startDate: string;
  endDate?: string;
  academicYear?: string;
  terms?: ("first" | "second" | "third")[]; // Which terms it applies to
  
  // Limits
  maxBeneficiaries?: number; // Maximum number of students
  currentBeneficiaries?: number; // Current count
  maxDiscountPerStudent?: number; // Maximum discount amount per student
  
  // Requirements/Criteria
  criteria?: {
    minAttendancePercentage?: number;
    minGradeAverage?: number;
    requiresApproval?: boolean;
    requiresDocumentation?: boolean;
    otherCriteria?: string;
  };
  
  // Metadata
  status: ScholarshipStatus;
  sponsor?: string; // Who is funding this scholarship
  notes?: string;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: bigint;
  createdAt: bigint;
  updatedAt: bigint;
  [key: string]: unknown;
}

export interface ScholarshipApplication {
  id: string;
  scholarshipId: string;
  scholarshipName: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  academicYear: string;
  term: "first" | "second" | "third";
  
  // Application details
  applicationDate: string;
  reason?: string;
  supportingDocuments?: string[]; // URLs to uploaded documents
  
  // Status
  status: "pending" | "approved" | "rejected" | "expired";
  reviewedBy?: string;
  reviewedAt?: bigint;
  reviewNotes?: string;
  
  // If approved
  approvedAmount?: number;
  effectiveFrom?: string;
  effectiveUntil?: string;
  
  createdAt: bigint;
  updatedAt: bigint;
  [key: string]: unknown;
}

// ============================================
// REVENUE: PAYMENT TYPES
// ============================================

export interface Payment {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  feeAssignmentId: string;
  amount: number;
  paymentMethod: "cash" | "bank_transfer" | "pos" | "online" | "cheque";
  paymentDate: string;
  feeAllocations: PaymentAllocation[];
  reference: string;
  transactionId?: string;
  paidBy?: string;
  status: "pending" | "confirmed" | "cancelled" | "refunded";
  notes?: string;
  receiptUrl?: string;
  recordedBy: string;
  createdAt: bigint;
  updatedAt: bigint;
  [key: string]: unknown;
}

export interface PaymentAllocation {
  categoryId: string;
  categoryName: string;
  feeType: FeeType;
  amount: number;
}

// ============================================
// EXPENSES: OPERATIONAL EXPENSES
// ============================================

export type ExpenseCategory =
  // Staff
  | "salaries"
  | "allowances"
  | "bonuses"
  | "staff_training"
  // Operations
  | "utilities"
  | "maintenance"
  | "repairs"
  | "cleaning"
  | "security"
  // Academic
  | "teaching_materials"
  | "laboratory_supplies"
  | "library_books"
  | "sports_equipment"
  | "computer_equipment"
  // Administrative
  | "stationery"
  | "printing"
  | "communication"
  | "transportation"
  | "insurance"
  | "legal_fees"
  | "bank_charges"
  // Infrastructure
  | "building_development"
  | "furniture"
  | "equipment_purchase"
  // Food & Catering
  | "food_supplies"
  | "kitchen_equipment"
  // Other
  | "miscellaneous"
  | "donations"
  | "taxes"
  // Custom categories (allows any string)
  | string;

export interface ExpenseCategoryDef {
  id: string;
  name: string;
  category: ExpenseCategory;
  description?: string;
  budgetCode?: string;
  isActive: boolean;
  createdAt: bigint;
  updatedAt: bigint;
  [key: string]: unknown;
}

export interface Expense {
  id: string;
  categoryId: string;
  categoryName: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  purpose?: string;
  paymentMethod: "cash" | "bank_transfer" | "cheque" | "pos" | "online";
  paymentDate: string;
  vendorName?: string;
  vendorContact?: string;
  reference: string;
  invoiceUrl?: string;
  status: "pending" | "approved" | "paid" | "rejected";
  approvedBy?: string;
  approvedAt?: bigint;
  notes?: string;
  recordedBy: string;
  createdAt: bigint;
  updatedAt: bigint;
  [key: string]: unknown;
}

export interface Budget {
  id: string;
  academicYear: string;
  term?: "first" | "second" | "third";
  budgetItems: BudgetItem[];
  totalBudget: number;
  totalSpent: number;
  balance: number;
  status: "draft" | "approved" | "active" | "closed";
  createdBy: string;
  approvedBy?: string;
  createdAt: bigint;
  updatedAt: bigint;
  [key: string]: unknown;
}

export interface BudgetItem {
  categoryId: string;
  categoryName: string;
  category: ExpenseCategory;
  allocatedAmount: number;
  spentAmount: number;
  balance: number;
  notes?: string;
}

// ============================================
// STAFF & SALARIES
// ============================================

export interface StaffMember {
  id: string;
  surname: string;
  firstname: string;
  middlename?: string;
  staffNumber: string;
  phone: string;
  email?: string;
  address?: string;
  position: string;
  department?: string;
  employmentType: "full-time" | "part-time" | "contract";
  employmentDate: string;
  basicSalary: number;
  allowances?: StaffAllowance[];
  bankName?: string;
  accountNumber?: string;
  isActive: boolean;
  createdAt: bigint;
  updatedAt: bigint;
  [key: string]: unknown;
}

export interface StaffAllowance {
  name: string;
  amount: number;
}

export interface SalaryPayment {
  id: string;
  staffId: string;
  staffName: string;
  staffNumber: string;
  month: string;
  year: string;
  paymentPeriodStart: string; // ISO date string (YYYY-MM-DD)
  paymentPeriodEnd: string; // ISO date string (YYYY-MM-DD)
  basicSalary: number;
  allowances: PaymentAllowance[];
  totalGross: number;
  deductions: PaymentDeduction[];
  statutoryDeductions?: StatutoryDeductions;
  totalDeductions: number;
  netPay: number;
  netSalary?: number; // Alias for backend compatibility
  paymentMethod: "bank_transfer" | "cash" | "cheque";
  paymentDate: string;
  reference: string;
  status: "pending" | "approved" | "paid";
  recordedBy: string;
  processedBy?: string; // Alias for backend compatibility
  processedAt?: bigint; // Backend requirement
  approvedBy?: string;
  notes?: string; // Backend optional field
  createdAt: bigint;
  updatedAt: bigint;
  [key: string]: unknown;
}

export interface PaymentAllowance {
  name: string;
  amount: number;
  isTaxable?: boolean;
}

export interface PaymentDeduction {
  name: string;
  amount: number;
  type?: "tax" | "statutory" | "loan" | "other";
  isStatutory?: boolean;
}

export interface StatutoryDeductions {
  nhf: number;
  pensionEmployee: number;
  pensionEmployer: number;
  nhis: number;
  paye: number;
  totalEmployeeDeductions: number;
  totalEmployerContributions: number;
}

// ============================================
// CAPITAL EXPENDITURE & ASSETS
// ============================================

// Simplified asset interface for asset management module
export interface SimpleAsset {
  id: string;
  assetNumber: string;
  name: string;
  category:
    | "furniture"
    | "electronics"
    | "vehicles"
    | "equipment"
    | "buildings"
    | "land"
    | "books"
    | "sports"
    | "laboratory"
    | "other";
  description: string;
  purchaseDate: string;
  purchasePrice: number;
  currentValue?: number;
  vendor: string;
  location: string;
  department: string;
  condition: "excellent" | "good" | "fair" | "poor" | "needs_repair";
  serialNumber?: string;
  warranty?: {
    startDate: string;
    endDate: string;
    provider: string;
    terms: string;
  };
  notes?: string;
  status: "active" | "inactive" | "disposed" | "under_maintenance";
  recordedBy: string;
  createdAt?: string;
  updatedAt?: string;
}

export type AssetCategory =
  | "land"
  | "buildings"
  | "building_improvements"
  | "classroom_furniture"
  | "office_furniture"
  | "fixtures"
  | "computer_equipment"
  | "laboratory_equipment"
  | "sports_equipment"
  | "kitchen_equipment"
  | "office_equipment"
  | "audio_visual_equipment"
  | "generator"
  | "air_conditioning"
  | "school_buses"
  | "cars"
  | "motorcycles"
  | "library_books"
  | "software"
  | "other";

export interface FixedAsset {
  id: string;
  assetCode: string;
  assetName: string;
  category: AssetCategory;
  purchasePrice: number;
  currentValue: number;
  accumulatedDepreciation: number;
  residualValue: number;
  purchaseDate: string;
  vendor?: string;
  invoiceNumber?: string;
  invoiceUrl?: string;
  warranty?: AssetWarranty;
  location: string;
  assignedTo?: string;
  depreciationMethod:
    | "straight-line"
    | "declining-balance"
    | "units-of-production"
    | "none";
  usefulLifeYears: number;
  depreciationRate?: number;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  maintenanceSchedule?: "monthly" | "quarterly" | "annually" | "as-needed";
  status: "active" | "under-maintenance" | "disposed" | "lost" | "damaged";
  condition?: "excellent" | "good" | "fair" | "poor";
  description?: string;
  specifications?: string;
  serialNumber?: string;
  notes?: string;
  disposalDate?: string;
  disposalMethod?: "sold" | "donated" | "scrapped";
  disposalAmount?: number;
  createdBy: string;
  createdAt: bigint;
  updatedAt: bigint;
  [key: string]: unknown;
}

export interface AssetWarranty {
  startDate: string;
  endDate: string;
  warrantyPeriodMonths: number;
  warrantyProvider: string;
  coverageDetails?: string;
}

export interface CapitalExpenditure {
  id: string;
  projectName: string;
  category: AssetCategory;
  description: string;
  budgetedAmount: number;
  actualAmount: number;
  variance: number;
  paymentMethod: "cash" | "bank_transfer" | "cheque" | "loan" | "installment";
  paymentStatus: "pending" | "partial" | "completed";
  totalPaid: number;
  balance: number;
  vendorName: string;
  vendorContact?: string;
  contractNumber?: string;
  startDate: string;
  expectedCompletionDate?: string;
  actualCompletionDate?: string;
  status: "proposed" | "approved" | "in-progress" | "completed" | "rejected";
  approvedBy?: string;
  approvalDate?: string;
  documents?: CapExDocument[];
  assetId?: string;
  fundingSource?: "revenue" | "loan" | "grant" | "donation" | "mixed";
  proposedBy: string;
  createdAt: bigint;
  updatedAt: bigint;
  [key: string]: unknown;
}

export interface CapExDocument {
  name: string;
  type: "quotation" | "contract" | "invoice" | "receipt" | "approval" | "other";
  url: string;
  uploadedAt: bigint;
}

export interface DepreciationEntry {
  id: string;
  assetId: string;
  assetName: string;
  assetCode: string;
  year: string;
  month?: string;
  openingValue: number;
  depreciationAmount: number;
  closingValue: number;
  accumulatedDepreciation: number;
  status: "calculated" | "posted" | "reversed";
  journalEntryId?: string;
  calculatedBy: string;
  calculatedAt: bigint;
  postedAt?: bigint;
  [key: string]: unknown;
}

export interface AssetMaintenance {
  id: string;
  assetId: string;
  assetName: string;
  assetCode: string;
  maintenanceType: "routine" | "repair" | "upgrade" | "inspection";
  description: string;
  issue?: string;
  serviceProvider?: string;
  technicianName?: string;
  cost: number;
  paymentMethod: "cash" | "bank_transfer" | "cheque";
  reference?: string;
  scheduledDate?: string;
  actualDate: string;
  completionDate?: string;
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  invoiceUrl?: string;
  reportUrl?: string;
  nextMaintenanceDate?: string;
  recordedBy: string;
  createdAt: bigint;
  updatedAt: bigint;
  [key: string]: unknown;
}

export interface AssetDisposal {
  id: string;
  assetId: string;
  assetName: string;
  assetCode: string;
  disposalDate: string;
  disposalMethod:
    | "sale"
    | "donation"
    | "scrap"
    | "trade-in"
    | "lost"
    | "stolen"
    | "damaged-beyond-repair";
  reason: string;
  bookValue: number;
  disposalAmount: number;
  gainOrLoss: number;
  buyerName?: string;
  buyerContact?: string;
  status: "pending" | "approved" | "completed";
  approvedBy?: string;
  approvalDate?: string;
  documents?: DisposalDocument[];
  journalEntryId?: string;
  recordedBy: string;
  createdAt: bigint;
  updatedAt: bigint;
  [key: string]: unknown;
}

export interface DisposalDocument {
  name: string;
  type: "disposal-form" | "receipt" | "certificate" | "photo" | "other";
  url: string;
  uploadedAt: bigint;
}

export interface AssetValuation {
  id: string;
  assetId: string;
  assetName: string;
  assetCode: string;
  valuationDate: string;
  previousValue: number;
  newValue: number;
  revaluationAmount: number;
  valuedBy: string;
  valuationMethod: string;
  reason:
    | "market-value-change"
    | "periodic-revaluation"
    | "impairment"
    | "other";
  notes?: string;
  valuationReport?: string;
  status: "pending" | "approved" | "posted";
  approvedBy?: string;
  journalEntryId?: string;
  createdBy: string;
  createdAt: bigint;
  updatedAt: bigint;
  [key: string]: unknown;
}

// ============================================
// ACCOUNTING & DOUBLE-ENTRY
// ============================================

/**
 * Account Mapping - Maps transaction types to GL accounts
 * Allows dynamic configuration of which accounts are used for different transaction types
 */
export interface AccountMapping {
  id: string;
  mappingType: "revenue" | "expense" | "asset" | "liability";
  sourceType: string; // e.g., "tuition", "uniform", "salaries", "utilities"
  sourceName: string; // Human-readable name
  accountId: string; // GL account ID
  accountCode: string; // GL account code (e.g., "4100")
  accountName: string; // GL account name
  isDefault: boolean; // Whether this is a system default or user-created
  isActive: boolean;
  createdAt: bigint;
  updatedAt: bigint;
  [key: string]: unknown;
}

export interface ChartOfAccounts {
  id: string;
  accountCode: string;
  accountName: string;
  accountType: "asset" | "liability" | "equity" | "revenue" | "expense";
  parentAccountId?: string;
  description?: string;
  isActive: boolean;
  createdAt: bigint;
  updatedAt: bigint;
  [key: string]: unknown;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  entryDate: string;
  description: string;
  lines: JournalLine[];
  totalDebit: number;
  totalCredit: number;
  referenceType:
    | "payment"
    | "expense"
    | "salary"
    | "depreciation"
    | "adjustment"
    | "other";
  referenceId?: string;
  status: "draft" | "posted";
  postedAt?: bigint;
  createdBy: string;
  createdAt: bigint;
  updatedAt: bigint;
  [key: string]: unknown;
}

export interface JournalLine {
  accountId: string;
  accountName: string;
  accountCode: string;
  debit: number;
  credit: number;
  description?: string;
}

// Alias for backwards compatibility
export type JournalEntryLine = JournalLine;

export interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  accountType: "current" | "savings";
  balance: number;
  
  // Link to Chart of Accounts (General Ledger)
  glAccountId?: string; // Maps to ChartOfAccounts.id (e.g., "1110 - Cash in Bank - GTBank")
  glAccountCode?: string; // GL account code for reference (e.g., "1110")
  glAccountName?: string; // GL account name for reference
  
  isActive: boolean;
  createdAt: bigint;
  updatedAt: bigint;
  [key: string]: unknown;
}

// ============================================
// REPORTING TYPES
// ============================================

export interface FinancialReport {
  id: string;
  reportType:
    | "income-statement"
    | "balance-sheet"
    | "cashflow"
    | "trial-balance"
    | "custom";
  reportName: string;
  academicYear: string;
  term?: "first" | "second" | "third";
  startDate: string;
  endDate: string;
  generatedBy: string;
  generatedAt: bigint;
  reportData: unknown; // Flexible structure for different report types
  [key: string]: unknown;
}

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
  transactionType: "deposit" | "withdrawal" | "transfer" | "fee" | "interest" | "charge";

  // Reconciliation fields
  status: "pending" | "cleared" | "reconciled";
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

export interface ReconciliationAdjustment {
  type: "bank_charge" | "interest_earned" | "error_correction" | "nsf_check" | "other";
  description: string;
  amount: number; // Positive for additions, negative for deductions
  transactionId?: string; // If adjustment creates a transaction
}

export interface UnmatchedItem {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "debit" | "credit";
  reference?: string;
  source: "bank" | "book"; // Where this item came from
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
  status: "in-progress" | "completed" | "approved";

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
  status: "pending" | "completed" | "cancelled" | "failed";

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
    frequency: "daily" | "weekly" | "monthly" | "quarterly";
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
  liquidityStatus: "healthy" | "adequate" | "tight" | "critical";
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
