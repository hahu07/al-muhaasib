"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  FileText,
  BarChart3,
  PieChart,
  TrendingUp,
  Building,
  Calculator,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  Wifi,
  WifiOff,
  Clock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  useRealtimeReports,
  useReportsSummary,
} from "@/hooks/useRealtimeReports";

// Import report components (we'll create these next)
import IncomeStatementReport from "./IncomeStatementReport";
import BalanceSheetReport from "./BalanceSheetReport";
import CashFlowReport from "./CashFlowReport";
import TrialBalanceReport from "./TrialBalanceReport";
import AssetRegisterReport from "./AssetRegisterReport";
import DepreciationScheduleReport from "./DepreciationScheduleReport";

interface ReportFilters {
  startDate: string;
  endDate: string;
  asOfDate: string;
  format: "monthly" | "quarterly" | "yearly";
  compareWith?: string;
}

const ReportsDashboard: React.FC = () => {
  const [activeReport, setActiveReport] = useState<string>("overview");

  // Use real-time reports hook with auto-refresh
  const {
    data: reportsData,
    loading,
    errors,
    refreshReport,
    setFilters,
    filters,
    isAutoRefreshEnabled,
    toggleAutoRefresh,
  } = useRealtimeReports(
    {
      startDate: new Date(new Date().getFullYear(), 0, 1)
        .toISOString()
        .split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
      asOfDate: new Date().toISOString().split("T")[0],
      format: "monthly",
    },
    {
      autoRefresh: true,
      refreshInterval: 300000, // 5 minutes
      onError: (error, reportType) => {
        console.error(`Error loading ${reportType} report:`, error);
      },
      onRefresh: (reportType) => {
        console.log(`${reportType} report refreshed`);
      },
    },
  );

  // Calculate summary statistics from real-time data
  const summary = useReportsSummary(reportsData);

  const reportCards = [
    {
      id: "income-statement",
      title: "Income Statement",
      description: "Revenue vs Expenses analysis",
      icon: TrendingUp,
      color: "bg-green-500",
    },
    {
      id: "balance-sheet",
      title: "Balance Sheet",
      description: "Assets, Liabilities & Equity",
      icon: BarChart3,
      color: "bg-blue-500",
    },
    {
      id: "cash-flow",
      title: "Cash Flow Statement",
      description: "Operating, Investing & Financing",
      icon: PieChart,
      color: "bg-purple-500",
    },
    {
      id: "trial-balance",
      title: "Trial Balance",
      description: "Account balance verification",
      icon: Calculator,
      color: "bg-orange-500",
    },
    {
      id: "asset-register",
      title: "Asset Register",
      description: "Fixed assets inventory",
      icon: Building,
      color: "bg-indigo-500",
    },
    {
      id: "depreciation-schedule",
      title: "Depreciation Schedule",
      description: "Asset depreciation tracking",
      icon: FileText,
      color: "bg-gray-500",
    },
  ];

  const handleFilterChange = (field: string, value: string) => {
    setFilters({ [field]: value });
  };

  const refreshReports = async () => {
    await refreshReport("all");
  };

  const exportAllReports = () => {
    // Implement bulk export functionality
    console.log("Exporting all reports...");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Never";
    return new Intl.DateTimeFormat("en-NG", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date);
  };

  if (activeReport === "overview") {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Financial Reports</h1>
            <p className="mt-1 text-gray-600">
              Comprehensive financial analysis and reporting
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={refreshReports}
              disabled={
                loading.incomeStatement ||
                loading.balanceSheet ||
                loading.cashFlowStatement
              }
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${loading.incomeStatement || loading.balanceSheet || loading.cashFlowStatement ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button onClick={exportAllReports}>
              <Download className="mr-2 h-4 w-4" />
              Export All
            </Button>
          </div>
        </div>

        {/* Filters Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Report Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    handleFilterChange("startDate", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">
                  End Date
                </label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    handleFilterChange("endDate", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">
                  As of Date
                </label>
                <Input
                  type="date"
                  value={filters.asOfDate}
                  onChange={(e) =>
                    handleFilterChange("asOfDate", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Period</label>
                <Select
                  value={filters.format}
                  onValueChange={(value) =>
                    handleFilterChange(
                      "format",
                      value as "monthly" | "quarterly" | "yearly",
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reportCards.map((report) => {
            const IconComponent = report.icon;
            return (
              <div
                key={report.id}
                className="cursor-pointer transition-shadow hover:shadow-lg"
                onClick={() => setActiveReport(report.id)}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {report.title}
                        </h3>
                        <p className="mt-1 text-sm text-gray-600">
                          {report.description}
                        </p>
                      </div>
                      <div className={`rounded-lg p-3 ${report.color}`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <Button variant="outline" size="sm">
                        View Report
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    ₦2,450,000
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-600">₦1,800,000</p>
                </div>
                <TrendingUp className="h-8 w-8 rotate-180 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Net Income</p>
                  <p className="text-2xl font-bold text-blue-600">₦650,000</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Assets</p>
                  <p className="text-2xl font-bold text-purple-600">
                    ₦8,500,000
                  </p>
                </div>
                <Building className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Render specific report based on activeReport
  const renderReport = () => {
    switch (activeReport) {
      case "income-statement":
        return (
          <IncomeStatementReport
            filters={filters}
            onBack={() => setActiveReport("overview")}
          />
        );
      case "balance-sheet":
        return (
          <BalanceSheetReport
            filters={filters}
            onBack={() => setActiveReport("overview")}
          />
        );
      case "cash-flow":
        return (
          <CashFlowReport
            filters={filters}
            onBack={() => setActiveReport("overview")}
          />
        );
      case "trial-balance":
        return (
          <TrialBalanceReport
            filters={filters}
            onBack={() => setActiveReport("overview")}
          />
        );
      case "asset-register":
        return (
          <AssetRegisterReport
            filters={filters}
            onBack={() => setActiveReport("overview")}
          />
        );
      case "depreciation-schedule":
        return (
          <DepreciationScheduleReport
            filters={filters}
            onBack={() => setActiveReport("overview")}
          />
        );
      default:
        return <div>Report not found</div>;
    }
  };

  return renderReport();
};

export default ReportsDashboard;
