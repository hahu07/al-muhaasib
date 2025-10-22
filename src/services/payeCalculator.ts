/**
 * Nigerian PAYE (Pay As You Earn) Tax Calculator
 * Based on Nigerian Personal Income Tax Act (PITA) as amended
 *
 * Tax Rates (2024):
 * - First ₦300,000: 7%
 * - Next ₦300,000: 11%
 * - Next ₦500,000: 15%
 * - Next ₦500,000: 19%
 * - Next ₦1,600,000: 21%
 * - Above ₦3,200,000: 24%
 *
 * Relief Allowances:
 * - Consolidated Relief Allowance (CRA): Higher of ₦200,000 or 1% of gross income + 20% of gross income
 */

export interface PAYEBreakdown {
  grossIncome: number;
  consolidatedReliefAllowance: number;
  taxableIncome: number;
  taxBrackets: {
    bracket: string;
    income: number;
    rate: number;
    tax: number;
  }[];
  totalTax: number;
  netIncome: number;
  monthlyTax: number;
}

export class PAYECalculator {
  // Tax brackets (annual)
  private static readonly TAX_BRACKETS = [
    { min: 0, max: 300000, rate: 0.07, name: "First ₦300,000" },
    { min: 300000, max: 600000, rate: 0.11, name: "Next ₦300,000" },
    { min: 600000, max: 1100000, rate: 0.15, name: "Next ₦500,000" },
    { min: 1100000, max: 1600000, rate: 0.19, name: "Next ₦500,000" },
    { min: 1600000, max: 3200000, rate: 0.21, name: "Next ₦1,600,000" },
    { min: 3200000, max: Infinity, rate: 0.24, name: "Above ₦3,200,000" },
  ];

  // Minimum CRA
  private static readonly MIN_CRA = 200000;

  /**
   * Calculate Consolidated Relief Allowance (CRA)
   * CRA = Higher of ₦200,000 or (1% + 20%) of gross income
   */
  private static calculateCRA(grossAnnualIncome: number): number {
    const calculatedCRA = grossAnnualIncome * 0.21; // 1% + 20% = 21%
    return Math.max(this.MIN_CRA, calculatedCRA);
  }

  /**
   * Calculate PAYE tax based on taxable income
   */
  private static calculateTaxFromBrackets(taxableIncome: number): {
    brackets: PAYEBreakdown["taxBrackets"];
    totalTax: number;
  } {
    let remainingIncome = taxableIncome;
    let totalTax = 0;
    const brackets: PAYEBreakdown["taxBrackets"] = [];

    for (const bracket of this.TAX_BRACKETS) {
      if (remainingIncome <= 0) break;

      const bracketSize = bracket.max - bracket.min;
      const incomeInBracket = Math.min(remainingIncome, bracketSize);
      const taxInBracket = incomeInBracket * bracket.rate;

      if (incomeInBracket > 0) {
        brackets.push({
          bracket: bracket.name,
          income: incomeInBracket,
          rate: bracket.rate * 100,
          tax: taxInBracket,
        });

        totalTax += taxInBracket;
        remainingIncome -= incomeInBracket;
      }
    }

    return { brackets, totalTax };
  }

  /**
   * Calculate annual PAYE with full breakdown
   */
  static calculateAnnualPAYE(grossAnnualIncome: number): PAYEBreakdown {
    // Calculate CRA
    const cra = this.calculateCRA(grossAnnualIncome);

    // Calculate taxable income
    const taxableIncome = Math.max(0, grossAnnualIncome - cra);

    // Calculate tax from brackets
    const { brackets, totalTax } = this.calculateTaxFromBrackets(taxableIncome);

    // Calculate net income
    const netIncome = grossAnnualIncome - totalTax;

    // Calculate monthly tax
    const monthlyTax = totalTax / 12;

    return {
      grossIncome: grossAnnualIncome,
      consolidatedReliefAllowance: cra,
      taxableIncome,
      taxBrackets: brackets,
      totalTax,
      netIncome,
      monthlyTax,
    };
  }

  /**
   * Calculate monthly PAYE (simplified)
   * Converts monthly salary to annual, calculates tax, then returns monthly portion
   */
  static calculateMonthlyPAYE(monthlyGrossSalary: number): number {
    const annualGross = monthlyGrossSalary * 12;
    const annualBreakdown = this.calculateAnnualPAYE(annualGross);
    return Math.round(annualBreakdown.monthlyTax);
  }

  /**
   * Calculate PAYE with detailed breakdown for display
   */
  static getDetailedBreakdown(monthlyGrossSalary: number): {
    monthly: {
      grossSalary: number;
      paye: number;
      netSalary: number;
    };
    annual: PAYEBreakdown;
  } {
    const annualGross = monthlyGrossSalary * 12;
    const annualBreakdown = this.calculateAnnualPAYE(annualGross);
    const monthlyPAYE = Math.round(annualBreakdown.monthlyTax);

    return {
      monthly: {
        grossSalary: monthlyGrossSalary,
        paye: monthlyPAYE,
        netSalary: monthlyGrossSalary - monthlyPAYE,
      },
      annual: annualBreakdown,
    };
  }

  /**
   * Calculate PAYE for a specific gross amount (handles both monthly and annual)
   * @param grossAmount - The gross amount
   * @param isAnnual - Whether the amount is annual (default: false, assumes monthly)
   */
  static calculatePAYE(grossAmount: number, isAnnual: boolean = false): number {
    if (isAnnual) {
      const breakdown = this.calculateAnnualPAYE(grossAmount);
      return Math.round(breakdown.totalTax);
    } else {
      return this.calculateMonthlyPAYE(grossAmount);
    }
  }

  /**
   * Validate and format PAYE amount
   */
  static formatPAYE(amount: number): string {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  /**
   * Get tax bracket description for a given income
   */
  static getTaxBracket(annualIncome: number): string {
    for (const bracket of this.TAX_BRACKETS) {
      if (annualIncome <= bracket.max) {
        return `${bracket.name} - ${bracket.rate * 100}% tax rate`;
      }
    }
    return "24% tax rate (highest bracket)";
  }

  /**
   * Calculate effective tax rate
   */
  static getEffectiveTaxRate(grossIncome: number): number {
    const breakdown = this.calculateAnnualPAYE(grossIncome * 12);
    if (breakdown.grossIncome === 0) return 0;
    return (breakdown.totalTax / breakdown.grossIncome) * 100;
  }
}

export default PAYECalculator;
