import { PAYECalculator } from "./payeCalculator";

/**
 * Nigerian Statutory Deductions Calculator
 * Calculates mandatory deductions for payroll:
 * 1. NHF (National Housing Fund)
 * 2. Pension (Employee contribution)
 * 3. NHIS (National Health Insurance Scheme)
 * 4. PAYE (Pay As You Earn) Tax
 *
 * Based on Nigerian labor laws and regulations
 */

export interface StatutoryDeductions {
  nhf: number; // National Housing Fund
  pensionEmployee: number; // Employee's pension contribution (8%)
  pensionEmployer: number; // Employer's pension contribution (10%)
  nhis: number; // National Health Insurance Scheme
  paye: number; // PAYE (Pay As You Earn) Tax
  totalEmployeeDeductions: number; // Total deducted from employee (includes PAYE)
  totalEmployerContributions: number; // Total paid by employer (not deducted from salary)
}

export interface DeductionsBreakdown {
  grossSalary: number;
  nhf: {
    rate: number;
    amount: number;
    description: string;
  };
  pension: {
    employeeRate: number;
    employeeAmount: number;
    employerRate: number;
    employerAmount: number;
    totalContribution: number;
    description: string;
  };
  nhis: {
    rate: number;
    amount: number;
    description: string;
  };
  paye: {
    amount: number;
    description: string;
  };
  totalEmployeeDeductions: number;
  totalEmployerContributions: number;
  netSalaryAfterDeductions: number;
}

export class StatutoryDeductionsCalculator {
  // Statutory rates
  private static readonly NHF_RATE = 0.025; // 2.5% of basic salary
  private static readonly PENSION_EMPLOYEE_RATE = 0.08; // 8% employee contribution
  private static readonly PENSION_EMPLOYER_RATE = 0.10; // 10% employer contribution
  private static readonly NHIS_RATE = 0.05; // 5% of basic salary (capped)
  private static readonly NHIS_CAP = 20000; // Maximum NHIS contribution per month

  /**
   * Calculate NHF (National Housing Fund)
   * 2.5% of basic salary for employees earning above minimum wage
   */
  static calculateNHF(basicSalary: number): number {
    // NHF applies to employees earning ₦30,000 or more per month
    if (basicSalary < 30000) {
      return 0;
    }
    return Math.round(basicSalary * this.NHF_RATE);
  }

  /**
   * Calculate Pension contributions
   * Employee: 8% of monthly emoluments
   * Employer: 10% of monthly emoluments
   */
  static calculatePension(monthlyEmoluments: number): {
    employee: number;
    employer: number;
    total: number;
  } {
    const employeeContribution = Math.round(
      monthlyEmoluments * this.PENSION_EMPLOYEE_RATE,
    );
    const employerContribution = Math.round(
      monthlyEmoluments * this.PENSION_EMPLOYER_RATE,
    );

    return {
      employee: employeeContribution,
      employer: employerContribution,
      total: employeeContribution + employerContribution,
    };
  }

  /**
   * Calculate NHIS (National Health Insurance Scheme)
   * 5% of basic salary (capped at ₦20,000 per month)
   */
  static calculateNHIS(basicSalary: number): number {
    const calculated = Math.round(basicSalary * this.NHIS_RATE);
    return Math.min(calculated, this.NHIS_CAP);
  }

  /**
   * Calculate all statutory deductions including PAYE
   * @param basicSalary - The basic salary component
   * @param allowances - Total allowances (used for pension calculation)
   */
  static calculateAll(
    basicSalary: number,
    allowances: number = 0,
  ): StatutoryDeductions {
    // Monthly emoluments = Basic salary + allowances
    const monthlyEmoluments = basicSalary + allowances;

    const nhf = this.calculateNHF(basicSalary);
    const pension = this.calculatePension(monthlyEmoluments);
    const nhis = this.calculateNHIS(basicSalary);
    
    // Calculate PAYE on gross salary (before other deductions)
    const paye = PAYECalculator.calculateMonthlyPAYE(monthlyEmoluments);

    return {
      nhf,
      pensionEmployee: pension.employee,
      pensionEmployer: pension.employer,
      nhis,
      paye,
      totalEmployeeDeductions: nhf + pension.employee + nhis + paye,
      totalEmployerContributions: pension.employer,
    };
  }

  /**
   * Get detailed breakdown with descriptions including PAYE
   */
  static getDetailedBreakdown(
    basicSalary: number,
    allowances: number = 0,
  ): DeductionsBreakdown {
    const monthlyEmoluments = basicSalary + allowances;
    const grossSalary = monthlyEmoluments;

    const nhfAmount = this.calculateNHF(basicSalary);
    const pension = this.calculatePension(monthlyEmoluments);
    const nhisAmount = this.calculateNHIS(basicSalary);
    const payeAmount = PAYECalculator.calculateMonthlyPAYE(monthlyEmoluments);

    const totalEmployeeDeductions =
      nhfAmount + pension.employee + nhisAmount + payeAmount;
    const totalEmployerContributions = pension.employer;

    return {
      grossSalary,
      nhf: {
        rate: this.NHF_RATE * 100,
        amount: nhfAmount,
        description: `National Housing Fund (2.5% of basic salary)`,
      },
      pension: {
        employeeRate: this.PENSION_EMPLOYEE_RATE * 100,
        employeeAmount: pension.employee,
        employerRate: this.PENSION_EMPLOYER_RATE * 100,
        employerAmount: pension.employer,
        totalContribution: pension.total,
        description: `Pension (Employee: 8%, Employer: 10% of gross)`,
      },
      nhis: {
        rate: this.NHIS_RATE * 100,
        amount: nhisAmount,
        description: `National Health Insurance Scheme (5% of basic, max ₦20,000)`,
      },
      paye: {
        amount: payeAmount,
        description: `PAYE Tax (calculated on annual gross income)`,
      },
      totalEmployeeDeductions,
      totalEmployerContributions,
      netSalaryAfterDeductions: grossSalary - totalEmployeeDeductions,
    };
  }

  /**
   * Format currency for display
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  /**
   * Check if employee is eligible for NHF
   */
  static isEligibleForNHF(basicSalary: number): boolean {
    return basicSalary >= 30000;
  }

  /**
   * Get summary description of all deductions
   */
  static getSummaryDescription(): string {
    return `Statutory deductions include:
- NHF: 2.5% of basic salary (for salaries ≥ ₦30,000)
- Pension: Employee 8% + Employer 10% of gross salary
- NHIS: 5% of basic salary (capped at ₦20,000/month)
- PAYE: Progressive tax on annual income (7%-24%)`;
  }
}

export default StatutoryDeductionsCalculator;
