import { 
  setDoc, 
  getDoc, 
  listDocs, 
  countDocs, 
  deleteDoc
} from '@junobuild/core';
import { nanoid } from 'nanoid';
import type { FinancialDashboardData } from '@/hooks/useFinancialDashboard';
import type { StudentProfile } from '@/types';

// Collection names - comprehensive school accounting system
export const COLLECTIONS = {
  // School Structure
  CLASSES: 'classes',
  STUDENTS: 'students',
  
  // Revenue Management
  FEE_CATEGORIES: 'fee_categories',
  FEE_STRUCTURES: 'fee_structures',
  STUDENT_FEE_ASSIGNMENTS: 'student_fee_assignments',
  PAYMENTS: 'payments',
  
  // Expense Management
  EXPENSE_CATEGORIES: 'expense_categories',
  EXPENSES: 'expenses',
  BUDGETS: 'budgets',
  
  // Staff & Salaries
  STAFF_MEMBERS: 'staff_members',
  SALARY_PAYMENTS: 'salary_payments',
  
  // Capital Expenditure & Assets
  FIXED_ASSETS: 'fixed_assets',
  CAPITAL_EXPENDITURES: 'capital_expenditures',
  DEPRECIATION_ENTRIES: 'depreciation_entries',
  ASSET_MAINTENANCE: 'asset_maintenance',
  ASSET_DISPOSALS: 'asset_disposals',
  ASSET_VALUATIONS: 'asset_valuations',
  
  // Accounting & Double-Entry
  CHART_OF_ACCOUNTS: 'chart_of_accounts',
  JOURNAL_ENTRIES: 'journal_entries',
  BANK_ACCOUNTS: 'bank_accounts',
  
  // Users
  USERS: 'users',
  
  // Reporting
  FINANCIAL_REPORTS: 'financial_reports',
} as const;

// Simple error classes
export class DataServiceError extends Error {
  constructor(message: string, public code: string = 'DATA_ERROR') {
    super(message);
    this.name = 'DataServiceError';
  }
}

// Simple cache implementation optimized for mobile
class SimpleCache {
  private cache = new Map<string, { data: unknown; timestamp: number }>();
  private readonly TTL = 3 * 60 * 1000; // 3 minutes for mobile (shorter cache for fresher data)
  private readonly MAX_ENTRIES = 50; // Limit cache size for mobile memory management

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T): void {
    // Remove oldest entry if cache is full
    if (this.cache.size >= this.MAX_ENTRIES) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, { data, timestamp: Date.now() });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

// Base data service
export class BaseDataService<T extends Record<string, unknown>> {
  protected collection: string;
  protected cache = new SimpleCache();

  constructor(collection: string) {
    this.collection = collection;
  }

  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    try {
      const id = nanoid();
      const now = new Date();
      const doc = {
        id,
        ...data,
        createdAt: now,
        updatedAt: now,
      } as unknown as T;

      await setDoc({
        collection: this.collection,
        doc: {
          key: id,
          data: doc,
        },
      });

      // Clear cache
      this.cache.clear();
      
      return doc;
    } catch (error) {
      console.error(`Error creating ${this.collection}:`, error);
      throw new DataServiceError(`Failed to create ${this.collection}`);
    }
  }

  async getById(id: string): Promise<T | null> {
    try {
      const cacheKey = `${this.collection}:${id}`;
      const cached = this.cache.get<T>(cacheKey);
      if (cached) return cached;

      const doc = await getDoc({
        collection: this.collection,
        key: id,
      });

      if (!doc) return null;

      const data = doc.data as T;
      this.cache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error(`Error getting ${this.collection} by ID:`, error);
      throw new DataServiceError(`Failed to get ${this.collection}`);
    }
  }

  async list(filter?: Record<string, unknown>): Promise<T[]> {
    try {
      const cacheKey = `${this.collection}:list:${JSON.stringify(filter || {})}`;
      const cached = this.cache.get<T[]>(cacheKey);
      if (cached) return cached;

      const { items } = await listDocs({
        collection: this.collection,
        filter,
      });

      const data = items.map(item => item.data as T);
      this.cache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error(`Error listing ${this.collection}:`, error);
      throw new DataServiceError(`Failed to list ${this.collection}`);
    }
  }

  async count(filter?: Record<string, unknown>): Promise<number> {
    try {
      const result = await countDocs({
        collection: this.collection,
        filter,
      });
      return Number(result);
    } catch (error) {
      console.error(`Error counting ${this.collection}:`, error);
      throw new DataServiceError(`Failed to count ${this.collection}`);
    }
  }

  async update(id: string, data: Partial<Omit<T, 'id' | 'createdAt'>>): Promise<T> {
    try {
      // First get the full document to get the current version
      const docResult = await getDoc({
        collection: this.collection,
        key: id,
      });
      
      if (!docResult) {
        throw new DataServiceError(`${this.collection} not found`);
      }
      
      const existing = docResult.data as T;
      const updated = {
        ...existing,
        ...data,
        updatedAt: new Date(),
      } as T;

      await setDoc({
        collection: this.collection,
        doc: {
          key: id,
          data: updated,
          version: docResult.version // Include version for optimistic locking
        },
      });

      // Clear cache
      this.cache.clear();
      
      return updated;
    } catch (error) {
      console.error(`Error updating ${this.collection}:`, error);
      throw new DataServiceError(`Failed to update ${this.collection}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      // First get the full document (required for deletion)
      const docResult = await getDoc({
        collection: this.collection,
        key: id,
      });
      
      if (!docResult) {
        throw new DataServiceError(`${this.collection} not found`);
      }
      
      await deleteDoc({
        collection: this.collection,
        doc: docResult // Pass the full document with version
      });

      // Clear cache
      this.cache.clear();
    } catch (error) {
      console.error(`Error deleting ${this.collection}:`, error);
      throw new DataServiceError(`Failed to delete ${this.collection}`);
    }
  }
}

// Specialized services for accounting
export class StudentService extends BaseDataService<StudentProfile> {
  constructor() {
    super(COLLECTIONS.STUDENTS);
  }

  async getStudentsByPaymentStatus(status: 'paid' | 'partial' | 'pending' | 'overdue'): Promise<StudentProfile[]> {
    const students = await this.list();
    return students.filter(student => {
      const balance = student.balance;
      const totalPaid = student.totalPaid;

      switch (status) {
        case 'paid':
          return balance === 0;
        case 'partial':
          return balance > 0 && totalPaid > 0;
        case 'pending':
          return balance > 0 && totalPaid === 0;
        case 'overdue':
          // Consider overdue if balance > 0 and admission date is more than 60 days ago
          const admissionDate = new Date(student.admissionDate);
          const daysDiff = (Date.now() - admissionDate.getTime()) / (1000 * 60 * 60 * 24);
          return balance > 0 && daysDiff > 60;
        default:
          return false;
      }
    });
  }

  async getPaymentSummary(): Promise<{
    totalStudents: number;
    paidStudents: number;
    partialPaidStudents: number;
    unpaidStudents: number;
    overdueStudents: number;
  }> {
    const [paid, partial, unpaid, overdue, total] = await Promise.all([
      this.getStudentsByPaymentStatus('paid'),
      this.getStudentsByPaymentStatus('partial'),
      this.getStudentsByPaymentStatus('pending'),
      this.getStudentsByPaymentStatus('overdue'),
      this.list(),
    ]);

    return {
      totalStudents: total.length,
      paidStudents: paid.length,
      partialPaidStudents: partial.length,
      unpaidStudents: unpaid.length,
      overdueStudents: overdue.length,
    };
  }
}

// Note: PaymentService has been moved to paymentService.ts

// Main financial dashboard data aggregation
export async function getFinancialDashboard(
  startDate?: Date,
  endDate?: Date
): Promise<FinancialDashboardData> {
  try {
    // Import dynamically to avoid circular dependency
    const { enhancedPaymentService } = await import('./paymentService');
    
    const [
      studentSummary,
      revenueSummary,
    ] = await Promise.all([
      new StudentService().getPaymentSummary(),
      enhancedPaymentService.getRevenueSummary(startDate ? startDate.toISOString() : undefined, endDate ? endDate.toISOString() : undefined),
    ]);

    // For now, we'll use mock data for expenses and other sections until those collections are populated
    // This allows the dashboard to work immediately while data is being entered
    const totalExpenses = revenueSummary.totalCollected * 0.4;
    const netProfit = revenueSummary.totalCollected - totalExpenses;

    return {
      revenue: revenueSummary,
      students: studentSummary,
      expenses: {
        totalExpenses: Math.round(totalExpenses),
        byCategory: {
          'Salaries & Benefits': { amount: totalExpenses * 0.50, count: 25 },
          'Utilities': { amount: totalExpenses * 0.15, count: 8 },
          'Maintenance': { amount: totalExpenses * 0.12, count: 15 },
          'Supplies': { amount: totalExpenses * 0.10, count: 32 },
          'Insurance': { amount: totalExpenses * 0.08, count: 4 },
          'Other': { amount: totalExpenses * 0.05, count: 12 },
        },
        pendingApprovals: 3,
        recurringExpenses: Math.round(totalExpenses * 0.7),
      },
      accounts: {
        totalBalance: Math.round(revenueSummary.totalCollected - totalExpenses + 150000),
        byType: {
          'Operating Account': Math.round((revenueSummary.totalCollected - totalExpenses) * 0.60),
          'Savings Account': Math.round((revenueSummary.totalCollected - totalExpenses) * 0.25),
          'Emergency Fund': Math.round((revenueSummary.totalCollected - totalExpenses) * 0.15),
        },
        byCurrency: {
          'NGN': Math.round(revenueSummary.totalCollected - totalExpenses + 150000),
        },
      },
      profitLoss: {
        totalRevenue: Math.round(revenueSummary.totalCollected),
        totalExpenses: Math.round(totalExpenses),
        netProfit: Math.round(netProfit),
        profitMargin: revenueSummary.totalCollected > 0 ? Math.round((netProfit / revenueSummary.totalCollected) * 100) : 0,
      },
      scholarships: {
        totalScholarships: 25,
        totalBudget: 500000,
        usedBudget: 320000,
        beneficiaries: 25,
      },
      alerts: {
        overdueInvoices: studentSummary.overdueStudents,
        lowBalanceAccounts: 0,
        pendingExpenses: 3,
        scholarshipBudgetAlerts: 0,
      },
    };
  } catch (error) {
    console.error('Error fetching financial dashboard:', error);
    throw new DataServiceError('Failed to fetch financial dashboard data');
  }
}

// Export service instances
export const studentService = new StudentService();
// Note: paymentService is now exported from paymentService.ts
