import { BaseDataService, COLLECTIONS } from "./dataService";
import type {
  FeeCategory,
  FeeStructure,
  StudentFeeAssignment,
  FeeItem,
  StudentFeeItem,
} from "@/types";
import { nanoid } from "nanoid";
import { autoPostingService } from "./autoPostingService";
export class FeeCategoryService extends BaseDataService<FeeCategory> {
  constructor() {
    super(COLLECTIONS.FEE_CATEGORIES);
  }

  async getActiveFeeCategories(): Promise<FeeCategory[]> {
    const categories = await this.list();
    return categories.filter((c) => c.isActive);
  }

  async getByType(type: FeeCategory["type"]): Promise<FeeCategory[]> {
    const categories = await this.list();
    return categories.filter((c) => c.type === type && c.isActive);
  }
}

export class FeeStructureService extends BaseDataService<FeeStructure> {
  constructor() {
    super(COLLECTIONS.FEE_STRUCTURES);
  }

  /**
   * Get fee structure by class and academic year/term
   */
  async getByClassAndTerm(
    classId: string,
    academicYear: string,
    term: FeeStructure["term"],
  ): Promise<FeeStructure | null> {
    const structures = await this.list();
    return (
      structures.find(
        (s) =>
          s.classId === classId &&
          s.academicYear === academicYear &&
          s.term === term &&
          s.isActive,
      ) || null
    );
  }

  /**
   * Get all fee structures for an academic year
   */
  async getByAcademicYear(academicYear: string): Promise<FeeStructure[]> {
    const structures = await this.list();
    return structures.filter(
      (s) => s.academicYear === academicYear && s.isActive,
    );
  }

  /**
   * Create fee structure with automatic total calculation
   */
  async createFeeStructure(
    data: Omit<FeeStructure, "id" | "createdAt" | "updatedAt" | "totalAmount">,
  ): Promise<FeeStructure> {
    const feeItems = data.feeItems as FeeItem[];
    const totalAmount = feeItems.reduce((sum, item) => sum + item.amount, 0);
    return this.create({ ...data, totalAmount });
  }

  /**
   * Update fee structure with automatic total recalculation
   */
  async updateFeeStructure(
    id: string,
    data: Partial<Omit<FeeStructure, "id" | "createdAt" | "updatedAt">>,
  ): Promise<FeeStructure> {
    if (data.feeItems) {
      const feeItems = data.feeItems as FeeItem[];
      const totalAmount = feeItems.reduce((sum, item) => sum + item.amount, 0);
      return this.update(id, { ...data, totalAmount });
    }
    return this.update(id, data);
  }

  /**
   * Clone fee structure to another class or term
   */
  async cloneFeeStructure(
    sourceId: string,
    targetClassId: string,
    targetAcademicYear: string,
    targetTerm: FeeStructure["term"],
  ): Promise<FeeStructure> {
    const source = await this.getById(sourceId);
    if (!source) {
      throw new Error("Source fee structure not found");
    }

    // Check if target already exists
    const existing = await this.getByClassAndTerm(
      targetClassId,
      targetAcademicYear,
      targetTerm,
    );
    if (existing) {
      throw new Error("Fee structure already exists for target class and term");
    }

    const newStructure = {
      classId: targetClassId,
      className: source.className, // Will be updated with actual class name
      academicYear: targetAcademicYear,
      term: targetTerm,
      feeItems: source.feeItems,
      isActive: true,
    };

    return this.createFeeStructure(newStructure);
  }

  /**
   * Get affected students for a fee structure change
   * Returns students whose assignments would be affected
   */
  async getAffectedStudents(structureId: string): Promise<
    Array<{
      assignmentId: string;
      studentId: string;
      studentName: string;
      currentTotal: number;
      newTotal: number;
      difference: number;
      hasPaid: boolean;
      amountPaid: number;
    }>
  > {
    const structure = await this.getById(structureId);
    if (!structure) {
      throw new Error("Fee structure not found");
    }

    const assignmentService = studentFeeAssignmentService;
    const assignments = await assignmentService.getByClassAndTerm(
      structure.classId,
      structure.academicYear,
      structure.term,
    );

    return assignments.map((assignment) => ({
      assignmentId: assignment.id,
      studentId: assignment.studentId,
      studentName: assignment.studentName,
      currentTotal: assignment.totalAmount,
      newTotal: structure.totalAmount,
      difference: structure.totalAmount - assignment.totalAmount,
      hasPaid: assignment.amountPaid > 0,
      amountPaid: assignment.amountPaid,
    }));
  }

  /**
   * Update specific student fee assignments from updated structure
   * @param structureId - The fee structure that was updated
   * @param studentIds - Array of student IDs to update (if empty, updates all)
   * @param options - Update options
   */
  async updateStudentAssignments(
    structureId: string,
    studentIds: string[] = [],
    options: {
      updatePaidStudents?: boolean; // Whether to update students who already paid
      preservePayments?: boolean; // Whether to preserve existing payment data
    } = {},
  ): Promise<{
    updated: number;
    skipped: number;
    errors: Array<{ studentId: string; error: string }>;
  }> {
    const { updatePaidStudents = false, preservePayments = true } = options;

    const structure = await this.getById(structureId);
    if (!structure) {
      throw new Error("Fee structure not found");
    }

    const assignmentService = studentFeeAssignmentService;

    // Get all assignments for this class/term
    const allAssignments = await assignmentService.getByClassAndTerm(
      structure.classId,
      structure.academicYear,
      structure.term,
    );

    // Filter assignments based on studentIds (if provided)
    const assignments =
      studentIds.length > 0
        ? allAssignments.filter((a) => studentIds.includes(a.studentId))
        : allAssignments;

    let updated = 0;
    let skipped = 0;
    const errors: Array<{ studentId: string; error: string }> = [];

    for (const assignment of assignments) {
      try {
        // Skip if student has already paid and updatePaidStudents is false
        if (!updatePaidStudents && assignment.amountPaid > 0) {
          skipped++;
          continue;
        }

        // Calculate the difference
        const oldTotal = assignment.totalAmount;
        const newTotal = structure.totalAmount;
        const difference = newTotal - oldTotal;

        // Update fee items
        const updatedFeeItems = structure.feeItems.map((newItem) => {
          if (preservePayments) {
            // Find matching old item to preserve payment data
            const oldItem = assignment.feeItems.find(
              (old) => old.categoryId === newItem.categoryId,
            );

            if (oldItem) {
              // Keep existing payment data, update amount
              const newBalance = newItem.amount - oldItem.amountPaid;
              return {
                categoryId: newItem.categoryId,
                categoryName: newItem.categoryName,
                type: newItem.type,
                amount: newItem.amount,
                amountPaid: oldItem.amountPaid,
                balance: newBalance > 0 ? newBalance : 0,
                isMandatory: newItem.isMandatory,
              };
            }
          }

          // New fee item or not preserving payments
          return {
            categoryId: newItem.categoryId,
            categoryName: newItem.categoryName,
            type: newItem.type,
            amount: newItem.amount,
            amountPaid: 0,
            balance: newItem.amount,
            isMandatory: newItem.isMandatory,
          };
        });

        // Calculate new balance
        const totalPaid = updatedFeeItems.reduce(
          (sum, item) => sum + item.amountPaid,
          0,
        );
        const newBalance = newTotal - totalPaid;

        // Determine status
        let status: StudentFeeAssignment["status"];
        if (totalPaid === 0) {
          status = "unpaid";
        } else if (newBalance === 0) {
          status = "paid";
        } else if (newBalance < 0) {
          status = "overpaid";
        } else {
          status = "partial";
        }

        // Update the assignment
        await assignmentService.update(assignment.id, {
          feeItems: updatedFeeItems,
          totalAmount: newTotal,
          amountPaid: totalPaid,
          balance: newBalance,
          status,
        });

        // Update student totals
        try {
          await assignmentService.recalculateStudentTotals(
            assignment.studentId,
          );
        } catch (error) {
          console.error(
            `Failed to recalculate totals for student ${assignment.studentId}:`,
            error,
          );
        }

        updated++;
      } catch (error) {
        errors.push({
          studentId: assignment.studentId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return { updated, skipped, errors };
  }
}

export class StudentFeeAssignmentService extends BaseDataService<StudentFeeAssignment> {
  constructor() {
    super(COLLECTIONS.STUDENT_FEE_ASSIGNMENTS);
  }

  /**
   * Assign fee structure to a student
   */
  async assignFeesToStudent(
    studentId: string,
    studentName: string,
    classId: string,
    className: string,
    feeStructureId: string,
    academicYear: string,
    term: StudentFeeAssignment["term"],
    feeItems: FeeItem[],
    dueDate?: string,
  ): Promise<StudentFeeAssignment> {
    // Convert FeeItem to StudentFeeItem
    const studentFeeItems: StudentFeeItem[] = feeItems.map((item) => ({
      categoryId: item.categoryId,
      categoryName: item.categoryName,
      type: item.type,
      amount: item.amount,
      amountPaid: 0,
      balance: item.amount,
      isMandatory: item.isMandatory,
    }));

    const totalAmount = studentFeeItems.reduce(
      (sum, item) => sum + item.amount,
      0,
    );

    // Create the assignment
    const assignment = await this.create({
      studentId,
      studentName,
      classId,
      className,
      feeStructureId,
      academicYear,
      term,
      feeItems: studentFeeItems,
      totalAmount,
      amountPaid: 0,
      balance: totalAmount,
      status: "unpaid",
      dueDate,
    });

    // Auto-post journal entry for fee assignment (recognizes revenue and receivable)
    try {
      const feeAllocations = studentFeeItems.map((item) => ({
        feeType: item.type,
        amount: item.amount,
      }));

      await autoPostingService.postFeeAssignment(
        studentName,
        studentId, // Using studentId as admission number reference
        feeAllocations,
        {
          description: `Fees assigned to ${studentName} - ${className} (${academicYear} ${term} term)`,
          reference: assignment.id,
          transactionDate: new Date().toISOString().split("T")[0],
          createdBy: "system", // This should be passed from the calling context ideally
          autoPost: true,
        },
      );
    } catch (error) {
      console.error("Failed to auto-post fee assignment journal entry:", error);
      // Don't fail the assignment if journal entry fails
      // The entry can be created manually later
    }

    // Update student's fee totals
    try {
      // Import student service dynamically to avoid circular dependencies
      const { studentService } = await import("./index");

      // Get current student to calculate new totals
      const student = await studentService.getById(studentId);
      if (student) {
        const newTotalFeesAssigned = student.totalFeesAssigned + totalAmount;
        const newBalance = newTotalFeesAssigned - student.totalPaid;

        await studentService.update(studentId, {
          totalFeesAssigned: newTotalFeesAssigned,
          balance: newBalance,
        });
      }
    } catch (error) {
      console.error(
        "Error updating student totals after fee assignment:",
        error,
      );
      // Don't fail the assignment if student update fails
    }

    return assignment;
  }

  /**
   * Get fee assignments for a student
   */
  async getByStudentId(studentId: string): Promise<StudentFeeAssignment[]> {
    const assignments = await this.list();
    return assignments.filter((a) => a.studentId === studentId);
  }

  /**
   * Get fee assignments by class and term
   */
  async getByClassAndTerm(
    classId: string,
    academicYear: string,
    term: StudentFeeAssignment["term"],
  ): Promise<StudentFeeAssignment[]> {
    const assignments = await this.list();
    return assignments.filter(
      (a) =>
        a.classId === classId &&
        a.academicYear === academicYear &&
        a.term === term,
    );
  }

  /**
   * Get assignments by payment status
   */
  async getByStatus(
    status: StudentFeeAssignment["status"],
  ): Promise<StudentFeeAssignment[]> {
    const assignments = await this.list();
    return assignments.filter((a) => a.status === status);
  }

  /**
   * Record payment against fee assignment
   */
  async recordPayment(
    assignmentId: string,
    amount: number,
    allocations: { categoryId: string; amount: number }[],
  ): Promise<StudentFeeAssignment> {
    const assignment = await this.getById(assignmentId);
    if (!assignment) {
      throw new Error("Fee assignment not found");
    }

    // Update fee items with payments
    const updatedFeeItems = assignment.feeItems.map((item) => {
      const allocation = allocations.find(
        (a) => a.categoryId === item.categoryId,
      );
      if (allocation) {
        const newAmountPaid = item.amountPaid + allocation.amount;
        return {
          ...item,
          amountPaid: newAmountPaid,
          balance: item.amount - newAmountPaid,
        };
      }
      return item;
    });

    const newAmountPaid = assignment.amountPaid + amount;
    const newBalance = assignment.totalAmount - newAmountPaid;

    let status: StudentFeeAssignment["status"] = "partial";
    if (newBalance === 0) status = "paid";
    else if (newBalance < 0) status = "overpaid";
    else if (newAmountPaid === 0) status = "unpaid";

    return this.update(assignmentId, {
      feeItems: updatedFeeItems,
      amountPaid: newAmountPaid,
      balance: newBalance,
      status,
    });
  }

  /**
   * Get payment summary for a term
   */
  async getPaymentSummary(
    academicYear: string,
    term: StudentFeeAssignment["term"],
  ): Promise<{
    totalAssigned: number;
    totalPaid: number;
    totalBalance: number;
    paidCount: number;
    partialCount: number;
    unpaidCount: number;
    totalStudents: number;
  }> {
    const assignments = await this.list();
    const filtered = assignments.filter(
      (a) => a.academicYear === academicYear && a.term === term,
    );

    return {
      totalAssigned: filtered.reduce((sum, a) => sum + a.totalAmount, 0),
      totalPaid: filtered.reduce((sum, a) => sum + a.amountPaid, 0),
      totalBalance: filtered.reduce((sum, a) => sum + a.balance, 0),
      paidCount: filtered.filter((a) => a.status === "paid").length,
      partialCount: filtered.filter((a) => a.status === "partial").length,
      unpaidCount: filtered.filter((a) => a.status === "unpaid").length,
      totalStudents: filtered.length,
    };
  }

  /**
   * Recalculate and update student totals based on their fee assignments
   */
  async recalculateStudentTotals(studentId: string): Promise<void> {
    try {
      // Get all assignments for this student
      const assignments = await this.getByStudentId(studentId);

      // Calculate totals from assignments
      const totalFeesAssigned = assignments.reduce(
        (sum, a) => sum + a.totalAmount,
        0,
      );
      const totalPaid = assignments.reduce((sum, a) => sum + a.amountPaid, 0);
      const balance = totalFeesAssigned - totalPaid;

      // Update student record
      const { StudentService } = await import("./dataService");
      const studentService = new StudentService();
      await studentService.update(studentId, {
        totalFeesAssigned,
        totalPaid,
        balance,
      });
    } catch (error) {
      console.error(
        `Error recalculating totals for student ${studentId}:`,
        error,
      );
      throw error;
    }
  }
}

// Export singleton instances
export const feeCategoryService = new FeeCategoryService();
export const feeStructureService = new FeeStructureService();
export const studentFeeAssignmentService = new StudentFeeAssignmentService();
