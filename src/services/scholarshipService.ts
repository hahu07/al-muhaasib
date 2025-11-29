import { BaseDataService, COLLECTIONS } from "./dataService";
import type {
  Scholarship,
  ScholarshipApplication,
  FeeType,
  AcademicTerm,
} from "@/types";

export class ScholarshipService extends BaseDataService<Scholarship> {
  constructor() {
    super(COLLECTIONS.SCHOLARSHIPS);
  }

  /**
   * Get all active scholarships
   */
  async getActiveScholarships(): Promise<Scholarship[]> {
    const scholarships = await this.list();
    const now = new Date();
    
    return scholarships.filter((s) => {
      if (s.status !== "active") return false;
      
      // Check validity period
      const startDate = new Date(s.startDate);
      if (startDate > now) return false;
      
      if (s.endDate) {
        const endDate = new Date(s.endDate);
        if (endDate < now) return false;
      }
      
      // Check if max beneficiaries reached
      if (s.maxBeneficiaries && s.currentBeneficiaries) {
        if (s.currentBeneficiaries >= s.maxBeneficiaries) return false;
      }
      
      return true;
    });
  }

  /**
   * Get scholarships applicable to a specific student
   */
  async getApplicableScholarships(
    studentId: string,
    classId: string,
    academicYear: string,
    term: AcademicTerm,
  ): Promise<Scholarship[]> {
    const scholarships = await this.getActiveScholarships();

    return scholarships.filter((s) => {
      // Check academic year
      if (s.academicYear && s.academicYear !== academicYear) return false;

      // Check term
      if (s.terms && s.terms.length > 0 && !s.terms.includes(term)) return false;

      // Check applicability
      if (s.applicableTo === "all") return true;

      if (s.applicableTo === "specific_students") {
        return s.studentIds?.includes(studentId) || false;
      }

      if (s.applicableTo === "specific_classes") {
        return s.classIds?.includes(classId) || false;
      }

      return false;
    });
  }

  /**
   * Calculate discount amount based on scholarship
   */
  calculateDiscount(
    scholarship: Scholarship,
    totalAmount: number,
    feeType?: FeeType,
  ): number {
    // Check if fee type is excluded
    if (feeType && scholarship.excludedFeeTypes?.includes(feeType)) {
      return 0;
    }

    // Check if fee type is applicable (if restrictions exist)
    if (
      feeType &&
      scholarship.applicableToFeeTypes &&
      scholarship.applicableToFeeTypes.length > 0 &&
      !scholarship.applicableToFeeTypes.includes(feeType)
    ) {
      return 0;
    }

    let discount = 0;

    if (scholarship.type === "full_waiver") {
      discount = totalAmount;
    } else if (scholarship.type === "percentage" && scholarship.percentageOff) {
      discount = (totalAmount * scholarship.percentageOff) / 100;
    } else if (scholarship.type === "fixed_amount" && scholarship.fixedAmountOff) {
      discount = Math.min(scholarship.fixedAmountOff, totalAmount);
    }

    // Apply max discount per student if specified
    if (scholarship.maxDiscountPerStudent) {
      discount = Math.min(discount, scholarship.maxDiscountPerStudent);
    }

    return Math.round(discount * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Increment beneficiary count
   */
  async incrementBeneficiaries(scholarshipId: string): Promise<void> {
    const scholarship = await this.getById(scholarshipId);
    if (!scholarship) {
      throw new Error("Scholarship not found");
    }

    const currentCount = scholarship.currentBeneficiaries || 0;
    await this.update(scholarshipId, {
      currentBeneficiaries: currentCount + 1,
    });
  }

  /**
   * Decrement beneficiary count
   */
  async decrementBeneficiaries(scholarshipId: string): Promise<void> {
    const scholarship = await this.getById(scholarshipId);
    if (!scholarship) {
      throw new Error("Scholarship not found");
    }

    const currentCount = scholarship.currentBeneficiaries || 0;
    if (currentCount > 0) {
      await this.update(scholarshipId, {
        currentBeneficiaries: currentCount - 1,
      });
    }
  }

  /**
   * Get scholarships by academic year
   */
  async getByAcademicYear(academicYear: string): Promise<Scholarship[]> {
    const scholarships = await this.list();
    return scholarships.filter(
      (s) => !s.academicYear || s.academicYear === academicYear,
    );
  }
}

export class ScholarshipApplicationService extends BaseDataService<ScholarshipApplication> {
  constructor() {
    super(COLLECTIONS.SCHOLARSHIP_APPLICATIONS);
  }

  /**
   * Get applications by student
   */
  async getByStudentId(studentId: string): Promise<ScholarshipApplication[]> {
    const applications = await this.list();
    return applications.filter((a) => a.studentId === studentId);
  }

  /**
   * Get applications by scholarship
   */
  async getByScholarshipId(
    scholarshipId: string,
  ): Promise<ScholarshipApplication[]> {
    const applications = await this.list();
    return applications.filter((a) => a.scholarshipId === scholarshipId);
  }

  /**
   * Get pending applications
   */
  async getPendingApplications(): Promise<ScholarshipApplication[]> {
    const applications = await this.list();
    return applications.filter((a) => a.status === "pending");
  }

  /**
   * Approve application
   */
  async approveApplication(
    applicationId: string,
    approvedBy: string,
    approvedAmount?: number,
    effectiveFrom?: string,
    effectiveUntil?: string,
    reviewNotes?: string,
  ): Promise<ScholarshipApplication> {
    return this.update(applicationId, {
      status: "approved",
      reviewedBy: approvedBy,
      reviewedAt: BigInt(Date.now()) * BigInt(1_000_000),
      approvedAmount,
      effectiveFrom,
      effectiveUntil,
      reviewNotes,
    });
  }

  /**
   * Reject application
   */
  async rejectApplication(
    applicationId: string,
    rejectedBy: string,
    reviewNotes?: string,
  ): Promise<ScholarshipApplication> {
    return this.update(applicationId, {
      status: "rejected",
      reviewedBy: rejectedBy,
      reviewedAt: BigInt(Date.now()) * BigInt(1_000_000),
      reviewNotes,
    });
  }

  /**
   * Check if student has active scholarship for a term
   */
  async hasActiveScholarship(
    studentId: string,
    academicYear: string,
    term: AcademicTerm,
  ): Promise<ScholarshipApplication | null> {
    const applications = await this.getByStudentId(studentId);
    const now = new Date().toISOString().split("T")[0];

    const active = applications.find((a) => {
      if (a.status !== "approved") return false;
      if (a.academicYear !== academicYear) return false;
      if (a.term !== term) return false;

      // Check effective dates
      if (a.effectiveFrom && a.effectiveFrom > now) return false;
      if (a.effectiveUntil && a.effectiveUntil < now) return false;

      return true;
    });

    return active || null;
  }
}

// Export singleton instances
export const scholarshipService = new ScholarshipService();
export const scholarshipApplicationService =
  new ScholarshipApplicationService();
