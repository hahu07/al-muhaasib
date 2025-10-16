import { useState, useEffect, useCallback, useRef } from 'react';
import { reportsService, type IncomeStatement, type BalanceSheet, type CashFlowStatement } from '@/services/reportsService';

export interface ReportFilters {
  startDate: string;
  endDate: string;
  asOfDate: string;
  format: 'monthly' | 'quarterly' | 'yearly';
}

export interface RealtimeReportsData {
  incomeStatement: IncomeStatement | null;
  balanceSheet: BalanceSheet | null;
  cashFlowStatement: CashFlowStatement | null;
  lastUpdated: Date | null;
  isOnline: boolean;
}

export interface UseRealtimeReportsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
  onError?: (error: string, reportType: string) => void;
  onRefresh?: (reportType: string) => void;
}

export interface UseRealtimeReportsReturn {
  data: RealtimeReportsData;
  loading: {
    incomeStatement: boolean;
    balanceSheet: boolean;
    cashFlowStatement: boolean;
    any: boolean;
  };
  errors: {
    incomeStatement: string | null;
    balanceSheet: string | null;
    cashFlowStatement: string | null;
  };
  refreshReport: (reportType: 'income' | 'balance' | 'cashflow' | 'all') => Promise<void>;
  setFilters: (filters: Partial<ReportFilters>) => void;
  filters: ReportFilters;
  isAutoRefreshEnabled: boolean;
  toggleAutoRefresh: () => void;
}

export function useRealtimeReports(
  initialFilters?: Partial<ReportFilters>,
  options: UseRealtimeReportsOptions = {}
): UseRealtimeReportsReturn {
  const {
    autoRefresh = true,
    refreshInterval = 300000, // 5 minutes default
    onError,
    onRefresh,
  } = options;

  // Default filters
  const defaultFilters: ReportFilters = {
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Start of current year
    endDate: new Date().toISOString().split('T')[0], // Today
    asOfDate: new Date().toISOString().split('T')[0], // Today
    format: 'monthly',
  };

  const [filters, setFiltersState] = useState<ReportFilters>({
    ...defaultFilters,
    ...initialFilters,
  });

  const [data, setData] = useState<RealtimeReportsData>({
    incomeStatement: null,
    balanceSheet: null,
    cashFlowStatement: null,
    lastUpdated: null,
    isOnline: navigator.onLine,
  });

  const [loading, setLoading] = useState({
    incomeStatement: false,
    balanceSheet: false,
    cashFlowStatement: false,
    any: false,
  });

  const [errors, setErrors] = useState({
    incomeStatement: null as string | null,
    balanceSheet: null as string | null,
    cashFlowStatement: null as string | null,
  });

  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(autoRefresh);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update loading.any whenever individual loading states change
  useEffect(() => {
    setLoading(prev => ({
      ...prev,
      any: prev.incomeStatement || prev.balanceSheet || prev.cashFlowStatement,
    }));
  }, [loading.incomeStatement, loading.balanceSheet, loading.cashFlowStatement]);

  // Online/offline status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setData(prev => ({ ...prev, isOnline: true }));
      // Auto refresh when coming back online
      if (isAutoRefreshEnabled) {
        refreshReport('all');
      }
    };
    
    const handleOffline = () => {
      setData(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isAutoRefreshEnabled]);

  // Fetch income statement
  const fetchIncomeStatement = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, incomeStatement: true }));
      setErrors(prev => ({ ...prev, incomeStatement: null }));
      
      const incomeStatement = await reportsService.generateIncomeStatement(
        filters.startDate,
        filters.endDate
      );
      
      setData(prev => ({
        ...prev,
        incomeStatement,
        lastUpdated: new Date(),
      }));

      onRefresh?.('income');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch income statement';
      setErrors(prev => ({ ...prev, incomeStatement: errorMessage }));
      onError?.(errorMessage, 'income');
    } finally {
      setLoading(prev => ({ ...prev, incomeStatement: false }));
    }
  }, [filters.startDate, filters.endDate, onError, onRefresh]);

  // Fetch balance sheet
  const fetchBalanceSheet = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, balanceSheet: true }));
      setErrors(prev => ({ ...prev, balanceSheet: null }));
      
      const balanceSheet = await reportsService.generateBalanceSheet(filters.asOfDate);
      
      setData(prev => ({
        ...prev,
        balanceSheet,
        lastUpdated: new Date(),
      }));

      onRefresh?.('balance');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch balance sheet';
      setErrors(prev => ({ ...prev, balanceSheet: errorMessage }));
      onError?.(errorMessage, 'balance');
    } finally {
      setLoading(prev => ({ ...prev, balanceSheet: false }));
    }
  }, [filters.asOfDate, onError, onRefresh]);

  // Fetch cash flow statement
  const fetchCashFlowStatement = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, cashFlowStatement: true }));
      setErrors(prev => ({ ...prev, cashFlowStatement: null }));
      
      const cashFlowStatement = await reportsService.generateCashFlowStatement(
        filters.startDate,
        filters.endDate
      );
      
      setData(prev => ({
        ...prev,
        cashFlowStatement,
        lastUpdated: new Date(),
      }));

      onRefresh?.('cashflow');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch cash flow statement';
      setErrors(prev => ({ ...prev, cashFlowStatement: errorMessage }));
      onError?.(errorMessage, 'cashflow');
    } finally {
      setLoading(prev => ({ ...prev, cashFlowStatement: false }));
    }
  }, [filters.startDate, filters.endDate, onError, onRefresh]);

  // Refresh specific report or all reports
  const refreshReport = useCallback(async (reportType: 'income' | 'balance' | 'cashflow' | 'all') => {
    if (!navigator.onLine) {
      onError?.('Cannot refresh reports while offline', reportType);
      return;
    }

    switch (reportType) {
      case 'income':
        await fetchIncomeStatement();
        break;
      case 'balance':
        await fetchBalanceSheet();
        break;
      case 'cashflow':
        await fetchCashFlowStatement();
        break;
      case 'all':
        await Promise.all([
          fetchIncomeStatement(),
          fetchBalanceSheet(),
          fetchCashFlowStatement(),
        ]);
        break;
    }
  }, [fetchIncomeStatement, fetchBalanceSheet, fetchCashFlowStatement, onError]);

  // Update filters
  const setFilters = useCallback((newFilters: Partial<ReportFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Toggle auto-refresh
  const toggleAutoRefresh = useCallback(() => {
    setIsAutoRefreshEnabled(prev => !prev);
  }, []);

  // Initial data fetch
  useEffect(() => {
    refreshReport('all');
  }, [filters.startDate, filters.endDate, filters.asOfDate]); // Don't include refreshReport to avoid infinite loop

  // Auto-refresh interval
  useEffect(() => {
    if (isAutoRefreshEnabled && refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        if (navigator.onLine) {
          refreshReport('all');
        }
      }, refreshInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAutoRefreshEnabled, refreshInterval, refreshReport]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    data,
    loading,
    errors,
    refreshReport,
    setFilters,
    filters,
    isAutoRefreshEnabled,
    toggleAutoRefresh,
  };
}

// Helper hook for calculating summary statistics
export function useReportsSummary(data: RealtimeReportsData) {
  return {
    totalRevenue: data.incomeStatement?.totalRevenue || 0,
    totalExpenses: data.incomeStatement?.totalExpenses || 0,
    netIncome: data.incomeStatement?.netIncome || 0,
    totalAssets: data.balanceSheet?.assets.totalAssets || 0,
    totalLiabilities: data.balanceSheet?.liabilities.totalLiabilities || 0,
    totalEquity: data.balanceSheet?.equity.totalEquity || 0,
    operatingCashFlow: data.cashFlowStatement?.netOperatingCash || 0,
    endingCashBalance: data.cashFlowStatement?.endingCash || 0,
    isBalanced: data.balanceSheet?.isBalanced || false,
    profitMargin: data.incomeStatement && data.incomeStatement.totalRevenue > 0 
      ? (data.incomeStatement.netIncome / data.incomeStatement.totalRevenue) * 100 
      : 0,
    debtToEquityRatio: data.balanceSheet && data.balanceSheet.equity.totalEquity > 0
      ? data.balanceSheet.liabilities.totalLiabilities / data.balanceSheet.equity.totalEquity
      : 0,
  };
}