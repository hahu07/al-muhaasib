import { BaseDataService, COLLECTIONS } from './dataService';
import type { Payment, PaymentAllocation } from '@/types';
import { nanoid } from 'nanoid';

export class EnhancedPaymentService extends BaseDataService<Payment> {
  constructor() {
    super(COLLECTIONS.PAYMENTS);
  }

  /**
   * Record a new payment with allocations
   */
  async recordPayment(data: {
    studentId: string;
    studentName: string;
    classId: string;
    className: string;
    feeAssignmentId: string;
    amount: number;
    paymentMethod: Payment['paymentMethod'];
    paymentDate: string;
    feeAllocations: PaymentAllocation[];
    paidBy?: string;
    notes?: string;
    recordedBy: string;
  }): Promise<Payment> {
    // Generate reference number
    const reference = `PAY-${new Date().getFullYear()}-${nanoid(8).toUpperCase()}`;

    // Validate allocations sum matches amount
    const allocationsSum = data.feeAllocations.reduce((sum, a) => sum + a.amount, 0);
    if (Math.abs(allocationsSum - data.amount) > 0.01) {
      throw new Error('Payment allocations do not match payment amount');
    }

    return this.create({
      ...data,
      reference,
      status: 'confirmed',
    });
  }

  /**
   * Get payments by student
   */
  async getByStudentId(studentId: string): Promise<Payment[]> {
    const payments = await this.list();
    return payments.filter(p => p.studentId === studentId);
  }

  /**
   * Get payments by date range
   */
  async getByDateRange(startDate: string, endDate: string): Promise<Payment[]> {
    const payments = await this.list();
    return payments.filter(p => {
      const paymentDate = p.paymentDate;
      return paymentDate >= startDate && paymentDate <= endDate;
    });
  }

  /**
   * Get payments by method
   */
  async getByPaymentMethod(method: Payment['paymentMethod']): Promise<Payment[]> {
    const payments = await this.list();
    return payments.filter(p => p.paymentMethod === method);
  }

  /**
   * Get payments by status
   */
  async getByStatus(status: Payment['status']): Promise<Payment[]> {
    const payments = await this.list();
    return payments.filter(p => p.status === status);
  }

  /**
   * Cancel a payment
   */
  async cancelPayment(paymentId: string, reason: string): Promise<Payment> {
    return this.update(paymentId, {
      status: 'cancelled',
      notes: `Cancelled: ${reason}`,
    });
  }

  /**
   * Get payment analytics for a period
   */
  async getPaymentAnalytics(startDate: string, endDate: string): Promise<{
    totalAmount: number;
    totalPayments: number;
    byMethod: Record<string, { count: number; amount: number }>;
    byFeeType: Record<string, { count: number; amount: number }>;
    averagePayment: number;
    dailyTrend: { date: string; amount: number; count: number }[];
  }> {
    const payments = await this.getByDateRange(startDate, endDate);
    const confirmed = payments.filter(p => p.status === 'confirmed');

    const totalAmount = confirmed.reduce((sum, p) => sum + p.amount, 0);
    const totalPayments = confirmed.length;

    // By payment method
    const byMethod: Record<string, { count: number; amount: number }> = {};
    confirmed.forEach(p => {
      if (!byMethod[p.paymentMethod]) {
        byMethod[p.paymentMethod] = { count: 0, amount: 0 };
      }
      byMethod[p.paymentMethod].count++;
      byMethod[p.paymentMethod].amount += p.amount;
    });

    // By fee type
    const byFeeType: Record<string, { count: number; amount: number }> = {};
    confirmed.forEach(p => {
      p.feeAllocations.forEach(allocation => {
        if (!byFeeType[allocation.type]) {
          byFeeType[allocation.type] = { count: 0, amount: 0 };
        }
        byFeeType[allocation.type].count++;
        byFeeType[allocation.type].amount += allocation.amount;
      });
    });

    // Daily trend
    const dailyMap = new Map<string, { amount: number; count: number }>();
    confirmed.forEach(p => {
      const date = p.paymentDate.split('T')[0];
      const existing = dailyMap.get(date) || { amount: 0, count: 0 };
      dailyMap.set(date, {
        amount: existing.amount + p.amount,
        count: existing.count + 1,
      });
    });

    const dailyTrend = Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalAmount,
      totalPayments,
      byMethod,
      byFeeType,
      averagePayment: totalPayments > 0 ? totalAmount / totalPayments : 0,
      dailyTrend,
    };
  }

  /**
   * Get revenue summary
   */
  async getRevenueSummary(startDate?: string, endDate?: string) {
    let payments: Payment[];
    if (startDate && endDate) {
      payments = await this.getByDateRange(startDate, endDate);
    } else {
      payments = await this.list();
    }

    const confirmed = payments.filter(p => p.status === 'confirmed');
    const totalCollected = confirmed.reduce((sum, p) => sum + p.amount, 0);

    // Generate monthly trend
    const monthlyMap = new Map<string, number>();
    confirmed.forEach(p => {
      const date = new Date(p.paymentDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + p.amount);
    });

    const monthlyTrend = Array.from(monthlyMap.entries())
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6); // Last 6 months

    return {
      totalCollected,
      totalPending: 0, // Will be calculated from fee assignments
      totalOverdue: 0, // Will be calculated from fee assignments
      monthlyTrend,
    };
  }

  /**
   * Get payments by date range (alias for getByDateRange for reports service)
   */
  async getPaymentsByDateRange(startDate: string, endDate: string): Promise<Payment[]> {
    return this.getByDateRange(startDate, endDate);
  }

  /**
   * Generate receipt data
   */
  async generateReceipt(paymentId: string): Promise<{
    payment: Payment;
    receiptNumber: string;
    formattedDate: string;
  }> {
    const payment = await this.getById(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    const receiptNumber = `RCP-${payment.reference.replace('PAY-', '')}`
    const formattedDate = new Date(payment.paymentDate).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return {
      payment,
      receiptNumber,
      formattedDate,
    };
  }
}

// Export singleton instance
export const enhancedPaymentService = new EnhancedPaymentService();

// Alias for backward compatibility
export const paymentService = enhancedPaymentService;
