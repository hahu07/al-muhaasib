import {
  chartOfAccountsService,
  journalEntryService,
  bankAccountService,
} from "./accountingService";
import { assetService } from "./assetService";
import { paymentService } from "./paymentService";
import { expenseService } from "./expenseService";
import { combinedStaffService as staffService } from "./staffService";
import type {
  ChartOfAccounts,
  JournalEntry,
  FixedAsset,
  Payment,
  Expense,
  SalaryPayment,
} from "@/types";

// Report types
export interface IncomeStatementLine {
  accountCode: string;
  accountName: string;
  amount: number;
  type: "revenue" | "expense";
}

export interface CategoryGroup {
  categoryCode: string;
  categoryName: string;
  items: IncomeStatementLine[];
  subtotal: number;
}

export interface IncomeStatement {
  period: string;
  startDate: string;
  endDate: string;
  revenue: IncomeStatementLine[];
  expenses: IncomeStatementLine[];
  revenueByCategory: CategoryGroup[];
  expensesByCategory: CategoryGroup[];
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  grossProfit?: number;
}

export interface BalanceSheetLine {
  accountCode: string;
  accountName: string;
  amount: number;
  type: "asset" | "liability" | "equity";
  category: string;
}

export interface BalanceSheet {
  asOfDate: string;
  assets: {
    currentAssets: BalanceSheetLine[];
    fixedAssets: BalanceSheetLine[];
    totalAssets: number;
  };
  liabilities: {
    currentLiabilities: BalanceSheetLine[];
    longTermLiabilities: BalanceSheetLine[];
    totalLiabilities: number;
  };
  equity: {
    equity: BalanceSheetLine[];
    totalEquity: number;
  };
  totalLiabilitiesAndEquity: number;
  isBalanced: boolean;
}

export interface CashFlowLine {
  description: string;
  amount: number;
  category: "operating" | "investing" | "financing";
}

export interface CashFlowStatement {
  period: string;
  startDate: string;
  endDate: string;
  operatingActivities: CashFlowLine[];
  investingActivities: CashFlowLine[];
  financingActivities: CashFlowLine[];
  netOperatingCash: number;
  netInvestingCash: number;
  netFinancingCash: number;
  netCashFlow: number;
  beginningCash: number;
  endingCash: number;
}

export interface TrialBalanceLine {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  balance: number;
  accountType: string;
}

export interface TrialBalance {
  asOfDate: string;
  accounts: TrialBalanceLine[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
}

export interface AssetRegisterLine {
  assetName: string;
  assetTag: string;
  category: string;
  purchaseDate: string;
  purchaseCost: number;
  accumulatedDepreciation: number;
  bookValue: number;
  depreciationMethod: string;
  usefulLife: number;
  location: string;
  condition: string;
  status: string;
}

export interface AssetRegister {
  asOfDate: string;
  assets: AssetRegisterLine[];
  totalPurchaseCost: number;
  totalAccumulatedDepreciation: number;
  totalBookValue: number;
  assetCount: number;
  byCategoryCount: Record<string, number>;
  byCategoryValue: Record<string, number>;
}

export interface DepreciationScheduleLine {
  assetName: string;
  assetTag: string;
  purchaseDate: string;
  purchaseCost: number;
  depreciationMethod: string;
  usefulLife: number;
  monthlyDepreciation: number;
  accumulatedDepreciation: number;
  bookValue: number;
  depreciationThisMonth: number;
  depreciationYTD: number;
}

export interface DepreciationSchedule {
  period: string;
  startDate: string;
  endDate: string;
  assets: DepreciationScheduleLine[];
  totalMonthlyDepreciation: number;
  totalAccumulatedDepreciation: number;
  totalBookValue: number;
}

export class ReportsService {
  /**
   * Helper: Group income statement lines by category
   * Each account becomes its own category with all its detail accounts as items
   */
  private groupByCategory(
    lines: IncomeStatementLine[],
    accounts: Map<string, ChartOfAccounts>,
  ): CategoryGroup[] {
    // For now, treat each line as its own category
    // This can be enhanced later to support hierarchical grouping
    const groups: CategoryGroup[] = lines.map((line) => ({
      categoryCode: line.accountCode,
      categoryName: line.accountName,
      items: [line],
      subtotal: line.amount,
    }));

    return groups.sort((a, b) => a.categoryCode.localeCompare(b.categoryCode));
  }

  /**
   * Generate Income Statement
   */
  async generateIncomeStatement(
    startDate: string,
    endDate: string,
  ): Promise<IncomeStatement> {
    const journalEntries = await journalEntryService.getByDateRange(
      startDate,
      endDate,
    );
    const postedEntries = journalEntries.filter((e) => e.status === "posted");

    const accounts = await chartOfAccountsService.getActiveAccounts();
    const accountMap = new Map(accounts.map((a) => [a.id, a]));

    const balances = new Map<string, number>();

    // Calculate account balances from journal entries
    postedEntries.forEach((entry) => {
      entry.lines.forEach((line) => {
        const currentBalance = balances.get(line.accountId) || 0;
        const netAmount = line.debit - line.credit;
        balances.set(line.accountId, currentBalance + netAmount);
      });
    });

    const revenue: IncomeStatementLine[] = [];
    const expenses: IncomeStatementLine[] = [];

    balances.forEach((balance, accountId) => {
      const account = accountMap.get(accountId);
      if (!account || balance === 0) return;

      const line: IncomeStatementLine = {
        accountCode: account.accountCode,
        accountName: account.accountName,
        amount: Math.abs(balance),
        type: account.accountType === "revenue" ? "revenue" : "expense",
      };

      if (account.accountType === "revenue") {
        // Revenue accounts have credit balances, so we flip the sign
        line.amount = balance * -1;
        revenue.push(line);
      } else if (account.accountType === "expense") {
        // Expense accounts have debit balances
        line.amount = balance;
        expenses.push(line);
      }
    });

    const totalRevenue = revenue.reduce((sum, r) => sum + r.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netIncome = totalRevenue - totalExpenses;

    // Group by category
    const revenueByCategory = this.groupByCategory(revenue, accountMap);
    const expensesByCategory = this.groupByCategory(expenses, accountMap);

    return {
      period: `${startDate} to ${endDate}`,
      startDate,
      endDate,
      revenue: revenue.sort((a, b) =>
        a.accountCode.localeCompare(b.accountCode),
      ),
      expenses: expenses.sort((a, b) =>
        a.accountCode.localeCompare(b.accountCode),
      ),
      revenueByCategory,
      expensesByCategory,
      totalRevenue,
      totalExpenses,
      netIncome,
      grossProfit: totalRevenue - totalExpenses, // Simplified for school context
    };
  }

  /**
   * Generate Balance Sheet
   */
  async generateBalanceSheet(asOfDate: string): Promise<BalanceSheet> {
    const trialBalance = await journalEntryService.getTrialBalance(asOfDate);
    const accounts = await chartOfAccountsService.getActiveAccounts();
    const accountMap = new Map(accounts.map((a) => [a.accountCode, a]));

    const currentAssets: BalanceSheetLine[] = [];
    const fixedAssets: BalanceSheetLine[] = [];
    const currentLiabilities: BalanceSheetLine[] = [];
    const longTermLiabilities: BalanceSheetLine[] = [];
    const equity: BalanceSheetLine[] = [];

    trialBalance.accounts.forEach((account) => {
      const accountInfo = Array.from(accountMap.values()).find(
        (a) => a.accountCode === account.accountCode,
      );

      if (!accountInfo) return;

      // Skip revenue and expense accounts (they don't belong on balance sheet)
      if (
        accountInfo.accountType === "revenue" ||
        accountInfo.accountType === "expense"
      ) {
        return;
      }

      const balance = account.debit - account.credit;
      if (Math.abs(balance) < 0.01) return; // Skip zero balances

      const line: BalanceSheetLine = {
        accountCode: account.accountCode,
        accountName: account.accountName,
        amount: Math.abs(balance),
        type: accountInfo.accountType as "asset" | "liability" | "equity",
        category: this.getBalanceSheetCategory(accountInfo.accountCode),
      };

      switch (accountInfo.accountType) {
        case "asset":
          if (this.isCurrentAsset(accountInfo.accountCode)) {
            line.amount = balance; // Assets have debit balances
            currentAssets.push(line);
          } else {
            line.amount = balance;
            fixedAssets.push(line);
          }
          break;
        case "liability":
          line.amount = balance * -1; // Liabilities have credit balances
          if (this.isCurrentLiability(accountInfo.accountCode)) {
            currentLiabilities.push(line);
          } else {
            longTermLiabilities.push(line);
          }
          break;
        case "equity":
          line.amount = balance * -1; // Equity has credit balance
          equity.push(line);
          break;
      }
    });

    const totalAssets = [...currentAssets, ...fixedAssets].reduce(
      (sum, a) => sum + a.amount,
      0,
    );
    const totalLiabilities = [
      ...currentLiabilities,
      ...longTermLiabilities,
    ].reduce((sum, l) => sum + l.amount, 0);
    const totalEquity = equity.reduce((sum, e) => sum + e.amount, 0);

    return {
      asOfDate,
      assets: {
        currentAssets: currentAssets.sort((a, b) =>
          a.accountCode.localeCompare(b.accountCode),
        ),
        fixedAssets: fixedAssets.sort((a, b) =>
          a.accountCode.localeCompare(b.accountCode),
        ),
        totalAssets,
      },
      liabilities: {
        currentLiabilities: currentLiabilities.sort((a, b) =>
          a.accountCode.localeCompare(b.accountCode),
        ),
        longTermLiabilities: longTermLiabilities.sort((a, b) =>
          a.accountCode.localeCompare(b.accountCode),
        ),
        totalLiabilities,
      },
      equity: {
        equity: equity.sort((a, b) =>
          a.accountCode.localeCompare(b.accountCode),
        ),
        totalEquity,
      },
      totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
      isBalanced:
        Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
    };
  }

  /**
   * Generate Cash Flow Statement
   */
  async generateCashFlowStatement(
    startDate: string,
    endDate: string,
  ): Promise<CashFlowStatement> {
    try {
      // Get beginning cash balance
      const beginningDate = new Date(startDate);
      beginningDate.setDate(beginningDate.getDate() - 1);
      const beginningBalanceDate = beginningDate.toISOString().split("T")[0];

      const beginningTrialBalance =
        await journalEntryService.getTrialBalance(beginningBalanceDate);
      const endingTrialBalance =
        await journalEntryService.getTrialBalance(endDate);

      const beginningCash = this.getCashFromTrialBalance(beginningTrialBalance);
      const endingCash = this.getCashFromTrialBalance(endingTrialBalance);

      // Get journal entries for the period to analyze cash flows
      const journalEntries = await journalEntryService.getByDateRange(
        startDate,
        endDate,
      );
      const postedEntries = journalEntries.filter((e) => e.status === "posted");

      const operatingActivities: CashFlowLine[] = [];
      const investingActivities: CashFlowLine[] = [];
      const financingActivities: CashFlowLine[] = [];

      // Analyze journal entries to categorize cash flows
      postedEntries.forEach((entry) => {
        entry.lines.forEach((line) => {
          // Skip if accountCode is missing (old entries)
          if (!line.accountCode) return;

          // Check if this line involves cash/bank accounts
          const isCashAccount =
            line.accountCode.startsWith("111") ||
            line.accountCode.startsWith("112");
          if (!isCashAccount) return;

          const cashFlow = line.debit - line.credit; // Positive = cash inflow, Negative = cash outflow
          if (Math.abs(cashFlow) < 0.01) return;

          // Categorize based on reference type or account codes
          if (entry.referenceType === "payment") {
            operatingActivities.push({
              description: entry.description || "Revenue collection",
              amount: cashFlow,
              category: "operating",
            });
          } else if (entry.referenceType === "expense") {
            operatingActivities.push({
              description: entry.description || "Operating expense",
              amount: cashFlow,
              category: "operating",
            });
          } else if (entry.referenceType === "salary") {
            operatingActivities.push({
              description: entry.description || "Salary payment",
              amount: cashFlow,
              category: "operating",
            });
          } else if (line.accountCode.startsWith("12")) {
            // Fixed asset related
            investingActivities.push({
              description: entry.description || "Asset purchase",
              amount: cashFlow,
              category: "investing",
            });
          } else {
            operatingActivities.push({
              description: entry.description || "Other transaction",
              amount: cashFlow,
              category: "operating",
            });
          }
        });
      });

      const netOperatingCash = operatingActivities.reduce(
        (sum, a) => sum + a.amount,
        0,
      );
      const netInvestingCash = investingActivities.reduce(
        (sum, a) => sum + a.amount,
        0,
      );
      const netFinancingCash = financingActivities.reduce(
        (sum, a) => sum + a.amount,
        0,
      );
      const netCashFlow =
        netOperatingCash + netInvestingCash + netFinancingCash;

      return {
        period: `${startDate} to ${endDate}`,
        startDate,
        endDate,
        operatingActivities,
        investingActivities,
        financingActivities,
        netOperatingCash,
        netInvestingCash,
        netFinancingCash,
        netCashFlow,
        beginningCash,
        endingCash,
      };
    } catch (error) {
      console.error("Error generating cash flow statement:", error);
      throw new Error(
        `Failed to generate cash flow statement: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Generate Trial Balance
   */
  async generateTrialBalance(asOfDate?: string): Promise<TrialBalance> {
    const trialBalance = await journalEntryService.getTrialBalance(asOfDate);
    const accounts = await chartOfAccountsService.getActiveAccounts();
    const accountMap = new Map(accounts.map((a) => [a.accountCode, a]));

    const trialBalanceLines: TrialBalanceLine[] = trialBalance.accounts
      .map((account) => {
        const accountInfo = Array.from(accountMap.values()).find(
          (a) => a.accountCode === account.accountCode,
        );

        return {
          accountCode: account.accountCode,
          accountName: account.accountName,
          debit: account.debit,
          credit: account.credit,
          balance: account.debit - account.credit,
          accountType: accountInfo?.accountType || "unknown",
        };
      })
      .sort((a, b) => a.accountCode.localeCompare(b.accountCode));

    return {
      asOfDate: asOfDate || new Date().toISOString().split("T")[0],
      accounts: trialBalanceLines,
      totalDebit: trialBalance.totalDebit,
      totalCredit: trialBalance.totalCredit,
      isBalanced: trialBalance.isBalanced,
    };
  }

  /**
   * Generate Asset Register
   */
  async generateAssetRegister(asOfDate?: string): Promise<AssetRegister> {
    const assets = await assetService.fixedAssetService.list();
    const activeAssets = assets.filter((a) => a.status === "active");

    const assetLines: AssetRegisterLine[] = [];
    let totalPurchaseCost = 0;
    let totalAccumulatedDepreciation = 0;

    const byCategoryCount: Record<string, number> = {};
    const byCategoryValue: Record<string, number> = {};

    for (const asset of activeAssets) {
      const accumulatedDepreciation =
        await this.calculateAccumulatedDepreciation(
          asset,
          asOfDate || new Date().toISOString().split("T")[0],
        );

      const purchaseCost = Number(asset.purchasePrice);
      const bookValue = purchaseCost - accumulatedDepreciation;

      const line: AssetRegisterLine = {
        assetName: String(asset.assetName),
        assetTag: String(asset.assetCode),
        category: String(asset.category),
        purchaseDate: String(asset.purchaseDate),
        purchaseCost,
        accumulatedDepreciation,
        bookValue,
        depreciationMethod: String(asset.depreciationMethod),
        usefulLife: Number(asset.usefulLifeYears),
        location: String(asset.location || ""),
        condition: String(asset.condition || "good"),
        status: String(asset.status),
      };

      assetLines.push(line);
      totalPurchaseCost += purchaseCost;
      totalAccumulatedDepreciation += accumulatedDepreciation;

      byCategoryCount[asset.category] =
        (byCategoryCount[asset.category] || 0) + 1;
      byCategoryValue[asset.category] =
        (byCategoryValue[asset.category] || 0) + bookValue;
    }

    return {
      asOfDate: asOfDate || new Date().toISOString().split("T")[0],
      assets: assetLines.sort((a, b) => a.assetTag.localeCompare(b.assetTag)),
      totalPurchaseCost,
      totalAccumulatedDepreciation,
      totalBookValue: totalPurchaseCost - totalAccumulatedDepreciation,
      assetCount: assetLines.length,
      byCategoryCount,
      byCategoryValue,
    };
  }

  /**
   * Generate Depreciation Schedule
   */
  async generateDepreciationSchedule(
    startDate: string,
    endDate: string,
  ): Promise<DepreciationSchedule> {
    const assets = await assetService.fixedAssetService.list();
    const depreciableAssets = assets.filter(
      (a) => a.status === "active" && a.depreciationMethod !== "none",
    );

    const assetLines: DepreciationScheduleLine[] = [];
    let totalMonthlyDepreciation = 0;
    let totalAccumulatedDepreciation = 0;
    let totalBookValue = 0;

    for (const asset of depreciableAssets) {
      const monthlyDepreciation = this.calculateMonthlyDepreciation(asset);
      const accumulatedDepreciation =
        await this.calculateAccumulatedDepreciation(asset, endDate);
      const depreciationThisMonth = this.calculateDepreciationForPeriod(
        asset,
        startDate,
        endDate,
      );
      const depreciationYTD = this.calculateDepreciationYTD(asset, endDate);

      const purchaseCost = Number(asset.purchasePrice);
      const bookValue = purchaseCost - accumulatedDepreciation;

      const line: DepreciationScheduleLine = {
        assetName: String(asset.assetName),
        assetTag: String(asset.assetCode),
        purchaseDate: String(asset.purchaseDate),
        purchaseCost,
        depreciationMethod: String(asset.depreciationMethod),
        usefulLife: Number(asset.usefulLifeYears),
        monthlyDepreciation,
        accumulatedDepreciation,
        bookValue,
        depreciationThisMonth,
        depreciationYTD,
      };

      assetLines.push(line);
      totalMonthlyDepreciation += monthlyDepreciation;
      totalAccumulatedDepreciation += accumulatedDepreciation;
      totalBookValue += bookValue;
    }

    return {
      period: `${startDate} to ${endDate}`,
      startDate,
      endDate,
      assets: assetLines.sort((a, b) => a.assetTag.localeCompare(b.assetTag)),
      totalMonthlyDepreciation,
      totalAccumulatedDepreciation,
      totalBookValue,
    };
  }

  // Helper methods
  private getBalanceSheetCategory(accountCode: string): string {
    const code = accountCode.substring(0, 2);
    switch (code) {
      case "11":
        return "Current Assets";
      case "12":
        return "Fixed Assets";
      case "21":
        return "Current Liabilities";
      case "22":
        return "Long-term Liabilities";
      case "31":
        return "Equity";
      default:
        return "Other";
    }
  }

  private isCurrentAsset(accountCode: string): boolean {
    return accountCode.startsWith("11");
  }

  private isCurrentLiability(accountCode: string): boolean {
    return accountCode.startsWith("21");
  }

  private getCashFromTrialBalance(trialBalance: {
    accounts: { accountCode: string; debit: number; credit: number }[];
  }): number {
    const cashAccounts = trialBalance.accounts.filter(
      (a) =>
        a.accountCode &&
        (a.accountCode.startsWith("111") || a.accountCode.startsWith("112")),
    );
    return cashAccounts.reduce((sum, a) => sum + (a.debit - a.credit), 0);
  }

  private isOperatingExpense(category: string): boolean {
    const operatingCategories = [
      "utilities",
      "maintenance",
      "supplies",
      "salaries",
      "administrative",
      "marketing",
      "insurance",
    ];
    return operatingCategories.includes(category.toLowerCase());
  }

  private isCapitalExpense(category: string): boolean {
    const capitalCategories = [
      "equipment",
      "buildings",
      "furniture",
      "technology",
      "vehicles",
    ];
    return capitalCategories.includes(category.toLowerCase());
  }

  private calculateMonthlyDepreciation(asset: FixedAsset): number {
    if (asset.depreciationMethod === "straight-line") {
      return Number(asset.purchasePrice) / (asset.usefulLifeYears * 12);
    }
    return 0;
  }

  private async calculateAccumulatedDepreciation(
    asset: FixedAsset,
    asOfDate: string,
  ): Promise<number> {
    const purchaseDate = new Date(asset.purchaseDate);
    const asOf = new Date(asOfDate);

    const monthsElapsed = Math.max(
      0,
      (asOf.getFullYear() - purchaseDate.getFullYear()) * 12 +
        (asOf.getMonth() - purchaseDate.getMonth()),
    );

    const monthlyDepreciation = this.calculateMonthlyDepreciation(asset);
    const totalDepreciation = monthsElapsed * monthlyDepreciation;

    // Cap at purchase cost
    return Math.min(totalDepreciation, Number(asset.purchasePrice));
  }

  private calculateDepreciationForPeriod(
    asset: FixedAsset,
    startDate: string,
    endDate: string,
  ): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const purchaseDate = new Date(asset.purchaseDate);

    if (purchaseDate > end) return 0;

    const effectiveStart = purchaseDate > start ? purchaseDate : start;
    const monthsInPeriod = Math.max(
      0,
      (end.getFullYear() - effectiveStart.getFullYear()) * 12 +
        (end.getMonth() - effectiveStart.getMonth()) +
        1,
    );

    return monthsInPeriod * this.calculateMonthlyDepreciation(asset);
  }

  private calculateDepreciationYTD(
    asset: FixedAsset,
    asOfDate: string,
  ): number {
    const asOf = new Date(asOfDate);
    const yearStart = new Date(asOf.getFullYear(), 0, 1);

    return this.calculateDepreciationForPeriod(
      asset,
      yearStart.toISOString().split("T")[0],
      asOfDate,
    );
  }
}

// Export singleton instance
export const reportsService = new ReportsService();
