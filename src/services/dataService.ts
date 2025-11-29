import {
  setDoc,
  getDoc,
  listDocs,
  countDocs,
  deleteDoc,
} from "@junobuild/core";
import { nanoid } from "nanoid";
import type { FinancialDashboardData } from "@/hooks/useFinancialDashboard";
import type { StudentProfile } from "@/types";

// Collection names - comprehensive school accounting system
export const COLLECTIONS = {
  // School Structure
  CLASSES: "classes",
  STUDENTS: "students",

  // Revenue Management
  FEE_CATEGORIES: "fee_categories",
  FEE_STRUCTURES: "fee_structures",
  STUDENT_FEE_ASSIGNMENTS: "student_fee_assignments",
  PAYMENTS: "payments",
  SCHOLARSHIPS: "scholarships",
  SCHOLARSHIP_APPLICATIONS: "scholarship_applications",

  // Expense Management
  EXPENSE_CATEGORIES: "expense_categories",
  EXPENSES: "expenses",
  BUDGETS: "budgets",

  // Staff & Salaries
  STAFF_MEMBERS: "staff_members",
  SALARY_PAYMENTS: "salary_payments",
  STAFF_LOANS: "staff_loans",
  LOAN_REPAYMENTS: "loan_repayments",
  STAFF_BONUSES: "staff_bonuses",
  STAFF_PENALTIES: "staff_penalties",

  // Capital Expenditure & Assets
  FIXED_ASSETS: "fixed_assets",
  CAPITAL_EXPENDITURES: "capital_expenditures",
  DEPRECIATION_ENTRIES: "depreciation_entries",
  ASSET_MAINTENANCE: "asset_maintenance",
  ASSET_DISPOSALS: "asset_disposals",
  ASSET_VALUATIONS: "asset_valuations",

  // Accounting & Double-Entry
  CHART_OF_ACCOUNTS: "chart_of_accounts",
  JOURNAL_ENTRIES: "journal_entries",
  BANK_ACCOUNTS: "bank_accounts",
  ACCOUNT_MAPPINGS: "account_mappings",

  // Banking Module (optional)
  BANK_TRANSACTIONS: "bank_transactions",
  BANK_STATEMENTS: "bank_statements",
  BANK_RECONCILIATIONS: "bank_reconciliations",
  INTER_ACCOUNT_TRANSFERS: "inter_account_transfers",
  CASH_FLOW_PROJECTIONS: "cash_flow_projections",

  // Users
  USERS: "users",

  // Reporting
  FINANCIAL_REPORTS: "financial_reports",
} as const;

// Simple error classes
export class DataServiceError extends Error {
  constructor(
    message: string,
    public code: string = "DATA_ERROR",
  ) {
    super(message);
    this.name = "DataServiceError";
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

  // Helper to convert bigint values to numbers for Juno Build serialization
  protected serializeBigInts(obj: unknown): unknown {
    if (obj === null || obj === undefined) return obj;

    if (typeof obj === "bigint") {
      return Number(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.serializeBigInts(item));
    }

    if (typeof obj === "object") {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.serializeBigInts(value);
      }
      return result;
    }

    return obj;
  }

  // Helper to convert numbers back to bigint for timestamp fields
  protected deserializeBigInts(obj: unknown): unknown {
    if (obj === null || obj === undefined) return obj;

    if (Array.isArray(obj)) {
      return obj.map((item) => this.deserializeBigInts(item));
    }

    if (typeof obj === "object") {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        // Convert known timestamp fields back to bigint
        if (
          (key === "createdAt" ||
            key === "updatedAt" ||
            key === "approvedAt" ||
            key === "lastLogin" ||
            key === "calculatedAt" ||
            key === "postedAt" ||
            key === "generatedAt" ||
            key === "uploadedAt") &&
          typeof value === "number"
        ) {
          result[key] = BigInt(value);
        } else {
          result[key] = this.deserializeBigInts(value);
        }
      }
      return result;
    }

    return obj;
  }

  async create(data: Omit<T, "id" | "createdAt" | "updatedAt">): Promise<T> {
    try {
      const id = nanoid();
      // Convert to nanoseconds (Unix timestamp in nanoseconds for IC)
      const nowNanos = BigInt(Date.now()) * BigInt(1_000_000);
      
      // Check if timestamps are already provided (for special cases like expense approval)
      const hasCreatedAt = 'createdAt' in data && typeof (data as Record<string, unknown>).createdAt === 'bigint';
      const hasUpdatedAt = 'updatedAt' in data && typeof (data as Record<string, unknown>).updatedAt === 'bigint';
      
      const doc = {
        id,
        ...data,
        createdAt: hasCreatedAt ? (data as Record<string, unknown>).createdAt : nowNanos,
        updatedAt: hasUpdatedAt ? (data as Record<string, unknown>).updatedAt : nowNanos,
      } as unknown as T;

      // Convert bigint to number for serialization (Juno Build expects numbers)
      const serializedDoc = this.serializeBigInts(doc);

      await setDoc({
        collection: this.collection,
        doc: {
          key: id,
          data: serializedDoc as Record<string, unknown>,
        },
      });

      // Clear cache
      this.cache.clear();

      return doc;
    } catch (error) {
      console.error(`Error creating ${this.collection}:`, error);
      const msg = error instanceof Error ? error.message : String(error);
      throw new DataServiceError(`Failed to create ${this.collection}: ${msg}`);
    }
  }

  /**
   * Create a document with a specific ID (for cases like expense approval where we want to preserve the ID)
   */
  async createWithId(id: string, data: Omit<T, "id" | "createdAt" | "updatedAt">): Promise<T> {
    try {
      // Convert to nanoseconds (Unix timestamp in nanoseconds for IC)
      const nowNanos = BigInt(Date.now()) * BigInt(1_000_000);
      
      // Check if timestamps are already provided (for special cases like expense approval)
      const hasCreatedAt = 'createdAt' in data && typeof (data as Record<string, unknown>).createdAt === 'bigint';
      const hasUpdatedAt = 'updatedAt' in data && typeof (data as Record<string, unknown>).updatedAt === 'bigint';
      
      const doc = {
        id,
        ...data,
        createdAt: hasCreatedAt ? (data as Record<string, unknown>).createdAt : nowNanos,
        updatedAt: hasUpdatedAt ? (data as Record<string, unknown>).updatedAt : nowNanos,
      } as unknown as T;

      // Convert bigint to number for serialization (Juno Build expects numbers)
      const serializedDoc = this.serializeBigInts(doc);

      await setDoc({
        collection: this.collection,
        doc: {
          key: id,
          data: serializedDoc as Record<string, unknown>,
        },
      });

      // Clear cache
      this.cache.clear();

      return doc;
    } catch (error) {
      console.error(`Error creating ${this.collection} with ID ${id}:`, error);
      const msg = error instanceof Error ? error.message : String(error);
      throw new DataServiceError(`Failed to create ${this.collection}: ${msg}`);
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

      const data = this.deserializeBigInts(doc.data) as T;
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

      const data = items.map((item) => {
        const deserializedData = this.deserializeBigInts(item.data) as T;
        // Ensure the document has an id field from the Juno key
        return {
          ...deserializedData,
          id: item.key,
        };
      });
      this.cache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error(`Error listing ${this.collection}:`, error);
      throw new DataServiceError(`Failed to list ${this.collection}`);
    }
  }

  /**
   * List documents with full metadata (including version)
   * Useful when you need the version for updates
   */
  protected async listDocsRaw(filter?: Record<string, unknown>) {
    const { items } = await listDocs({
      collection: this.collection,
      filter,
    });
    return items;
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
      const msg = error instanceof Error ? error.message : String(error);
      throw new DataServiceError(`Failed to count ${this.collection}: ${msg}`);
    }
  }

  async update(
    id: string,
    data: Partial<Omit<T, "id" | "createdAt">>,
  ): Promise<T> {
    try {
      // First get the full document to get the current version
      const docResult = await getDoc({
        collection: this.collection,
        key: id,
      });

      if (!docResult) {
        throw new DataServiceError(`${this.collection} not found`);
      }

      // Deserialize the existing data to convert numbers back to bigint for timestamps
      const existing = this.deserializeBigInts(docResult.data) as T;
      // Convert to nanoseconds (Unix timestamp in nanoseconds for IC)
      const nowNanos = BigInt(Date.now()) * BigInt(1_000_000);
      const updated = {
        ...existing,
        ...data,
        updatedAt: nowNanos,
      } as T;

      // Convert bigint to number for serialization (Juno Build expects numbers)
      const serializedDoc = this.serializeBigInts(updated);

      await setDoc({
        collection: this.collection,
        doc: {
          key: id,
          data: serializedDoc as Record<string, unknown>,
          version: docResult.version, // Include version for optimistic locking
        },
      });

      // Clear cache
      this.cache.clear();

      return updated;
    } catch (error) {
      console.error(`Error updating ${this.collection}:`, error);
      const msg = error instanceof Error ? error.message : String(error);
      throw new DataServiceError(`Failed to update ${this.collection}: ${msg}`);
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
        doc: docResult, // Pass the full document with version
      });

      // Clear cache
      this.cache.clear();
    } catch (error) {
      console.error(`Error deleting ${this.collection}:`, error);
      const msg = error instanceof Error ? error.message : String(error);
      throw new DataServiceError(`Failed to delete ${this.collection}: ${msg}`);
    }
  }
}

// Specialized services for accounting
export class StudentService extends BaseDataService<StudentProfile> {
  constructor() {
    super(COLLECTIONS.STUDENTS);
  }

  async getStudentsByPaymentStatus(
    status: "paid" | "partial" | "pending" | "overdue",
  ): Promise<StudentProfile[]> {
    const students = await this.list();
    return students.filter((student) => {
      const balance = student.balance;
      const totalPaid = student.totalPaid;
      const totalFees = student.totalFeesAssigned;

      switch (status) {
        case "paid":
          // Fully paid: has fees assigned, balance is 0, and has made payments
          return totalFees > 0 && balance === 0 && totalPaid > 0;
        case "partial":
          // Partial payment: has fees, has paid something, but still owes
          return balance > 0 && totalPaid > 0;
        case "pending":
          // No payment yet: has fees assigned but hasn't paid anything
          return totalFees > 0 && balance > 0 && totalPaid === 0;
        case "overdue":
          // Consider overdue if balance > 0 and admission date is more than 60 days ago
          const admissionDate = new Date(student.admissionDate);
          const daysDiff =
            (Date.now() - admissionDate.getTime()) / (1000 * 60 * 60 * 24);
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
      this.getStudentsByPaymentStatus("paid"),
      this.getStudentsByPaymentStatus("partial"),
      this.getStudentsByPaymentStatus("pending"),
      this.getStudentsByPaymentStatus("overdue"),
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
  endDate?: Date,
): Promise<FinancialDashboardData> {
  try {
    // Import dynamically to avoid circular dependency
    const { enhancedPaymentService } = await import("./paymentService");

    const [studentSummary, revenueSummary] = await Promise.all([
      new StudentService().getPaymentSummary(),
      enhancedPaymentService.getRevenueSummary(
        startDate ? startDate.toISOString() : undefined,
        endDate ? endDate.toISOString() : undefined,
      ),
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
          "Salaries & Benefits": { amount: totalExpenses * 0.5, count: 25 },
          Utilities: { amount: totalExpenses * 0.15, count: 8 },
          Maintenance: { amount: totalExpenses * 0.12, count: 15 },
          Supplies: { amount: totalExpenses * 0.1, count: 32 },
          Insurance: { amount: totalExpenses * 0.08, count: 4 },
          Other: { amount: totalExpenses * 0.05, count: 12 },
        },
        pendingApprovals: 3,
        recurringExpenses: Math.round(totalExpenses * 0.7),
      },
      accounts: {
        totalBalance: Math.round(
          revenueSummary.totalCollected - totalExpenses + 150000,
        ),
        byType: {
          "Operating Account": Math.round(
            (revenueSummary.totalCollected - totalExpenses) * 0.6,
          ),
          "Savings Account": Math.round(
            (revenueSummary.totalCollected - totalExpenses) * 0.25,
          ),
          "Emergency Fund": Math.round(
            (revenueSummary.totalCollected - totalExpenses) * 0.15,
          ),
        },
        byCurrency: {
          NGN: Math.round(
            revenueSummary.totalCollected - totalExpenses + 150000,
          ),
        },
      },
      profitLoss: {
        totalRevenue: Math.round(revenueSummary.totalCollected),
        totalExpenses: Math.round(totalExpenses),
        netProfit: Math.round(netProfit),
        profitMargin:
          revenueSummary.totalCollected > 0
            ? Math.round((netProfit / revenueSummary.totalCollected) * 100)
            : 0,
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
    console.error("Error fetching financial dashboard:", error);
    throw new DataServiceError("Failed to fetch financial dashboard data");
  }
}

// Export service instances
export const studentService = new StudentService();
// Note: paymentService is now exported from paymentService.ts
