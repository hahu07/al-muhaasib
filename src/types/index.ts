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

export type ModuleName = 'students' | 'fees' | 'payments' | 'expenses' | 'staff' | 'assets' | 'reports' | 'accounting';

export type AcademicTerm = 'first' | 'second' | 'third';

export interface SchoolBranding {
  logo?: string;
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
  defaultPaymentMethods: ('cash' | 'bank_transfer' | 'pos' | 'online' | 'cheque')[];
  
  // Reporting Settings
  reportHeader?: string;
  reportFooter?: string;
  
  // Custom Fields
  customFields?: Record<string, unknown>;
  
  // Multi-tenant
  satelliteId: string; // Juno satellite ID
  
  // Status
  isActive: boolean;
  subscriptionStatus?: 'trial' | 'active' | 'suspended' | 'cancelled';
  subscriptionExpiresAt?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  [key: string]: unknown;
}

export interface SchoolLicense {
  id: string;
  schoolId: string;
  licenseKey: string;
  plan: 'basic' | 'standard' | 'premium' | 'enterprise';
  maxUsers: number;
  maxStudents: number;
  features: string[];
  startDate: string;
  expiryDate: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: unknown;
}

// ============================================
// USER & AUTHENTICATION TYPES
// ============================================

export type UserRole = 'accounting' | 'admin';

export interface AppUser {
  id: string;
  internetIdentityId: string;
  surname: string;
  firstname: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  [key: string]: unknown;
}

// ============================================
// SCHOOL STRUCTURE TYPES
// ============================================

export interface SchoolClass {
  id: string;
  name: string; // e.g., "Primary 1", "JSS 2"
  section?: string; // e.g., "A", "B"
  level: 'nursery' | 'primary' | 'jss' | 'sss';
  academicYear: string; // e.g., "2024/2025"
  capacity?: number;
  currentEnrollment: number;
  room?: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
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
  guardianRelationship?: 'father' | 'mother' | 'guardian' | 'other';
  
  // Student Details
  dateOfBirth?: string;
  gender?: 'male' | 'female';
  admissionDate: string;
  bloodGroup?: string;
  
  // Financial Summary
  totalFeesAssigned: number;
  totalPaid: number;
  balance: number;
  
  // Status
  isActive: boolean;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  [key: string]: unknown;
}

// ============================================
// REVENUE: FEE STRUCTURE TYPES
// ============================================

export type FeeType = 
  | 'tuition' | 'uniform' | 'feeding' | 'transport' | 'books'
  | 'sports' | 'development' | 'examination' | 'pta' | 'computer'
  | 'library' | 'laboratory' | 'lesson' | 'other';

export interface FeeCategory {
  id: string;
  name: string;
  type: FeeType;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: unknown;
}

export interface FeeStructure {
  id: string;
  classId: string;
  className: string;
  academicYear: string;
  term: 'first' | 'second' | 'third';
  feeItems: FeeItem[];
  totalAmount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: unknown;
}

export interface FeeItem {
  categoryId: string;
  categoryName: string;
  type: FeeType;
  amount: number;
  isMandatory: boolean;
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
  term: 'first' | 'second' | 'third';
  feeItems: StudentFeeItem[];
  totalAmount: number;
  amountPaid: number;
  balance: number;
  status: 'unpaid' | 'partial' | 'paid' | 'overpaid';
  dueDate?: string;
  createdAt: Date;
  updatedAt: Date;
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
  paymentMethod: 'cash' | 'bank_transfer' | 'pos' | 'online' | 'cheque';
  paymentDate: string;
  feeAllocations: PaymentAllocation[];
  reference: string;
  transactionId?: string;
  paidBy?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'refunded';
  notes?: string;
  receiptUrl?: string;
  recordedBy: string;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: unknown;
}

export interface PaymentAllocation {
  categoryId: string;
  categoryName: string;
  type: FeeType;
  amount: number;
}

// ============================================
// EXPENSES: OPERATIONAL EXPENSES
// ============================================

export type ExpenseCategory = 
  // Staff
  | 'salaries' | 'allowances' | 'bonuses' | 'staff_training'
  // Operations
  | 'utilities' | 'maintenance' | 'repairs' | 'cleaning' | 'security'
  // Academic
  | 'teaching_materials' | 'laboratory_supplies' | 'library_books'
  | 'sports_equipment' | 'computer_equipment'
  // Administrative
  | 'stationery' | 'printing' | 'communication' | 'transportation'
  | 'insurance' | 'legal_fees' | 'bank_charges'
  // Infrastructure
  | 'building_development' | 'furniture' | 'equipment_purchase'
  // Food & Catering
  | 'food_supplies' | 'kitchen_equipment'
  // Other
  | 'miscellaneous' | 'donations' | 'taxes'
  // Custom categories (allows any string)
  | string;

export interface ExpenseCategoryDef {
  id: string;
  name: string;
  category: ExpenseCategory;
  description?: string;
  budgetCode?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
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
  paymentMethod: 'cash' | 'bank_transfer' | 'cheque' | 'pos';
  paymentDate: string;
  vendorName?: string;
  vendorContact?: string;
  reference: string;
  invoiceUrl?: string;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;
  notes?: string;
  recordedBy: string;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: unknown;
}

export interface Budget {
  id: string;
  academicYear: string;
  term?: 'first' | 'second' | 'third';
  budgetItems: BudgetItem[];
  totalBudget: number;
  totalSpent: number;
  balance: number;
  status: 'draft' | 'approved' | 'active' | 'closed';
  createdBy: string;
  approvedBy?: string;
  createdAt: Date;
  updatedAt: Date;
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
  employmentType: 'full-time' | 'part-time' | 'contract';
  employmentDate: string;
  basicSalary: number;
  allowances?: StaffAllowance[];
  bankName?: string;
  accountNumber?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: unknown;
}

export interface StaffAllowance {
  name: string;
  amount: number;
  isRecurring: boolean;
}

export interface SalaryPayment {
  id: string;
  staffId: string;
  staffName: string;
  staffNumber: string;
  month: string;
  year: string;
  basicSalary: number;
  allowances: PaymentAllowance[];
  totalGross: number;
  deductions: PaymentDeduction[];
  totalDeductions: number;
  netPay: number;
  paymentMethod: 'bank_transfer' | 'cash' | 'cheque';
  paymentDate: string;
  reference: string;
  status: 'pending' | 'approved' | 'paid';
  recordedBy: string;
  approvedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: unknown;
}

export interface PaymentAllowance {
  name: string;
  amount: number;
}

export interface PaymentDeduction {
  name: string;
  amount: number;
}

// ============================================
// CAPITAL EXPENDITURE & ASSETS
// ============================================

// Simplified asset interface for asset management module
export interface SimpleAsset {
  id: string;
  assetNumber: string;
  name: string;
  category: 'furniture' | 'electronics' | 'vehicles' | 'equipment' | 'buildings' | 'land' | 'books' | 'sports' | 'laboratory' | 'other';
  description: string;
  purchaseDate: string;
  purchasePrice: number;
  currentValue?: number;
  vendor: string;
  location: string;
  department: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'needs_repair';
  serialNumber?: string;
  warranty?: {
    startDate: string;
    endDate: string;
    provider: string;
    terms: string;
  };
  notes?: string;
  status: 'active' | 'inactive' | 'disposed' | 'under_maintenance';
  recordedBy: string;
  createdAt?: string;
  updatedAt?: string;
}

export type AssetCategory =
  | 'land' | 'buildings' | 'building_improvements'
  | 'classroom_furniture' | 'office_furniture' | 'fixtures'
  | 'computer_equipment' | 'laboratory_equipment' | 'sports_equipment'
  | 'kitchen_equipment' | 'office_equipment' | 'audio_visual_equipment'
  | 'generator' | 'air_conditioning'
  | 'school_buses' | 'cars' | 'motorcycles'
  | 'library_books' | 'software' | 'other';

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
  depreciationMethod: 'straight-line' | 'declining-balance' | 'units-of-production' | 'none';
  usefulLifeYears: number;
  depreciationRate?: number;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  maintenanceSchedule?: 'monthly' | 'quarterly' | 'annually' | 'as-needed';
  status: 'active' | 'under-maintenance' | 'disposed' | 'lost' | 'damaged';
  condition?: 'excellent' | 'good' | 'fair' | 'poor';
  description?: string;
  specifications?: string;
  serialNumber?: string;
  notes?: string;
  disposalDate?: string;
  disposalMethod?: 'sold' | 'donated' | 'scrapped';
  disposalAmount?: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
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
  paymentMethod: 'cash' | 'bank_transfer' | 'cheque' | 'loan' | 'installment';
  paymentStatus: 'pending' | 'partial' | 'completed';
  totalPaid: number;
  balance: number;
  vendorName: string;
  vendorContact?: string;
  contractNumber?: string;
  startDate: string;
  expectedCompletionDate?: string;
  actualCompletionDate?: string;
  status: 'proposed' | 'approved' | 'in-progress' | 'completed' | 'rejected';
  approvedBy?: string;
  approvalDate?: string;
  documents?: CapExDocument[];
  assetId?: string;
  fundingSource?: 'revenue' | 'loan' | 'grant' | 'donation' | 'mixed';
  proposedBy: string;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: unknown;
}

export interface CapExDocument {
  name: string;
  type: 'quotation' | 'contract' | 'invoice' | 'receipt' | 'approval' | 'other';
  url: string;
  uploadedAt: Date;
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
  status: 'calculated' | 'posted' | 'reversed';
  journalEntryId?: string;
  calculatedBy: string;
  calculatedAt: Date;
  postedAt?: Date;
  [key: string]: unknown;
}

export interface AssetMaintenance {
  id: string;
  assetId: string;
  assetName: string;
  assetCode: string;
  maintenanceType: 'routine' | 'repair' | 'upgrade' | 'inspection';
  description: string;
  issue?: string;
  serviceProvider?: string;
  technicianName?: string;
  cost: number;
  paymentMethod: 'cash' | 'bank_transfer' | 'cheque';
  reference?: string;
  scheduledDate?: string;
  actualDate: string;
  completionDate?: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  invoiceUrl?: string;
  reportUrl?: string;
  nextMaintenanceDate?: string;
  recordedBy: string;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: unknown;
}

export interface AssetDisposal {
  id: string;
  assetId: string;
  assetName: string;
  assetCode: string;
  disposalDate: string;
  disposalMethod: 'sale' | 'donation' | 'scrap' | 'trade-in' | 'lost' | 'stolen' | 'damaged-beyond-repair';
  reason: string;
  bookValue: number;
  disposalAmount: number;
  gainOrLoss: number;
  buyerName?: string;
  buyerContact?: string;
  status: 'pending' | 'approved' | 'completed';
  approvedBy?: string;
  approvalDate?: string;
  documents?: DisposalDocument[];
  journalEntryId?: string;
  recordedBy: string;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: unknown;
}

export interface DisposalDocument {
  name: string;
  type: 'disposal-form' | 'receipt' | 'certificate' | 'photo' | 'other';
  url: string;
  uploadedAt: Date;
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
  reason: 'market-value-change' | 'periodic-revaluation' | 'impairment' | 'other';
  notes?: string;
  valuationReport?: string;
  status: 'pending' | 'approved' | 'posted';
  approvedBy?: string;
  journalEntryId?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: unknown;
}

// ============================================
// ACCOUNTING & DOUBLE-ENTRY
// ============================================

export interface ChartOfAccounts {
  id: string;
  accountCode: string;
  accountName: string;
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  parentAccountId?: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
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
  referenceType: 'payment' | 'expense' | 'salary' | 'depreciation' | 'adjustment' | 'other';
  referenceId?: string;
  status: 'draft' | 'posted';
  postedAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
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

export interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  accountType: 'current' | 'savings';
  balance: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: unknown;
}

// ============================================
// REPORTING TYPES
// ============================================

export interface FinancialReport {
  id: string;
  reportType: 'income-statement' | 'balance-sheet' | 'cashflow' | 'trial-balance' | 'custom';
  reportName: string;
  academicYear: string;
  term?: 'first' | 'second' | 'third';
  startDate: string;
  endDate: string;
  generatedBy: string;
  generatedAt: Date;
  reportData: unknown; // Flexible structure for different report types
  [key: string]: unknown;
}
