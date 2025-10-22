"use client";

import React, { useState, useMemo } from "react";
import {
  CalendarIcon,
  RefreshCwIcon,
  DownloadIcon,
  SettingsIcon,
  TrendingUpIcon,
  AlertTriangleIcon,
  EyeIcon,
  EyeOffIcon,
} from "lucide-react";
import { useFinancialDashboard } from "@/hooks/useFinancialDashboard";
import { FinancialMetricsCards, QuickStats } from "./FinancialMetricsCards";
import { RevenueAnalytics } from "./RevenueAnalytics";
import { ExpenseAnalytics } from "./ExpenseAnalytics";
import { StudentPaymentStatus } from "./StudentPaymentStatus";
import { FinancialAlerts } from "./FinancialAlerts";
import { AccountBalances } from "./AccountBalances";

interface DateRange {
  startDate?: Date;
  endDate?: Date;
  preset?: "today" | "week" | "month" | "quarter" | "year" | "custom";
}

type DashboardView =
  | "overview"
  | "revenue"
  | "expenses"
  | "students"
  | "accounts"
  | "alerts";

export function FinancialDashboard() {
  const [dateRange, setDateRange] = useState<DateRange>({
    preset: "month",
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(),
  });

  const [activeView, setActiveView] = useState<DashboardView>("overview");
  const [showSensitiveData, setShowSensitiveData] = useState(true);
  const [autoRefresh] = useState(true);

  const {
    data,
    loading,
    error,
    refresh,
    setDateRange: setHookDateRange,
  } = useFinancialDashboard({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    autoRefresh,
  });

  // const { formatCurrency } = useFinancialFormatting(); // Reserved for future use

  // Mock payment methods data - would come from API
  const paymentMethods = useMemo(() => {
    const totalCollected = data?.revenue?.totalCollected || 0;
    return {
      cash: { amount: totalCollected * 0.3, count: 25 },
      bank_transfer: { amount: totalCollected * 0.4, count: 35 },
      online: { amount: totalCollected * 0.2, count: 20 },
      card: { amount: totalCollected * 0.1, count: 10 },
    };
  }, [data?.revenue?.totalCollected]);

  const handleDateRangeChange = (newRange: DateRange) => {
    setDateRange(newRange);
    setHookDateRange(newRange.startDate, newRange.endDate);
  };

  const getPresetDateRange = (preset: string): DateRange => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (preset) {
      case "today":
        return { preset: "today", startDate: today, endDate: now };
      case "week":
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        return { preset: "week", startDate: weekStart, endDate: now };
      case "month":
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return { preset: "month", startDate: monthStart, endDate: now };
      case "quarter":
        const quarterStart = new Date(
          now.getFullYear(),
          Math.floor(now.getMonth() / 3) * 3,
          1,
        );
        return { preset: "quarter", startDate: quarterStart, endDate: now };
      case "year":
        const yearStart = new Date(now.getFullYear(), 0, 1);
        return { preset: "year", startDate: yearStart, endDate: now };
      default:
        return dateRange;
    }
  };

  const navigationTabs = [
    {
      id: "overview",
      label: "Overview",
      icon: <TrendingUpIcon className="h-4 w-4" />,
    },
    {
      id: "revenue",
      label: "Revenue",
      icon: <TrendingUpIcon className="h-4 w-4" />,
    },
    {
      id: "expenses",
      label: "Expenses",
      icon: <TrendingUpIcon className="h-4 w-4" />,
    },
    {
      id: "students",
      label: "Students",
      icon: <TrendingUpIcon className="h-4 w-4" />,
    },
    {
      id: "accounts",
      label: "Accounts",
      icon: <TrendingUpIcon className="h-4 w-4" />,
    },
    {
      id: "alerts",
      label: "Alerts",
      icon: <AlertTriangleIcon className="h-4 w-4" />,
    },
  ];

  const formatDateRange = (range: DateRange): string => {
    if (range.preset && range.preset !== "custom") {
      return range.preset.charAt(0).toUpperCase() + range.preset.slice(1);
    }

    if (range.startDate && range.endDate) {
      return `${range.startDate.toLocaleDateString()} - ${range.endDate.toLocaleDateString()}`;
    }

    return "Select Date Range";
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex h-64 items-center justify-center">
            <div className="flex items-center gap-3">
              <RefreshCwIcon className="h-6 w-6 animate-spin text-blue-600" />
              <span className="text-lg text-gray-600">
                Loading financial dashboard...
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
            <AlertTriangleIcon className="mx-auto mb-4 h-12 w-12 text-red-500" />
            <h2 className="mb-2 text-xl font-semibold text-red-900">
              Error Loading Dashboard
            </h2>
            <p className="mb-4 text-red-700">{error}</p>
            <button
              onClick={refresh}
              className="rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="py-12 text-center">
            <p className="text-gray-500">No data available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Financial Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Real-time financial insights and analytics •{" "}
                {formatDateRange(dateRange)}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Date Range Selector */}
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-gray-500" />
                <select
                  value={dateRange.preset || "custom"}
                  onChange={(e) => {
                    const preset = e.target.value;
                    if (preset === "custom") return;
                    handleDateRangeChange(getPresetDateRange(preset));
                  }}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {/* View Controls */}
              <button
                onClick={() => setShowSensitiveData(!showSensitiveData)}
                className={`rounded-lg p-2 transition-colors ${
                  showSensitiveData
                    ? "bg-blue-100 text-blue-600 hover:bg-blue-200"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                title={
                  showSensitiveData
                    ? "Hide sensitive data"
                    : "Show sensitive data"
                }
              >
                {showSensitiveData ? (
                  <EyeIcon className="h-4 w-4" />
                ) : (
                  <EyeOffIcon className="h-4 w-4" />
                )}
              </button>

              <button
                onClick={refresh}
                disabled={loading}
                className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
                title="Refresh data"
              >
                <RefreshCwIcon
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
              </button>

              <button className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900">
                <DownloadIcon className="h-4 w-4" />
              </button>

              <button className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900">
                <SettingsIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-4">
            <nav className="flex space-x-1">
              {navigationTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id as DashboardView)}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    activeView === tab.id
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  } `}
                >
                  {tab.icon}
                  {tab.label}
                  {tab.id === "alerts" && data.alerts.overdueInvoices > 0 && (
                    <span className="ml-1 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
                      {data.alerts.overdueInvoices}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl p-6">
        {activeView === "overview" && (
          <div className="space-y-6">
            <FinancialMetricsCards data={data} />
            <QuickStats data={data} />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="space-y-6">
                <RevenueAnalytics data={data} paymentMethods={paymentMethods} />
              </div>
              <div className="space-y-6">
                <ExpenseAnalytics data={data} />
              </div>
            </div>

            {data.alerts.overdueInvoices > 0 && <FinancialAlerts data={data} />}
          </div>
        )}

        {activeView === "revenue" && (
          <RevenueAnalytics data={data} paymentMethods={paymentMethods} />
        )}

        {activeView === "expenses" && <ExpenseAnalytics data={data} />}

        {activeView === "students" && <StudentPaymentStatus data={data} />}

        {activeView === "accounts" && <AccountBalances data={data} />}

        {activeView === "alerts" && <FinancialAlerts data={data} />}
      </div>

      {/* Loading Overlay */}
      {loading && data && (
        <div className="fixed top-4 right-4 z-50">
          <div className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white shadow-lg">
            <RefreshCwIcon className="h-4 w-4 animate-spin" />
            <span className="text-sm">Updating...</span>
          </div>
        </div>
      )}
    </div>
  );
}
