import { useState, useEffect, useCallback } from "react";
import { getFinancialDashboard } from "@/services/dataService";

export interface FinancialDashboardData {
  revenue: {
    totalCollected: number;
    totalPending: number;
    totalOverdue: number;
    monthlyTrend: Array<{ month: string; amount: number }>;
  };
  expenses: {
    totalExpenses: number;
    byCategory: Record<string, { amount: number; count: number }>;
    pendingApprovals: number;
    recurringExpenses: number;
  };
  accounts: {
    totalBalance: number;
    byType: Record<string, number>;
    byCurrency: Record<string, number>;
  };
  students: {
    totalStudents: number;
    paidStudents: number;
    partialPaidStudents: number;
    unpaidStudents: number;
    overdueStudents: number;
  };
  profitLoss: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
  };
  scholarships: {
    totalScholarships: number;
    totalBudget: number;
    usedBudget: number;
    beneficiaries: number;
  };
  alerts: {
    overdueInvoices: number;
    lowBalanceAccounts: number;
    pendingExpenses: number;
    scholarshipBudgetAlerts: number;
  };
}

export interface UseFinancialDashboardOptions {
  startDate?: Date;
  endDate?: Date;
  refreshInterval?: number;
  autoRefresh?: boolean;
}

export interface UseFinancialDashboardReturn {
  data: FinancialDashboardData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setDateRange: (startDate?: Date, endDate?: Date) => void;
}

export function useFinancialDashboard(
  options: UseFinancialDashboardOptions = {},
): UseFinancialDashboardReturn {
  const {
    startDate: initialStartDate,
    endDate: initialEndDate,
    refreshInterval = 300000, // 5 minutes
    autoRefresh = true,
  } = options;

  const [data, setData] = useState<FinancialDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(
    initialStartDate,
  );
  const [endDate, setEndDate] = useState<Date | undefined>(initialEndDate);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const dashboardData = await getFinancialDashboard(startDate, endDate);
      setData(dashboardData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch dashboard data";
      setError(errorMessage);
      console.error("Financial dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  const refresh = async () => {
    await fetchDashboardData();
  };

  const setDateRange = (newStartDate?: Date, newEndDate?: Date) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
  }, [startDate, endDate, fetchDashboardData]);

  // Auto refresh interval
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchDashboardData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, startDate, endDate, fetchDashboardData]);

  return {
    data,
    loading,
    error,
    refresh,
    setDateRange,
  };
}

// Helper hook for formatting financial data
export function useFinancialFormatting() {
  const formatCurrency = (amount: number, currency = "NGN"): string => {
    try {
      return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      // Fallback if Intl is not available
      return `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    }
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat("en-US").format(value);
  };

  const getPaymentStatusColor = (
    status: "paid" | "partial" | "pending" | "overdue",
  ): string => {
    const colors = {
      paid: "text-green-600 bg-green-50 border-green-200",
      partial: "text-yellow-600 bg-yellow-50 border-yellow-200",
      pending: "text-blue-600 bg-blue-50 border-blue-200",
      overdue: "text-red-600 bg-red-50 border-red-200",
    };
    return colors[status] || colors.pending;
  };

  const getTrendColor = (value: number): string => {
    if (value > 0) return "text-green-600";
    if (value < 0) return "text-red-600";
    return "text-gray-600";
  };

  return {
    formatCurrency,
    formatPercentage,
    formatNumber,
    getPaymentStatusColor,
    getTrendColor,
  };
}
