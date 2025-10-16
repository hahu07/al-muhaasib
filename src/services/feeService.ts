import { BaseDataService, COLLECTIONS } from './dataService';
import type { FeeCategory, FeeStructure, StudentFeeAssignment, FeeItem, StudentFeeItem } from '@/types';

export class FeeCategoryService extends BaseDataService<FeeCategory> {
  constructor() {
    super(COLLECTIONS.FEE_CATEGORIES);
  }

  async getActiveFeeCategories(): Promise<FeeCategory[]> {
    const categories = await this.list();
    return categories.filter(c => c.isActive);
  }

  async getByType(type: FeeCategory['type']): Promise<FeeCategory[]> {
    const categories = await this.list();
    return categories.filter(c => c.type === type && c.isActive);
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
    term: FeeStructure['term']
  ): Promise<FeeStructure | null> {
    const structures = await this.list();
    return structures.find(s =>
      s.classId === classId &&
      s.academicYear === academicYear &&
      s.term === term &&
      s.isActive
    ) || null;
  }

  /**
   * Get all fee structures for an academic year
   */
  async getByAcademicYear(academicYear: string): Promise<FeeStructure[]> {
    const structures = await this.list();
    return structures.filter(s =>
      s.academicYear === academicYear && s.isActive
    );
  }

  /**
   * Create fee structure with automatic total calculation
   */
  async createFeeStructure(
    data: Omit<FeeStructure, 'id' | 'createdAt' | 'updatedAt' | 'totalAmount'>
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
    data: Partial<Omit<FeeStructure, 'id' | 'createdAt' | 'updatedAt'>>
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
    targetTerm: FeeStructure['term']
  ): Promise<FeeStructure> {
    const source = await this.getById(sourceId);
    if (!source) {
      throw new Error('Source fee structure not found');
    }

    // Check if target already exists
    const existing = await this.getByClassAndTerm(
      targetClassId,
      targetAcademicYear,
      targetTerm
    );
    if (existing) {
      throw new Error('Fee structure already exists for target class and term');
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
    term: StudentFeeAssignment['term'],
    feeItems: FeeItem[],
    dueDate?: string
  ): Promise<StudentFeeAssignment> {
    // Convert FeeItem to StudentFeeItem
    const studentFeeItems: StudentFeeItem[] = feeItems.map(item => ({
      categoryId: item.categoryId,
      categoryName: item.categoryName,
      type: item.type,
      amount: item.amount,
      amountPaid: 0,
      balance: item.amount,
      isMandatory: item.isMandatory,
    }));

    const totalAmount = studentFeeItems.reduce((sum, item) => sum + item.amount, 0);

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
      status: 'unpaid',
      dueDate,
    });

    // Update student's fee totals
    try {
      // Import student service dynamically to avoid circular dependencies
      const { studentService } = await import('./index');
      
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
      console.error('Error updating student totals after fee assignment:', error);
      // Don't fail the assignment if student update fails
    }

    return assignment;
  }

  /**
   * Get fee assignments for a student
   */
  async getByStudentId(studentId: string): Promise<StudentFeeAssignment[]> {
    const assignments = await this.list();
    return assignments.filter(a => a.studentId === studentId);
  }

  /**
   * Get fee assignments by class and term
   */
  async getByClassAndTerm(
    classId: string,
    academicYear: string,
    term: StudentFeeAssignment['term']
  ): Promise<StudentFeeAssignment[]> {
    const assignments = await this.list();
    return assignments.filter(a =>
      a.classId === classId &&
      a.academicYear === academicYear &&
      a.term === term
    );
  }

  /**
   * Get assignments by payment status
   */
  async getByStatus(status: StudentFeeAssignment['status']): Promise<StudentFeeAssignment[]> {
    const assignments = await this.list();
    return assignments.filter(a => a.status === status);
  }

  /**
   * Record payment against fee assignment
   */
  async recordPayment(
    assignmentId: string,
    amount: number,
    allocations: { categoryId: string; amount: number }[]
  ): Promise<StudentFeeAssignment> {
    const assignment = await this.getById(assignmentId);
    if (!assignment) {
      throw new Error('Fee assignment not found');
    }

    // Update fee items with payments
    const updatedFeeItems = assignment.feeItems.map(item => {
      const allocation = allocations.find(a => a.categoryId === item.categoryId);
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

    let status: StudentFeeAssignment['status'] = 'partial';
    if (newBalance === 0) status = 'paid';
    else if (newBalance < 0) status = 'overpaid';
    else if (newAmountPaid === 0) status = 'unpaid';

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
  async getPaymentSummary(academicYear: string, term: StudentFeeAssignment['term']): Promise<{
    totalAssigned: number;
    totalPaid: number;
    totalBalance: number;
    paidCount: number;
    partialCount: number;
    unpaidCount: number;
    totalStudents: number;
  }> {
    const assignments = await this.list();
    const filtered = assignments.filter(a =>
      a.academicYear === academicYear && a.term === term
    );

    return {
      totalAssigned: filtered.reduce((sum, a) => sum + a.totalAmount, 0),
      totalPaid: filtered.reduce((sum, a) => sum + a.amountPaid, 0),
      totalBalance: filtered.reduce((sum, a) => sum + a.balance, 0),
      paidCount: filtered.filter(a => a.status === 'paid').length,
      partialCount: filtered.filter(a => a.status === 'partial').length,
      unpaidCount: filtered.filter(a => a.status === 'unpaid').length,
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
      const totalFeesAssigned = assignments.reduce((sum, a) => sum + a.totalAmount, 0);
      const totalPaid = assignments.reduce((sum, a) => sum + a.amountPaid, 0);
      const balance = totalFeesAssigned - totalPaid;

      // Update student record
      const { StudentService } = await import('./dataService');
      const studentService = new StudentService();
      await studentService.update(studentId, {
        totalFeesAssigned,
        totalPaid,
        balance,
      });
    } catch (error) {
      console.error(`Error recalculating totals for student ${studentId}:`, error);
      throw error;
    }
  }
}

// Export singleton instances
export const feeCategoryService = new FeeCategoryService();
export const feeStructureService = new FeeStructureService();
export const studentFeeAssignmentService = new StudentFeeAssignmentService();
