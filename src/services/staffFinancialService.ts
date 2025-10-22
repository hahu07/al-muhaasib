/**
 * Staff Financial Management Service
 * Handles loans, bonuses, penalties, and other financial transactions for staff
 */

import { BaseDataService, COLLECTIONS } from "./dataService";
import { nanoid } from "nanoid";

// Loan Types
export type StaffLoan = {
  id: string;
  staffId: string;
  staffName: string;
  staffNumber: string;
  amount: number;
  purpose: string;
  monthlyInstallment: number;
  numberOfInstallments: number;
  startDate: string;
  status: "active" | "completed" | "defaulted" | "cancelled";
  approvedBy: string;
  approvedDate: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
};

export type LoanRepayment = {
  id: string;
  loanId: string;
  staffId: string;
  amount: number;
  paymentDate: string;
  month: string;
  year: string;
  salaryPaymentId?: string;
  recordedBy: string;
  createdAt: string;
  [key: string]: unknown;
};

// Bonus Types
export type StaffBonus = {
  id: string;
  staffId: string;
  staffName: string;
  staffNumber: string;
  amount: number;
  reason: string;
  type: "performance" | "holiday" | "special" | "other";
  month: number;
  year: number;
  approvedBy: string;
  approvedDate: string;
  status: "pending" | "paid" | "cancelled";
  paidDate?: string;
  salaryPaymentId?: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
};

// Penalty Types
export type StaffPenalty = {
  id: string;
  staffId: string;
  staffName: string;
  staffNumber: string;
  amount: number;
  reason: string;
  type: "lateness" | "absence" | "misconduct" | "damage" | "other";
  month: number;
  year: number;
  issuedBy: string;
  issuedDate: string;
  status: "pending" | "deducted" | "waived";
  deductedDate?: string;
  waivedDate?: string;
  waivedBy?: string;
  salaryPaymentId?: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
};

// Loan Service
class StaffLoanService extends BaseDataService<StaffLoan> {
  constructor() {
    super(COLLECTIONS.STAFF_LOANS);
  }

  /**
   * Create a new loan
   */
  async createLoan(loanData: {
    staffId: string;
    staffName: string;
    staffNumber: string;
    amount: number;
    purpose: string;
    numberOfInstallments: number;
    startDate: string;
    status: "active" | "completed" | "defaulted" | "cancelled";
    approvedBy: string;
    approvedDate: string;
  }): Promise<StaffLoan> {
    // Calculate monthly installment (no interest)
    const monthlyInstallment = Math.round(
      loanData.amount / loanData.numberOfInstallments,
    );

    const loanToCreate = {
      ...loanData,
      monthlyInstallment,
    };

    return this.create(
      loanToCreate as unknown as Omit<
        StaffLoan,
        "id" | "createdAt" | "updatedAt"
      >,
    );
  }

  /**
   * Get loans by staff ID
   */
  async getByStaffId(staffId: string): Promise<StaffLoan[]> {
    const loans = await this.list();
    return loans.filter((loan) => loan.staffId === staffId);
  }

  /**
   * Get active loans for a staff member
   */
  async getActiveLoans(staffId: string): Promise<StaffLoan[]> {
    const loans = await this.getByStaffId(staffId);
    return loans.filter((loan) => loan.status === "active");
  }

  /**
   * Calculate remaining balance for a loan
   */
  async getRemainingBalance(loanId: string): Promise<number> {
    const loan = await this.getById(loanId);
    if (!loan) return 0;

    const repayments = await loanRepaymentService.getByLoanId(loanId);
    const totalRepaid = repayments.reduce((sum, r) => sum + r.amount, 0);

    return Math.max(0, loan.amount - totalRepaid);
  }

  /**
   * Check if loan is fully paid
   */
  async checkLoanCompletion(loanId: string): Promise<void> {
    const remaining = await this.getRemainingBalance(loanId);

    if (remaining <= 0) {
      const loan = await this.getById(loanId);
      if (loan && loan.status === "active") {
        await this.update(loanId, {
          status: "completed",
          updatedAt: new Date().toISOString(),
        });
      }
    }
  }

  /**
   * Get loan summary for a staff member
   */
  async getLoanSummary(staffId: string): Promise<{
    totalLoans: number;
    activeLoans: number;
    totalBorrowed: number;
    totalRepaid: number;
    totalOutstanding: number;
  }> {
    const loans = await this.getByStaffId(staffId);
    const activeLoans = loans.filter((l) => l.status === "active");

    let totalOutstanding = 0;
    for (const loan of activeLoans) {
      totalOutstanding += await this.getRemainingBalance(loan.id);
    }

    const allRepayments = await loanRepaymentService.list();
    const staffRepayments = allRepayments.filter((r) => r.staffId === staffId);
    const totalRepaid = staffRepayments.reduce((sum, r) => sum + r.amount, 0);

    return {
      totalLoans: loans.length,
      activeLoans: activeLoans.length,
      totalBorrowed: loans.reduce((sum, l) => sum + l.amount, 0),
      totalRepaid,
      totalOutstanding,
    };
  }
}

// Loan Repayment Service
class LoanRepaymentService extends BaseDataService<LoanRepayment> {
  constructor() {
    super(COLLECTIONS.LOAN_REPAYMENTS);
  }

  /**
   * Record a loan repayment
   */
  async recordRepayment(repaymentData: {
    loanId: string;
    staffId: string;
    amount: number;
    paymentDate: string;
    month: string;
    year: string;
    salaryPaymentId?: string;
    recordedBy: string;
  }): Promise<LoanRepayment> {
    const repayment: LoanRepayment = {
      ...repaymentData,
      id: nanoid(),
      createdAt: new Date().toISOString(),
    };

    const created = await this.create(
      repayment as unknown as Omit<LoanRepayment, "id" | "createdAt">,
    );

    // Check if loan is completed
    await staffLoanService.checkLoanCompletion(repaymentData.loanId);

    return created;
  }

  /**
   * Get repayments for a specific loan
   */
  async getByLoanId(loanId: string): Promise<LoanRepayment[]> {
    const repayments = await this.list();
    return repayments.filter((r) => r.loanId === loanId);
  }

  /**
   * Get repayments by staff ID
   */
  async getByStaffId(staffId: string): Promise<LoanRepayment[]> {
    const repayments = await this.list();
    return repayments.filter((r) => r.staffId === staffId);
  }
}

// Bonus Service
class StaffBonusService extends BaseDataService<StaffBonus> {
  constructor() {
    super(COLLECTIONS.STAFF_BONUSES);
  }

  /**
   * Create a new bonus
   */
  async createBonus(bonusData: {
    staffId: string;
    staffName: string;
    staffNumber: string;
    amount: number;
    reason: string;
    type: "performance" | "holiday" | "special" | "other";
    month: number;
    year: number;
    approvedBy: string;
    approvedDate: string;
    status: "pending" | "paid" | "cancelled";
    paidDate?: string;
    salaryPaymentId?: string;
  }): Promise<StaffBonus> {
    const bonus: StaffBonus = {
      ...bonusData,
      id: nanoid(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return this.create(
      bonus as unknown as Omit<StaffBonus, "id" | "createdAt" | "updatedAt">,
    );
  }

  /**
   * Get bonuses by staff ID
   */
  async getByStaffId(staffId: string): Promise<StaffBonus[]> {
    const bonuses = await this.list();
    return bonuses.filter((b) => b.staffId === staffId);
  }

  /**
   * Get pending bonuses for a staff member
   */
  async getPendingBonuses(
    staffId: string,
    month: string,
    year: string,
  ): Promise<StaffBonus[]> {
    const bonuses = await this.getByStaffId(staffId);
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    return bonuses.filter(
      (b) =>
        b.status === "pending" && b.month === monthNum && b.year === yearNum,
    );
  }

  /**
   * Mark bonus as paid
   */
  async markAsPaid(bonusId: string, salaryPaymentId?: string): Promise<void> {
    await this.update(bonusId, {
      status: "paid",
      paidDate: new Date().toISOString(),
      ...(salaryPaymentId && { salaryPaymentId }),
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Cancel a bonus
   */
  async cancelBonus(bonusId: string): Promise<void> {
    await this.update(bonusId, {
      status: "cancelled",
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Get bonus summary for a staff member
   */
  async getBonusSummary(staffId: string): Promise<{
    totalBonuses: number;
    totalAmount: number;
    pendingAmount: number;
    paidAmount: number;
  }> {
    const bonuses = await this.getByStaffId(staffId);
    const pending = bonuses.filter((b) => b.status === "pending");
    const paid = bonuses.filter((b) => b.status === "paid");

    return {
      totalBonuses: bonuses.length,
      totalAmount: bonuses.reduce((sum, b) => sum + b.amount, 0),
      pendingAmount: pending.reduce((sum, b) => sum + b.amount, 0),
      paidAmount: paid.reduce((sum, b) => sum + b.amount, 0),
    };
  }
}

// Penalty Service
class StaffPenaltyService extends BaseDataService<StaffPenalty> {
  constructor() {
    super(COLLECTIONS.STAFF_PENALTIES);
  }

  /**
   * Create a new penalty
   */
  async createPenalty(penaltyData: {
    staffId: string;
    staffName: string;
    staffNumber: string;
    amount: number;
    reason: string;
    type: "lateness" | "absence" | "misconduct" | "damage" | "other";
    month: number;
    year: number;
    issuedBy: string;
    issuedDate: string;
    status: "pending" | "deducted" | "waived";
    deductedDate?: string;
    salaryPaymentId?: string;
  }): Promise<StaffPenalty> {
    const penalty: StaffPenalty = {
      ...penaltyData,
      id: nanoid(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return this.create(
      penalty as unknown as Omit<
        StaffPenalty,
        "id" | "createdAt" | "updatedAt"
      >,
    );
  }

  /**
   * Get penalties by staff ID
   */
  async getByStaffId(staffId: string): Promise<StaffPenalty[]> {
    const penalties = await this.list();
    return penalties.filter((p) => p.staffId === staffId);
  }

  /**
   * Get pending penalties for a staff member
   */
  async getPendingPenalties(
    staffId: string,
    month: string,
    year: string,
  ): Promise<StaffPenalty[]> {
    const penalties = await this.getByStaffId(staffId);
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    return penalties.filter(
      (p) =>
        p.status === "pending" && p.month === monthNum && p.year === yearNum,
    );
  }

  /**
   * Mark penalty as deducted
   */
  async markAsDeducted(
    penaltyId: string,
    salaryPaymentId?: string,
  ): Promise<void> {
    await this.update(penaltyId, {
      status: "deducted",
      deductedDate: new Date().toISOString(),
      ...(salaryPaymentId && { salaryPaymentId }),
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Waive a penalty
   */
  async waivePenalty(penaltyId: string, waivedBy?: string): Promise<void> {
    await this.update(penaltyId, {
      status: "waived",
      waivedDate: new Date().toISOString(),
      ...(waivedBy && { waivedBy }),
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Get penalty summary for a staff member
   */
  async getPenaltySummary(staffId: string): Promise<{
    totalPenalties: number;
    totalAmount: number;
    pendingAmount: number;
    deductedAmount: number;
  }> {
    const penalties = await this.getByStaffId(staffId);
    const pending = penalties.filter((p) => p.status === "pending");
    const deducted = penalties.filter((p) => p.status === "deducted");

    return {
      totalPenalties: penalties.length,
      totalAmount: penalties.reduce((sum, p) => sum + p.amount, 0),
      pendingAmount: pending.reduce((sum, p) => sum + p.amount, 0),
      deductedAmount: deducted.reduce((sum, p) => sum + p.amount, 0),
    };
  }
}

// Export service instances
export const staffLoanService = new StaffLoanService();
export const loanRepaymentService = new LoanRepaymentService();
export const staffBonusService = new StaffBonusService();
export const staffPenaltyService = new StaffPenaltyService();

// Combined financial summary
export async function getStaffFinancialSummary(staffId: string): Promise<{
  loans: Awaited<ReturnType<typeof staffLoanService.getLoanSummary>>;
  bonuses: Awaited<ReturnType<typeof staffBonusService.getBonusSummary>>;
  penalties: Awaited<ReturnType<typeof staffPenaltyService.getPenaltySummary>>;
}> {
  const [loans, bonuses, penalties] = await Promise.all([
    staffLoanService.getLoanSummary(staffId),
    staffBonusService.getBonusSummary(staffId),
    staffPenaltyService.getPenaltySummary(staffId),
  ]);

  return { loans, bonuses, penalties };
}
