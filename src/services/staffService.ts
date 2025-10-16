import { BaseDataService, COLLECTIONS } from './dataService';
import type { StaffMember, SalaryPayment, PaymentAllowance, PaymentDeduction } from '@/types';
import { nanoid } from 'nanoid';

export class StaffService extends BaseDataService<StaffMember> {
  constructor() {
    super(COLLECTIONS.STAFF_MEMBERS);
  }

  /**
   * Get active staff members
   */
  async getActiveStaff(): Promise<StaffMember[]> {
    const staff = await this.list();
    return staff.filter(s => s.isActive);
  }

  /**
   * Get staff by employment type
   */
  async getByEmploymentType(type: StaffMember['employmentType']): Promise<StaffMember[]> {
    const staff = await this.list();
    return staff.filter(s => s.employmentType === type && s.isActive);
  }

  /**
   * Get staff by department
   */
  async getByDepartment(department: string): Promise<StaffMember[]> {
    const staff = await this.list();
    return staff.filter(s => s.department === department && s.isActive);
  }

  /**
   * Get staff by staff number
   */
  async getByStaffNumber(staffNumber: string): Promise<StaffMember | null> {
    const staff = await this.list();
    return staff.find(s => s.staffNumber === staffNumber) || null;
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
    const allowancesTotal = staff.allowances?.reduce((sum, a) => sum + a.amount, 0) || 0;
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
        staffNumber: 'STF001',
        firstname: 'John',
        surname: 'Adebayo',
        position: 'Mathematics Teacher',
        department: 'Science Department',
        employmentType: 'full-time' as const,
        employmentDate: '2022-09-01',
        basicSalary: 150000,
        phone: '08012345678',
        email: 'john.adebayo@school.edu',
        address: '123 Lagos Street, Lagos',
        bankName: 'First Bank',
        accountNumber: '1234567890',
        allowances: [
          { name: 'Transport Allowance', amount: 20000, isRecurring: true },
          { name: 'Teaching Allowance', amount: 15000, isRecurring: true }
        ],
        isActive: true
      },
      {
        staffNumber: 'STF002',
        firstname: 'Sarah',
        surname: 'Okonkwo',
        position: 'English Teacher',
        department: 'Arts Department',
        employmentType: 'full-time' as const,
        employmentDate: '2021-01-15',
        basicSalary: 140000,
        phone: '08098765432',
        email: 'sarah.okonkwo@school.edu',
        address: '456 Abuja Road, Abuja',
        bankName: 'GTBank',
        accountNumber: '9876543210',
        allowances: [
          { name: 'Transport Allowance', amount: 20000, isRecurring: true }
        ],
        isActive: true
      },
      {
        staffNumber: 'STF003',
        firstname: 'Ahmed',
        surname: 'Hassan',
        position: 'Physics Teacher',
        department: 'Science Department',
        employmentType: 'part-time' as const,
        employmentDate: '2023-03-20',
        basicSalary: 80000,
        phone: '08055443322',
        email: 'ahmed.hassan@school.edu',
        address: '789 Kano Close, Kano',
        bankName: 'UBA',
        accountNumber: '5555666677',
        allowances: [],
        isActive: false
      },
      {
        staffNumber: 'STF004',
        firstname: 'Grace',
        surname: 'Eze',
        position: 'School Secretary',
        department: 'Administration',
        employmentType: 'full-time' as const,
        employmentDate: '2020-06-10',
        basicSalary: 120000,
        phone: '08077889900',
        email: 'grace.eze@school.edu',
        address: '321 Enugu Avenue, Enugu',
        bankName: 'Zenith Bank',
        accountNumber: '1111222233',
        allowances: [
          { name: 'Administrative Allowance', amount: 25000, isRecurring: true }
        ],
        isActive: true
      }
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
    const activeStaff = allStaff.filter(s => s.isActive);

    const byEmploymentType: Record<string, number> = {};
    const byDepartment: Record<string, number> = {};

    activeStaff.forEach(s => {
      // By employment type
      byEmploymentType[s.employmentType] = (byEmploymentType[s.employmentType] || 0) + 1;

      // By department
      if (s.department) {
        byDepartment[s.department] = (byDepartment[s.department] || 0) + 1;
      }
    });

    const totalMonthlySalaries = activeStaff.reduce(
      (sum, s) => sum + this.calculateTotalCompensation(s),
      0
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
   * Calculate salary with allowances and deductions
   */
  calculateSalary(data: {
    basicSalary: number;
    allowances: PaymentAllowance[];
    deductions?: PaymentDeduction[];
  }): {
    totalGross: number;
    totalDeductions: number;
    netPay: number;
  } {
    const totalAllowances = data.allowances.reduce((sum, a) => sum + a.amount, 0);
    const totalGross = data.basicSalary + totalAllowances;
    const totalDeductions = data.deductions?.reduce((sum, d) => sum + d.amount, 0) || 0;
    const netPay = totalGross - totalDeductions;

    return {
      totalGross,
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
    paymentMethod: SalaryPayment['paymentMethod'];
    paymentDate: string;
    recordedBy: string;
  }): Promise<SalaryPayment> {
    const reference = `SAL-${data.year}-${data.month}-${nanoid(6).toUpperCase()}`;

    const calculated = this.calculateSalary({
      basicSalary: data.basicSalary,
      allowances: data.allowances,
      deductions: data.deductions,
    });

    return this.create({
      ...data,
      deductions: data.deductions || [],
      ...calculated,
      reference,
      status: 'pending',
    });
  }

  /**
   * Get salary payments by staff
   */
  async getByStaffId(staffId: string): Promise<SalaryPayment[]> {
    const payments = await this.list();
    return payments.filter(p => p.staffId === staffId);
  }

  /**
   * Get salary payments by month and year
   */
  async getByMonthAndYear(month: string, year: string): Promise<SalaryPayment[]> {
    const payments = await this.list();
    return payments.filter(p => p.month === month && p.year === year);
  }

  /**
   * Get payments by status
   */
  async getByStatus(status: SalaryPayment['status']): Promise<SalaryPayment[]> {
    const payments = await this.list();
    return payments.filter(p => p.status === status);
  }

  /**
   * Approve salary payment
   */
  async approveSalaryPayment(paymentId: string, approvedBy: string): Promise<SalaryPayment> {
    return this.update(paymentId, {
      status: 'approved',
      approvedBy,
    });
  }

  /**
   * Mark salary as paid
   */
  async markAsPaid(paymentId: string): Promise<SalaryPayment> {
    return this.update(paymentId, {
      status: 'paid',
    });
  }

  /**
   * Check if staff has been paid for a month
   */
  async hasBeenPaid(staffId: string, month: string, year: string): Promise<boolean> {
    const payments = await this.getByStaffId(staffId);
    return payments.some(
      p => p.month === month && p.year === year && p.status === 'paid'
    );
  }

  /**
   * Get payroll summary for a month
   */
  async getPayrollSummary(month: string, year: string): Promise<{
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
    const totalDeductions = payments.reduce((sum, p) => sum + p.totalDeductions, 0);
    const totalNetPay = payments.reduce((sum, p) => sum + p.netPay, 0);

    const pending = payments.filter(p => p.status === 'pending').length;
    const approved = payments.filter(p => p.status === 'approved').length;
    const paid = payments.filter(p => p.status === 'paid').length;

    // By payment method
    const byPaymentMethod: Record<string, { count: number; amount: number }> = {};
    payments.forEach(p => {
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
  async getStaffPaymentHistory(staffId: string, limit?: number): Promise<SalaryPayment[]> {
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
  async calculateYTDEarnings(staffId: string, year: string): Promise<{
    totalGross: number;
    totalDeductions: number;
    totalNetPay: number;
    monthsPaid: number;
  }> {
    const payments = await this.getByStaffId(staffId);
    const yearPayments = payments.filter(p => p.year === year && p.status === 'paid');

    return {
      totalGross: yearPayments.reduce((sum, p) => sum + p.totalGross, 0),
      totalDeductions: yearPayments.reduce((sum, p) => sum + p.totalDeductions, 0),
      totalNetPay: yearPayments.reduce((sum, p) => sum + p.netPay, 0),
      monthsPaid: yearPayments.length,
    };
  }

  /**
   * Get salary payments by date range
   */
  async getSalaryPaymentsByDateRange(startDate: string, endDate: string): Promise<SalaryPayment[]> {
    const payments = await this.list();
    return payments.filter(p => {
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
      throw new Error('Salary payment not found');
    }

    const payslipNumber = `PS-${payment.reference.replace('SAL-', '')}`;
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
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
    return this.salaryPaymentService.getSalaryPaymentsByDateRange(startDate, endDate);
  }
}

export const combinedStaffService = new CombinedStaffService();
