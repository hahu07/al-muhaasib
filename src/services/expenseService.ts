import { BaseDataService, COLLECTIONS } from "./dataService";
import type { ExpenseCategoryDef, Expense, Budget, BudgetItem } from "@/types";
import { nanoid, customAlphabet } from "nanoid";
import { autoPostingService } from "./autoPostingService";
import { pendingExpenseStore } from "./pendingExpenseStore";
import { expenseFormSchema } from "@/validation";

// Alphanumeric (A-Z, 0-9) generator for 8-char suffixes
const nanoidAlphaNum = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  8,
);

function generateExpenseReference(): string {
  const year = new Date().getFullYear();
  const suffix = nanoidAlphaNum();
  return `EXP-${year}-${suffix}`;
}

function isValidExpenseReference(ref: string): boolean {
  if (ref.length !== 17) return false; // EXP-YYYY-XXXXXXXX
  const parts = ref.split("-");
  if (parts.length !== 3) return false;
  if (parts[0] !== "EXP") return false;
  if (!/^\d{4}$/.test(parts[1])) return false;
  if (!/^[A-Za-z0-9]{8}$/.test(parts[2])) return false;
  return true;
}

export class ExpenseCategoryService extends BaseDataService<ExpenseCategoryDef> {
  constructor() {
    super(COLLECTIONS.EXPENSE_CATEGORIES);
  }

  async getActiveCategories(): Promise<ExpenseCategoryDef[]> {
    const categories = await this.list();
    return categories.filter((c) => c.isActive);
  }

  async getByCategory(
    category: ExpenseCategoryDef["category"],
  ): Promise<ExpenseCategoryDef[]> {
    const categories = await this.list();
    return categories.filter((c) => c.category === category && c.isActive);
  }

  /**
   * Create a new expense category
   */
  async createCategory(data: {
    name: string;
    category: ExpenseCategoryDef["category"];
    description?: string;
    budgetCode?: string;
  }): Promise<ExpenseCategoryDef> {
    // Check if category with same name already exists
    const existing = await this.getCategoryByName(data.name);
    if (existing) {
      throw new Error(`Category with name "${data.name}" already exists`);
    }

    return this.create({
      ...data,
      isActive: true,
    });
  }

  /**
   * Get category by name
   */
  async getCategoryByName(name: string): Promise<ExpenseCategoryDef | null> {
    const categories = await this.list();
    return (
      categories.find((c) => c.name.toLowerCase() === name.toLowerCase()) ||
      null
    );
  }

  /**
   * Update category
   */
  async updateCategory(
    categoryId: string,
    updates: Partial<
      Pick<
        ExpenseCategoryDef,
        "name" | "description" | "budgetCode" | "isActive"
      >
    >,
  ): Promise<ExpenseCategoryDef> {
    // If name is being updated, check for duplicates
    if (updates.name) {
      const existing = await this.getCategoryByName(updates.name);
      if (existing && existing.id !== categoryId) {
        throw new Error(`Category with name "${updates.name}" already exists`);
      }
    }

    return this.update(categoryId, updates);
  }

  /**
   * Deactivate category (soft delete)
   */
  async deactivateCategory(categoryId: string): Promise<ExpenseCategoryDef> {
    return this.update(categoryId, { isActive: false });
  }

  /**
   * Activate category
   */
  async activateCategory(categoryId: string): Promise<ExpenseCategoryDef> {
    return this.update(categoryId, { isActive: true });
  }

  /**
   * Get predefined category options
   */
  getPredefinedCategories(): Array<{
    value: ExpenseCategoryDef["category"];
    label: string;
    group: string;
  }> {
    return [
      // Staff
      { value: "salaries", label: "Salaries", group: "Staff" },
      { value: "allowances", label: "Allowances", group: "Staff" },
      { value: "bonuses", label: "Bonuses", group: "Staff" },
      { value: "staff_training", label: "Staff Training", group: "Staff" },

      // Operations
      { value: "utilities", label: "Utilities", group: "Operations" },
      { value: "maintenance", label: "Maintenance", group: "Operations" },
      { value: "repairs", label: "Repairs", group: "Operations" },
      { value: "cleaning", label: "Cleaning", group: "Operations" },
      { value: "security", label: "Security", group: "Operations" },

      // Academic
      {
        value: "teaching_materials",
        label: "Teaching Materials",
        group: "Academic",
      },
      {
        value: "laboratory_supplies",
        label: "Laboratory Supplies",
        group: "Academic",
      },
      { value: "library_books", label: "Library Books", group: "Academic" },
      {
        value: "sports_equipment",
        label: "Sports Equipment",
        group: "Academic",
      },
      {
        value: "computer_equipment",
        label: "Computer Equipment",
        group: "Academic",
      },

      // Administrative
      { value: "stationery", label: "Stationery", group: "Administrative" },
      { value: "printing", label: "Printing", group: "Administrative" },
      {
        value: "communication",
        label: "Communication",
        group: "Administrative",
      },
      {
        value: "transportation",
        label: "Transportation",
        group: "Administrative",
      },
      { value: "insurance", label: "Insurance", group: "Administrative" },
      { value: "legal_fees", label: "Legal Fees", group: "Administrative" },
      { value: "bank_charges", label: "Bank Charges", group: "Administrative" },

      // Infrastructure
      {
        value: "building_development",
        label: "Building Development",
        group: "Infrastructure",
      },
      { value: "furniture", label: "Furniture", group: "Infrastructure" },
      {
        value: "equipment_purchase",
        label: "Equipment Purchase",
        group: "Infrastructure",
      },

      // Food & Catering
      {
        value: "food_supplies",
        label: "Food Supplies",
        group: "Food & Catering",
      },
      {
        value: "kitchen_equipment",
        label: "Kitchen Equipment",
        group: "Food & Catering",
      },

      // Other
      { value: "miscellaneous", label: "Miscellaneous", group: "Other" },
      { value: "donations", label: "Donations", group: "Other" },
      { value: "taxes", label: "Taxes", group: "Other" },
    ];
  }

  /**
   * Initialize default categories if they don't exist
   */
  async initializeDefaultCategories(): Promise<void> {
    const existingCategories = await this.list();
    const predefinedCategories = this.getPredefinedCategories();

    for (const category of predefinedCategories) {
      const exists = existingCategories.some(
        (c) => c.category === category.value,
      );
      if (!exists) {
        await this.create({
          name: category.label,
          category: category.value,
          description: `Default ${category.label} category`,
          isActive: true,
        });
      }
    }
  }
}

export class ExpenseService extends BaseDataService<Expense> {
  constructor() {
    super(COLLECTIONS.EXPENSES);
  }

  /**
   * Create a new expense (stored locally as pending)
   * POLICY: Expenses must be approved before being saved to Juno datastore
   */
  async createExpense(data: {
    categoryId: string;
    categoryName: string;
    category: Expense["category"];
    amount: number;
    description: string;
    purpose?: string;
    paymentMethod: Expense["paymentMethod"];
    paymentDate: string;
    vendorName?: string;
    vendorContact?: string;
    invoiceUrl?: string;
    notes?: string;
    recordedBy: string;
  }): Promise<Expense> {
    // Frontend validation (non-authoritative)
    const parse = expenseFormSchema.safeParse({
      categoryId: data.categoryId,
      amount: data.amount,
      description: data.description,
      purpose: data.purpose,
      paymentMethod: data.paymentMethod,
      paymentDate: data.paymentDate,
      vendorName: data.vendorName,
      vendorContact: data.vendorContact,
      notes: data.notes,
    });
    if (!parse.success) {
      const first = parse.error.issues[0];
      throw new Error(first?.message || "Invalid expense data");
    }
    const id = nanoid();
    const reference = generateExpenseReference();
    const nowNanos = BigInt(Date.now()) * BigInt(1_000_000);

    // Store locally as pending (NOT saved to Juno yet)
    const expense: Expense = {
      id,
      ...data,
      reference,
      status: "pending",
      createdAt: nowNanos,
      updatedAt: nowNanos,
    };

    await pendingExpenseStore.addPending(expense);
    return expense;
  }

  /**
   * Approve a pending expense and save to Juno datastore
   */
  async approveExpense(
    expenseId: string,
    approvedBy: string,
  ): Promise<Expense> {
    // Get from local storage
    const pendingExpense = await pendingExpenseStore.getById(expenseId);
    if (!pendingExpense) {
      throw new Error("Pending expense not found");
    }

    if (pendingExpense.status !== "pending") {
      throw new Error("Only pending expenses can be approved");
    }

    const nowNanos = BigInt(Date.now()) * BigInt(1_000_000);

    // Ensure approver differs from recorder in dev: if same, suffix the approver id
    const effectiveApprovedBy =
      pendingExpense.recordedBy === approvedBy
        ? `${approvedBy}#dev`
        : approvedBy;

    // Ensure reference format matches EXP-YYYY-XXXXXXXX
    const ensuredReference = isValidExpenseReference(pendingExpense.reference)
      ? pendingExpense.reference
      : generateExpenseReference();

    // Create in Juno with approved status
    const approvedExpense = await this.create({
      ...pendingExpense,
      reference: ensuredReference,
      status: "approved",
      approvedBy: effectiveApprovedBy,
      approvedAt: nowNanos,
    });

    // Auto-post journal entry for the approved expense
    try {
      await autoPostingService.postExpense(
        pendingExpense.amount,
        pendingExpense.categoryName,
        pendingExpense.paymentMethod,
        pendingExpense.vendorName || "Vendor",
        {
          description: `${pendingExpense.categoryName} - ${pendingExpense.description}`,
          reference: pendingExpense.reference,
          transactionDate: pendingExpense.paymentDate,
          createdBy: approvedBy,
          autoPost: true,
        },
      );
    } catch (error) {
      console.error("Failed to auto-post expense journal entry:", error);
      // Don't fail the approval if journal entry fails
    }

    // Remove from local storage after successful save
    await pendingExpenseStore.delete(expenseId);

    return approvedExpense;
  }

  /**
   * Reject a pending expense
   */
  async rejectExpense(
    expenseId: string,
    rejectedBy: string,
    reason: string,
  ): Promise<void> {
    const pendingExpense = await pendingExpenseStore.getById(expenseId);
    if (!pendingExpense) {
      throw new Error("Pending expense not found");
    }

    // Update status to rejected in local storage
    await pendingExpenseStore.update(expenseId, {
      status: "rejected",
      notes: `Rejected by ${rejectedBy}: ${reason}`,
    });

    // Optionally delete after some time or keep for audit
    // For now, we'll delete immediately
    await pendingExpenseStore.delete(expenseId);
  }

  /**
   * Get all pending expenses from local storage
   */
  async getPendingExpenses(): Promise<Expense[]> {
    return pendingExpenseStore.getByStatus("pending");
  }

  /**
   * Get combined list: approved from Juno + pending from local storage
   */
  async getAllExpenses(): Promise<Expense[]> {
    const [approvedExpenses, pendingExpenses] = await Promise.all([
      this.list(), // From Juno (approved/paid)
      pendingExpenseStore.getAllPending(), // From local storage
    ]);

    return [...pendingExpenses, ...approvedExpenses];
  }

  /**
   * Get expenses by status
   */
  async getByStatus(status: Expense["status"]): Promise<Expense[]> {
    const expenses = await this.list();
    return expenses.filter((e) => e.status === status);
  }

  /**
   * Get expenses by category
   */
  async getByCategory(category: Expense["category"]): Promise<Expense[]> {
    const expenses = await this.list();
    return expenses.filter((e) => e.category === category);
  }

  /**
   * Get expenses by date range
   */
  async getByDateRange(startDate: string, endDate: string): Promise<Expense[]> {
    const expenses = await this.list();
    return expenses.filter((e) => {
      const paymentDate = e.paymentDate;
      return paymentDate >= startDate && paymentDate <= endDate;
    });
  }

  /**
   * Get expenses by date range (alias for reports service)
   */
  async getExpensesByDateRange(
    startDate: string,
    endDate: string,
  ): Promise<Expense[]> {
    return this.getByDateRange(startDate, endDate);
  }

  /**
   * Mark expense as paid (for already-approved expenses in Juno)
   */
  async markAsPaid(expenseId: string): Promise<Expense> {
    return this.update(expenseId, {
      status: "paid",
    });
  }

  /**
   * Get expense summary
   */
  async getExpenseSummary(
    startDate?: string,
    endDate?: string,
  ): Promise<{
    totalExpenses: number;
    paidExpenses: number;
    pendingExpenses: number;
    byCategory: Record<string, { amount: number; count: number }>;
    byPaymentMethod: Record<string, { amount: number; count: number }>;
  }> {
    let expenses: Expense[];
    if (startDate && endDate) {
      expenses = await this.getByDateRange(startDate, endDate);
    } else {
      expenses = await this.list();
    }

    const paid = expenses.filter((e) => e.status === "paid");
    const pending = expenses.filter(
      (e) => e.status === "pending" || e.status === "approved",
    );

    const totalExpenses = paid.reduce((sum, e) => sum + e.amount, 0);
    const paidExpenses = paid.length;
    const pendingExpenses = pending.length;

    // By category
    const byCategory: Record<string, { amount: number; count: number }> = {};
    paid.forEach((e) => {
      if (!byCategory[e.category]) {
        byCategory[e.category] = { amount: 0, count: 0 };
      }
      byCategory[e.category].amount += e.amount;
      byCategory[e.category].count++;
    });

    // By payment method
    const byPaymentMethod: Record<string, { amount: number; count: number }> =
      {};
    paid.forEach((e) => {
      if (!byPaymentMethod[e.paymentMethod]) {
        byPaymentMethod[e.paymentMethod] = { amount: 0, count: 0 };
      }
      byPaymentMethod[e.paymentMethod].amount += e.amount;
      byPaymentMethod[e.paymentMethod].count++;
    });

    return {
      totalExpenses,
      paidExpenses,
      pendingExpenses,
      byCategory,
      byPaymentMethod,
    };
  }
}

export class BudgetService extends BaseDataService<Budget> {
  constructor() {
    super(COLLECTIONS.BUDGETS);
  }

  /**
   * Create a new budget
   */
  async createBudget(data: {
    academicYear: string;
    term?: Budget["term"];
    budgetItems: BudgetItem[];
    createdBy: string;
  }): Promise<Budget> {
    const totalBudget = data.budgetItems.reduce(
      (sum, item) => sum + item.allocatedAmount,
      0,
    );

    return this.create({
      ...data,
      totalBudget,
      totalSpent: 0,
      balance: totalBudget,
      status: "draft",
    });
  }

  /**
   * Get budget by academic year and term
   */
  async getByAcademicYearAndTerm(
    academicYear: string,
    term?: Budget["term"],
  ): Promise<Budget | null> {
    const budgets = await this.list();
    return (
      budgets.find(
        (b) =>
          b.academicYear === academicYear &&
          b.term === term &&
          (b.status === "approved" || b.status === "active"),
      ) || null
    );
  }

  /**
   * Approve budget
   */
  async approveBudget(budgetId: string, approvedBy: string): Promise<Budget> {
    return this.update(budgetId, {
      status: "approved",
      approvedBy,
    });
  }

  /**
   * Activate budget
   */
  async activateBudget(budgetId: string): Promise<Budget> {
    return this.update(budgetId, {
      status: "active",
    });
  }

  /**
   * Update budget spending
   */
  async updateSpending(
    budgetId: string,
    categoryId: string,
    amount: number,
  ): Promise<Budget> {
    const budget = await this.getById(budgetId);
    if (!budget) {
      throw new Error("Budget not found");
    }

    const updatedItems = budget.budgetItems.map((item) => {
      if (item.categoryId === categoryId) {
        const newSpent = item.spentAmount + amount;
        return {
          ...item,
          spentAmount: newSpent,
          balance: item.allocatedAmount - newSpent,
        };
      }
      return item;
    });

    const totalSpent = updatedItems.reduce(
      (sum, item) => sum + item.spentAmount,
      0,
    );
    const balance = budget.totalBudget - totalSpent;

    return this.update(budgetId, {
      budgetItems: updatedItems,
      totalSpent,
      balance,
    });
  }

  /**
   * Get budget utilization
   */
  async getBudgetUtilization(budgetId: string): Promise<{
    totalBudget: number;
    totalSpent: number;
    balance: number;
    utilizationRate: number;
    itemsOverBudget: number;
    itemsUtilization: {
      categoryName: string;
      allocated: number;
      spent: number;
      rate: number;
    }[];
  }> {
    const budget = await this.getById(budgetId);
    if (!budget) {
      throw new Error("Budget not found");
    }

    const utilizationRate =
      budget.totalBudget > 0
        ? (budget.totalSpent / budget.totalBudget) * 100
        : 0;

    const itemsOverBudget = budget.budgetItems.filter(
      (item) => item.spentAmount > item.allocatedAmount,
    ).length;

    const itemsUtilization = budget.budgetItems.map((item) => ({
      categoryName: item.categoryName,
      allocated: item.allocatedAmount,
      spent: item.spentAmount,
      rate:
        item.allocatedAmount > 0
          ? (item.spentAmount / item.allocatedAmount) * 100
          : 0,
    }));

    return {
      totalBudget: budget.totalBudget,
      totalSpent: budget.totalSpent,
      balance: budget.balance,
      utilizationRate,
      itemsOverBudget,
      itemsUtilization,
    };
  }

  /**
   * Check if expense is within budget
   */
  async checkBudgetAvailability(
    academicYear: string,
    categoryId: string,
    amount: number,
    term?: Budget["term"],
  ): Promise<{ available: boolean; remaining: number; message: string }> {
    const budget = await this.getByAcademicYearAndTerm(academicYear, term);
    if (!budget) {
      return {
        available: false,
        remaining: 0,
        message: "No active budget found for this period",
      };
    }

    const item = budget.budgetItems.find((i) => i.categoryId === categoryId);
    if (!item) {
      return {
        available: false,
        remaining: 0,
        message: "Category not found in budget",
      };
    }

    const remaining = item.balance;
    const available = remaining >= amount;

    return {
      available,
      remaining,
      message: available
        ? `Budget available: ₦${remaining.toLocaleString()}`
        : `Insufficient budget. Available: ₦${remaining.toLocaleString()}, Required: ₦${amount.toLocaleString()}`,
    };
  }
}

// Export singleton instances
export const expenseCategoryService = new ExpenseCategoryService();
export const expenseService = new ExpenseService();
export const budgetService = new BudgetService();
