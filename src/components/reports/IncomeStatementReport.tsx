"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  MinusCircle,
} from "lucide-react";
import { useSchool } from "@/contexts/SchoolContext";
import {
  reportsService,
  type IncomeStatement,
} from "@/services/reportsService";

interface IncomeStatementReportProps {
  filters: {
    startDate: string;
    endDate: string;
    format: "monthly" | "quarterly" | "yearly";
  };
  onBack: () => void;
}

const IncomeStatementReport: React.FC<IncomeStatementReportProps> = ({
  filters,
  onBack,
}) => {
  const { formatCurrency } = useSchool();
  const [incomeStatement, setIncomeStatement] =
    useState<IncomeStatement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadIncomeStatement();
  }, [filters.startDate, filters.endDate]);

  const loadIncomeStatement = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportsService.generateIncomeStatement(
        filters.startDate,
        filters.endDate,
      );
      setIncomeStatement(data);
    } catch (err) {
      setError("Failed to load income statement");
      console.error("Error loading income statement:", err);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    // Implement PDF/Excel export
    console.log("Exporting Income Statement...");
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Income Statement</h1>
        </div>
        <div className="flex h-64 items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Income Statement</h1>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600">{error}</p>
            <Button onClick={loadIncomeStatement} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!incomeStatement) return null;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Income Statement</h1>
            <p className="text-gray-600">{incomeStatement.period}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadIncomeStatement}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={exportReport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(incomeStatement.totalRevenue)}
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
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(incomeStatement.totalExpenses)}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Net Income</p>
                <p
                  className={`text-2xl font-bold ${incomeStatement.netIncome >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {formatCurrency(incomeStatement.netIncome)}
                </p>
              </div>
              <DollarSign
                className={`h-8 w-8 ${incomeStatement.netIncome >= 0 ? "text-green-600" : "text-red-600"}`}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Report */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Performance Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Revenue Section */}
            <div>
              <h3 className="mb-4 text-lg font-semibold text-green-700">
                REVENUE
              </h3>
              <div className="space-y-2">
                {incomeStatement.revenue.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-3"
                  >
                    <div>
                      <span className="font-medium">{item.accountName}</span>
                      <span className="ml-2 text-gray-500">
                        ({item.accountCode})
                      </span>
                    </div>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                ))}
                {/* Total Revenue */}
                <div className="flex items-center justify-between border-t-2 border-green-300 pt-4 mt-2">
                  <span className="text-lg font-bold text-green-700">
                    TOTAL REVENUE
                  </span>
                  <span className="text-lg font-bold text-green-600">
                    {formatCurrency(incomeStatement.totalRevenue)}
                  </span>
                </div>
              </div>
            </div>

            {/* Expenses Section */}
            <div>
              <h3 className="mb-4 text-lg font-semibold text-red-700">
                EXPENSES
              </h3>
              <div className="space-y-2">
                {incomeStatement.expenses.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-3"
                  >
                    <div>
                      <span className="font-medium">{item.accountName}</span>
                      <span className="ml-2 text-gray-500">
                        ({item.accountCode})
                      </span>
                    </div>
                    <span className="font-semibold text-red-600">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                ))}
                {/* Total Expenses */}
                <div className="flex items-center justify-between border-t-2 border-red-300 pt-4 mt-2">
                  <span className="text-lg font-bold text-red-700">
                    TOTAL EXPENSES
                  </span>
                  <span className="text-lg font-bold text-red-600">
                    {formatCurrency(incomeStatement.totalExpenses)}
                  </span>
                </div>
              </div>
            </div>

            {/* Net Income Section */}
            <div className="border-t-4 border-gray-800 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold">NET INCOME</span>
                <div className="text-right">
                  <span
                    className={`text-xl font-bold ${incomeStatement.netIncome >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {formatCurrency(incomeStatement.netIncome)}
                  </span>
                  <div className="mt-1">
                    <Badge
                      variant={
                        incomeStatement.netIncome >= 0
                          ? "default"
                          : "destructive"
                      }
                      className="text-xs"
                    >
                      {incomeStatement.netIncome >= 0 ? "PROFIT" : "LOSS"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Margin Analysis */}
            <div className="rounded-lg bg-gray-50 p-4">
              <h4 className="mb-3 font-semibold">Margin Analysis</h4>
              <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
                <div>
                  <p className="text-gray-600">Gross Margin</p>
                  <p className="font-semibold">
                    {incomeStatement.totalRevenue > 0
                      ? (
                          ((incomeStatement.grossProfit || 0) /
                            incomeStatement.totalRevenue) *
                          100
                        ).toFixed(1)
                      : "0.0"}
                    %
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Net Margin</p>
                  <p className="font-semibold">
                    {incomeStatement.totalRevenue > 0
                      ? (
                          (incomeStatement.netIncome /
                            incomeStatement.totalRevenue) *
                          100
                        ).toFixed(1)
                      : "0.0"}
                    %
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Expense Ratio</p>
                  <p className="font-semibold">
                    {incomeStatement.totalRevenue > 0
                      ? (
                          (incomeStatement.totalExpenses /
                            incomeStatement.totalRevenue) *
                          100
                        ).toFixed(1)
                      : "0.0"}
                    %
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IncomeStatementReport;
