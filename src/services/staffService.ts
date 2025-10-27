import { BaseDataService, COLLECTIONS } from "./dataService";
import type {
  StaffMember,
  SalaryPayment,
  PaymentAllowance,
  PaymentDeduction,
  StatutoryDeductions,
} from "@/types";
import { customAlphabet } from "nanoid";
import { autoPostingService } from "./autoPostingService";
import { z } from "zod";
import { StatutoryDeductionsCalculator } from "./statutoryDeductionsCalculator";
import { staffLoanService, staffBonusService, staffPenaltyService, loanRepaymentService } from "./staffFinancialService";

// Create alphanumeric nanoid generator for salary references (backend validation requires alphanumeric only)
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 6);

export class StaffService extends BaseDataService<StaffMember> {
  constructor() {
    super(COLLECTIONS.STAFF_MEMBERS);
  }

  /**
   * Generate next staff number in format STF-YYYY-NNNN
   */
  async generateStaffNumber(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const allStaff = await this.list();
    
    // Filter staff from current year
    const yearPrefix = `STF-${currentYear}-`;
    const staffThisYear = allStaff.filter(s => s.staffNumber.startsWith(yearPrefix));
    
    // Get the highest number
    let maxNumber = 0;
    staffThisYear.forEach(s => {
      const match = s.staffNumber.match(/STF-(\d{4})-(\d{4})/);
      if (match) {
        const num = parseInt(match[2], 10);
        if (num > maxNumber) maxNumber = num;
      }
    });
    
    // Generate next number
    const nextNumber = (maxNumber + 1).toString().padStart(4, '0');
    return `${yearPrefix}${nextNumber}`;
  }

  /**
   * Override create to auto-generate staff number if not provided
   */
  async create(data: Omit<StaffMember, 'id' | 'createdAt' | 'updatedAt'>): Promise<StaffMember> {
    // Auto-generate staff number if not provided or empty
    if (!data.staffNumber || (typeof data.staffNumber === 'string' && data.staffNumber.trim() === '')) {
      data = {
        ...data,
        staffNumber: await this.generateStaffNumber()
      };
    }
    
    return super.create(data);
  }

  /**
   * Get active staff members
   */
  async getActiveStaff(): Promise<StaffMember[]> {
    const staff = await this.list();
    return staff.filter((s) => s.isActive);
  }

  /**
   * Get staff by employment type
   */
  async getByEmploymentType(
    type: StaffMember["employmentType"],
  ): Promise<StaffMember[]> {
    const staff = await this.list();
    return staff.filter((s) => s.employmentType === type && s.isActive);
  }

  /**
   * Get staff by department
   */
  async getByDepartment(department: string): Promise<StaffMember[]> {
    const staff = await this.list();
    return staff.filter((s) => s.department === department && s.isActive);
  }

  /**
   * Get staff by staff number
   */
  async getByStaffNumber(staffNumber: string): Promise<StaffMember | null> {
    const staff = await this.list();
    return staff.find((s) => s.staffNumber === staffNumber) || null;
  }

  /**
   * Deactivate staff member
   */
  async deactivateStaff(staffId: string): Promise<StaffMember> {
    return this.update(staffId, { isActive: false });
  }

  /**
   * Reactivate staff member
   */
  async reactivateStaff(staffId: string): Promise<StaffMember> {
    return this.update(staffId, { isActive: true });
  }

  /**
   * Calculate total compensation for a staff member
   */
  calculateTotalCompensation(staff: StaffMember): number {
    const basicSalary = staff.basicSalary;
    const allowancesTotal =
      staff.allowances?.reduce((sum, a) => sum + a.amount, 0) || 0;
    return basicSalary + allowancesTotal;
  }

  /**
   * Seed sample staff data for testing
   */
  async seedSampleStaff(): Promise<void> {
    const existingStaff = await this.list();
    if (existingStaff.length > 0) {
      return; // Don't seed if staff already exist
    }

    const sampleStaff = [
      {
        staffNumber: "STF001",
        firstname: "John",
        surname: "Adebayo",
        position: "Mathematics Teacher",
        department: "Science Department",
        employmentType: "full-time" as const,
        employmentDate: "2022-09-01",
        basicSalary: 150000,
        phone: "08012345678",
        email: "john.adebayo@school.edu",
        address: "123 Lagos Street, Lagos",
        bankName: "First Bank",
        accountNumber: "1234567890",
        allowances: [
          { name: "Transport Allowance", amount: 20000 },
          { name: "Teaching Allowance", amount: 15000 },
        ],
        isActive: true,
      },
      {
        staffNumber: "STF002",
        firstname: "Sarah",
        surname: "Okonkwo",
        position: "English Teacher",
        department: "Arts Department",
        employmentType: "full-time" as const,
        employmentDate: "2021-01-15",
        basicSalary: 140000,
        phone: "08098765432",
        email: "sarah.okonkwo@school.edu",
        address: "456 Abuja Road, Abuja",
        bankName: "GTBank",
        accountNumber: "9876543210",
        allowances: [
          { name: "Transport Allowance", amount: 20000 },
        ],
        isActive: true,
      },
      {
        staffNumber: "STF003",
        firstname: "Ahmed",
        surname: "Hassan",
        position: "Physics Teacher",
        department: "Science Department",
        employmentType: "part-time" as const,
        employmentDate: "2023-03-20",
        basicSalary: 80000,
        phone: "08055443322",
        email: "ahmed.hassan@school.edu",
        address: "789 Kano Close, Kano",
        bankName: "UBA",
        accountNumber: "5555666677",
        allowances: [],
        isActive: false,
      },
      {
        staffNumber: "STF004",
        firstname: "Grace",
        surname: "Eze",
        position: "School Secretary",
        department: "Administration",
        employmentType: "full-time" as const,
        employmentDate: "2020-06-10",
        basicSalary: 120000,
        phone: "08077889900",
        email: "grace.eze@school.edu",
        address: "321 Enugu Avenue, Enugu",
        bankName: "Zenith Bank",
        accountNumber: "1111222233",
        allowances: [
          {
            name: "Administrative Allowance",
            amount: 25000,
          },
        ],
        isActive: true,
      },
    ];

    for (const staff of sampleStaff) {
      await this.create(staff);
    }
  }

  /**
   * Get staff summary statistics
   */
  async getStaffSummary(): Promise<{
    totalStaff: number;
    activeStaff: number;
    byEmploymentType: Record<string, number>;
    byDepartment: Record<string, number>;
    totalMonthlySalaries: number;
  }> {
    const allStaff = await this.list();
    const activeStaff = allStaff.filter((s) => s.isActive);

    const byEmploymentType: Record<string, number> = {};
    const byDepartment: Record<string, number> = {};

    activeStaff.forEach((s) => {
      // By employment type
      byEmploymentType[s.employmentType] =
        (byEmploymentType[s.employmentType] || 0) + 1;

      // By department
      if (s.department) {
        byDepartment[s.department] = (byDepartment[s.department] || 0) + 1;
      }
    });

    const totalMonthlySalaries = activeStaff.reduce(
      (sum, s) => sum + this.calculateTotalCompensation(s),
      0,
    );

    return {
      totalStaff: allStaff.length,
      activeStaff: activeStaff.length,
      byEmploymentType,
      byDepartment,
      totalMonthlySalaries,
    };
  }
}

export class SalaryPaymentService extends BaseDataService<SalaryPayment> {
  constructor() {
    super(COLLECTIONS.SALARY_PAYMENTS);
  }

  /**
   * Calculate salary with allowances, statutory deductions, and other deductions
   */
  calculateSalary(data: {
    basicSalary: number;
    allowances: PaymentAllowance[];
    deductions?: PaymentDeduction[];
    includeStatutory?: boolean;
  }): {
    totalGross: number;
    statutoryDeductions?: StatutoryDeductions;
    totalDeductions: number;
    netPay: number;
  } {
    const totalAllowances = data.allowances.reduce(
      (sum, a) => sum + a.amount,
      0,
    );
    const totalGross = data.basicSalary + totalAllowances;
    
    // Calculate statutory deductions if requested
    let statutoryDeductions: StatutoryDeductions | undefined;
    let statutoryTotal = 0;
    
    if (data.includeStatutory !== false) {
      statutoryDeductions = StatutoryDeductionsCalculator.calculateAll(
        data.basicSalary,
        totalAllowances,
      );
      statutoryTotal = statutoryDeductions.totalEmployeeDeductions;
    }
    
    // Calculate other deductions (excluding statutory ones to avoid double-counting)
    // Check both isStatutory flag and name patterns to detect statutory deductions
    const statutoryPatterns = [
      /nhf/i,
      /national housing/i,
      /pension.*employee/i,
      /nhis/i,
      /national health/i,
      /paye/i,
      /pay as you earn/i,
    ];
    
    const isStatutoryDeduction = (d: PaymentDeduction) => {
      if (d.isStatutory) return true;
      return statutoryPatterns.some(pattern => pattern.test(d.name));
    };
    
    const otherDeductions =
      data.deductions?.filter(d => !isStatutoryDeduction(d)).reduce((sum, d) => sum + d.amount, 0) || 0;
    
    const totalDeductions = statutoryTotal + otherDeductions;
    const netPay = totalGross - totalDeductions;

    return {
      totalGross,
      statutoryDeductions,
      totalDeductions,
      netPay,
    };
  }

  /**
   * Process salary payment
   */
  async processSalaryPayment(data: {
    staffId: string;
    staffName: string;
    staffNumber: string;
    month: string;
    year: string;
    basicSalary: number;
    allowances: PaymentAllowance[];
    deductions?: PaymentDeduction[];
    paymentMethod: SalaryPayment["paymentMethod"];
    paymentDate: string;
    recordedBy: string;
  }): Promise<SalaryPayment> {
    // Basic input validation (non-authoritative)
    const Schema = z.object({
      staffId: z.string().min(1),
      staffName: z.string().min(1),
      staffNumber: z.string().min(1),
      month: z.string().regex(/^(0[1-9]|1[0-2])$/),
      year: z.string().regex(/^\d{4}$/),
      basicSalary: z.number().nonnegative(),
      allowances: z.array(
        z.object({ name: z.string(), amount: z.number().nonnegative() }),
      ),
      deductions: z
        .array(z.object({ name: z.string(), amount: z.number().nonnegative() }))
        .optional(),
      paymentMethod: z.enum(["bank_transfer", "cash", "cheque"]),
      paymentDate: z.string().refine((v) => !Number.isNaN(Date.parse(v))),
      recordedBy: z.string().min(1),
    });
    const parsed = Schema.safeParse(data);
    if (!parsed.success) {
      throw new Error(
        parsed.error.issues[0]?.message || "Invalid salary payment data",
      );
    }

    // Check for existing salary payment for this staff in this period
    const existingPayments = await this.getByStaffId(data.staffId);
    const duplicatePayment = existingPayments.find(
      (p) => p.month === data.month && p.year === data.year,
    );
    
    if (duplicatePayment) {
      throw new Error(
        `Salary payment already exists for ${data.staffName} in ${data.month}/${data.year} (Status: ${duplicatePayment.status}). Reference: ${duplicatePayment.reference}`,
      );
    }

    // Generate reference in format: SAL-YYYY-MM-XXXXXX (exactly 16 characters)
    // Ensure month is 2 digits (pad with zero if needed)
    const paddedMonth = data.month.padStart(2, "0");
    const reference = `SAL-${data.year}-${paddedMonth}-${nanoid()}`;

    // Calculate payment period dates (first and last day of the month)
    const year = parseInt(data.year);
    const month = parseInt(data.month);
    const paymentPeriodStart = `${data.year}-${data.month}-01`;
    const lastDay = new Date(year, month, 0).getDate(); // Get last day of month
    const paymentPeriodEnd = `${data.year}-${data.month}-${String(lastDay).padStart(2, "0")}`;

    const calculated = this.calculateSalary({
      basicSalary: data.basicSalary,
      allowances: data.allowances,
      deductions: data.deductions,
      includeStatutory: true,
    });

    // Additional policy checks
    if (calculated.netPay < 0) {
      throw new Error(
        "Net pay cannot be negative (deductions exceed gross pay)",
      );
    }
    if (data.paymentMethod === "cash" && calculated.netPay > 100_000) {
      throw new Error("Cash payments cannot exceed ₦100,000");
    }
    if (calculated.netPay > 500_000 && data.paymentMethod !== "bank_transfer") {
      throw new Error("Salary payments over ₦500,000 must use bank transfer");
    }

    // Add backend-compatible fields
    const now = BigInt(Date.now() * 1_000_000); // Convert to nanoseconds
    
    // Ensure allowances have isTaxable field (default to true)
    const allowancesWithTaxable = data.allowances.map(a => ({
      ...a,
      isTaxable: a.isTaxable ?? true,
    }));
    
    // Add statutory deductions to the deductions array
    const statutoryDeductionsList: PaymentDeduction[] = [];
    if (calculated.statutoryDeductions) {
      const stat = calculated.statutoryDeductions;
      if (stat.nhf > 0) {
        statutoryDeductionsList.push({
          name: "NHF (National Housing Fund)",
          amount: stat.nhf,
          type: "statutory",
          isStatutory: true,
        });
      }
      if (stat.pensionEmployee > 0) {
        statutoryDeductionsList.push({
          name: "Pension - Employee Contribution",
          amount: stat.pensionEmployee,
          type: "statutory",
          isStatutory: true,
        });
      }
      if (stat.nhis > 0) {
        statutoryDeductionsList.push({
          name: "NHIS (National Health Insurance)",
          amount: stat.nhis,
          type: "statutory",
          isStatutory: true,
        });
      }
      if (stat.paye > 0) {
        statutoryDeductionsList.push({
          name: "PAYE (Pay As You Earn Tax)",
          amount: stat.paye,
          type: "tax",
          isStatutory: true,
        });
      }
    }
    
    // Filter out any existing statutory deductions from regular deductions to avoid duplicates
    // Use pattern matching to detect statutory deductions by name
    const statutoryPatterns = [
      /nhf/i,
      /national housing/i,
      /pension.*employee/i,
      /nhis/i,
      /national health/i,
      /paye/i,
      /pay as you earn/i,
    ];
    
    const isStatutoryByName = (name: string) => {
      return statutoryPatterns.some(pattern => pattern.test(name));
    };
    
    const regularDeductions = (data.deductions || [])
      .filter(d => !isStatutoryByName(d.name)) // Remove any deductions that match statutory patterns
      .map(d => ({
        ...d,
        isStatutory: d.isStatutory ?? false,
      }));
    
    // Combine all deductions for backend
    const allDeductions = [...regularDeductions, ...statutoryDeductionsList];
    
    // Verify that the sum of allDeductions matches calculated.totalDeductions
    const allDeductionsTotal = allDeductions.reduce((sum, d) => sum + d.amount, 0);
    const regularTotal = regularDeductions.reduce((sum, d) => sum + d.amount, 0);
    const statutoryTotal = statutoryDeductionsList.reduce((sum, d) => sum + d.amount, 0);
    
    if (Math.abs(allDeductionsTotal - calculated.totalDeductions) > 0.01) {
      console.error('Deductions mismatch:', {
        allDeductionsTotal,
        regularTotal,
        statutoryTotal,
        calculatedTotal: calculated.totalDeductions,
        difference: allDeductionsTotal - calculated.totalDeductions,
        inputDeductions: data.deductions,
        regularDeductions,
        statutoryDeductionsList,
        allDeductions,
        statutoryDeductions: calculated.statutoryDeductions
      });
      throw new Error(
        `Internal calculation error: Deductions array total (₦${allDeductionsTotal.toFixed(2)}) doesn't match calculated total (₦${calculated.totalDeductions.toFixed(2)})`
      );
    }

    const payment = await this.create({
      ...data,
      allowances: allowancesWithTaxable,
      paymentPeriodStart,
      paymentPeriodEnd,
      deductions: allDeductions, // Includes both regular and statutory deductions
      statutoryDeductions: calculated.statutoryDeductions,
      totalGross: calculated.totalGross,
      totalDeductions: calculated.totalDeductions,
      netPay: calculated.netPay,
      netSalary: calculated.netPay, // Backend alias
      processedBy: data.recordedBy, // Backend alias
      processedAt: now, // Backend requirement
      reference,
      status: "pending",
    });

    // Auto-post journal entry for the salary payment
    try {
      // Extract statutory deductions for journal posting
      const statutory = calculated.statutoryDeductions;
      
      // PAYE is now included in statutory deductions
      const taxAmount = statutory?.paye || 0;

      await autoPostingService.postSalaryPayment(
        data.staffName,
        data.staffNumber,
        calculated.totalGross,
        calculated.totalDeductions,
        calculated.netPay,
        taxAmount,
        data.paymentMethod,
        {
          description: `Salary payment for ${data.staffName} - ${data.month}/${data.year}`,
          reference: reference,
          transactionDate: data.paymentDate,
          createdBy: data.recordedBy,
          autoPost: true,
          statutoryDeductions: statutory,
        },
      );
    } catch (error) {
      console.error("Failed to auto-post salary payment journal entry:", error);
      // Don't fail the payment if journal entry fails
    }

    // Process financial items: record loan repayments, mark bonuses/penalties as processed
    try {
      // Process loan repayments
      const loanDeductions = regularDeductions.filter(d => 
        d.name.toLowerCase().includes('loan repayment')
      );
      
      for (const loanDeduction of loanDeductions) {
        // Find matching active loan by purpose
        const loans = await staffLoanService.getActiveLoans(data.staffId);
        
        for (const loan of loans) {
          if (loanDeduction.name.includes(loan.purpose)) {
            await loanRepaymentService.recordRepayment({
              loanId: loan.id,
              staffId: data.staffId,
              amount: loanDeduction.amount,
              paymentDate: data.paymentDate,
              month: data.month,
              year: data.year,
              salaryPaymentId: payment.id,
              recordedBy: data.recordedBy,
            });
            break;
          }
        }
      }

      // Process bonuses - mark as paid
      const bonusAllowances = data.allowances.filter(a => 
        a.name.toLowerCase().includes('bonus')
      );
      
      for (const bonusAllowance of bonusAllowances) {
        const bonuses = await staffBonusService.getPendingBonuses(
          data.staffId,
          data.month,
          data.year,
        );
        for (const bonus of bonuses) {
          if (bonusAllowance.name.includes(bonus.reason) && bonusAllowance.amount === bonus.amount) {
            await staffBonusService.markAsPaid(bonus.id, payment.id);
            break;
          }
        }
      }

      // Process penalties - mark as deducted
      const penaltyDeductions = regularDeductions.filter(d => 
        d.name.toLowerCase().includes('penalty')
      );
      
      for (const penaltyDeduction of penaltyDeductions) {
        const penalties = await staffPenaltyService.getPendingPenalties(
          data.staffId,
          data.month,
          data.year,
        );
        for (const penalty of penalties) {
          if (penaltyDeduction.name.includes(penalty.reason) && penaltyDeduction.amount === penalty.amount) {
            await staffPenaltyService.markAsDeducted(penalty.id, payment.id);
            break;
          }
        }
      }
    } catch (error) {
      console.error("Failed to process financial items:", error);
      // Don't fail the payment if financial item processing fails
    }

    return payment;
  }

  /**
   * Get salary payments by staff
   */
  async getByStaffId(staffId: string): Promise<SalaryPayment[]> {
    const payments = await this.list();
    return payments.filter((p) => p.staffId === staffId);
  }

  /**
   * Get salary payments by month and year
   */
  async getByMonthAndYear(
    month: string,
    year: string,
  ): Promise<SalaryPayment[]> {
    const payments = await this.list();
    return payments.filter((p) => p.month === month && p.year === year);
  }

  /**
   * Get payments by status
   */
  async getByStatus(status: SalaryPayment["status"]): Promise<SalaryPayment[]> {
    const payments = await this.list();
    return payments.filter((p) => p.status === status);
  }

  /**
   * Approve salary payment
   */
  async approveSalaryPayment(
    paymentId: string,
    approvedBy: string,
  ): Promise<SalaryPayment> {
    return this.update(paymentId, {
      status: "approved",
      approvedBy,
    });
  }

  /**
   * Mark salary as paid
   */
  async markAsPaid(paymentId: string): Promise<SalaryPayment> {
    return this.update(paymentId, {
      status: "paid",
    });
  }

  /**
   * Check if staff has been paid for a month
   */
  async hasBeenPaid(
    staffId: string,
    month: string,
    year: string,
  ): Promise<boolean> {
    const payments = await this.getByStaffId(staffId);
    return payments.some(
      (p) => p.month === month && p.year === year && p.status === "paid",
    );
  }

  /**
   * Get payroll summary for a month
   */
  async getPayrollSummary(
    month: string,
    year: string,
  ): Promise<{
    totalStaff: number;
    totalGross: number;
    totalDeductions: number;
    totalNetPay: number;
    pendingPayments: number;
    approvedPayments: number;
    paidPayments: number;
    byPaymentMethod: Record<string, { count: number; amount: number }>;
  }> {
    const payments = await this.getByMonthAndYear(month, year);

    const totalStaff = payments.length;
    const totalGross = payments.reduce((sum, p) => sum + p.totalGross, 0);
    const totalDeductions = payments.reduce(
      (sum, p) => sum + p.totalDeductions,
      0,
    );
    const totalNetPay = payments.reduce((sum, p) => sum + p.netPay, 0);

    const pending = payments.filter((p) => p.status === "pending").length;
    const approved = payments.filter((p) => p.status === "approved").length;
    const paid = payments.filter((p) => p.status === "paid").length;

    // By payment method
    const byPaymentMethod: Record<string, { count: number; amount: number }> =
      {};
    payments.forEach((p) => {
      if (!byPaymentMethod[p.paymentMethod]) {
        byPaymentMethod[p.paymentMethod] = { count: 0, amount: 0 };
      }
      byPaymentMethod[p.paymentMethod].count++;
      byPaymentMethod[p.paymentMethod].amount += p.netPay;
    });

    return {
      totalStaff,
      totalGross,
      totalDeductions,
      totalNetPay,
      pendingPayments: pending,
      approvedPayments: approved,
      paidPayments: paid,
      byPaymentMethod,
    };
  }

  /**
   * Get staff payment history
   */
  async getStaffPaymentHistory(
    staffId: string,
    limit?: number,
  ): Promise<SalaryPayment[]> {
    const payments = await this.getByStaffId(staffId);
    const sorted = payments.sort((a, b) => {
      const dateA = `${a.year}-${a.month}`;
      const dateB = `${b.year}-${b.month}`;
      return dateB.localeCompare(dateA);
    });

    return limit ? sorted.slice(0, limit) : sorted;
  }

  /**
   * Calculate year-to-date (YTD) earnings
   */
  async calculateYTDEarnings(
    staffId: string,
    year: string,
  ): Promise<{
    totalGross: number;
    totalDeductions: number;
    totalNetPay: number;
    monthsPaid: number;
  }> {
    const payments = await this.getByStaffId(staffId);
    const yearPayments = payments.filter(
      (p) => p.year === year && p.status === "paid",
    );

    return {
      totalGross: yearPayments.reduce((sum, p) => sum + p.totalGross, 0),
      totalDeductions: yearPayments.reduce(
        (sum, p) => sum + p.totalDeductions,
        0,
      ),
      totalNetPay: yearPayments.reduce((sum, p) => sum + p.netPay, 0),
      monthsPaid: yearPayments.length,
    };
  }

  /**
   * Get salary payments by date range
   */
  async getSalaryPaymentsByDateRange(
    startDate: string,
    endDate: string,
  ): Promise<SalaryPayment[]> {
    const payments = await this.list();
    return payments.filter((p) => {
      const paymentDate = p.paymentDate;
      return paymentDate >= startDate && paymentDate <= endDate;
    });
  }

  /**
   * Generate payslip data
   */
  async generatePayslip(paymentId: string): Promise<{
    payment: SalaryPayment;
    payslipNumber: string;
    formattedPeriod: string;
  }> {
    const payment = await this.getById(paymentId);
    if (!payment) {
      throw new Error("Salary payment not found");
    }

    const payslipNumber = `PS-${payment.reference.replace("SAL-", "")}`;
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const monthName = monthNames[parseInt(payment.month) - 1] || payment.month;
    const formattedPeriod = `${monthName} ${payment.year}`;

    return {
      payment,
      payslipNumber,
      formattedPeriod,
    };
  }
}

// Export singleton instances
export const staffService = new StaffService();
export const salaryPaymentService = new SalaryPaymentService();

// Create a combined service for reports
class CombinedStaffService {
  staffService = staffService;
  salaryPaymentService = salaryPaymentService;

  async getSalaryPaymentsByDateRange(startDate: string, endDate: string) {
    return this.salaryPaymentService.getSalaryPaymentsByDateRange(
      startDate,
      endDate,
    );
  }
}

export const combinedStaffService = new CombinedStaffService();
