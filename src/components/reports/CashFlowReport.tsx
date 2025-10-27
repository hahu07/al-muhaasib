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
  Activity,
  Building,
  CreditCard,
  DollarSign,
  Wallet,
} from "lucide-react";
import { useSchool } from "@/contexts/SchoolContext";
import {
  reportsService,
  type CashFlowStatement,
} from "@/services/reportsService";

interface CashFlowReportProps {
  filters: {
    startDate: string;
    endDate: string;
    format: "monthly" | "quarterly" | "yearly";
  };
  onBack: () => void;
}

const CashFlowReport: React.FC<CashFlowReportProps> = ({ filters, onBack }) => {
  const { formatCurrency } = useSchool();
  const [cashFlowStatement, setCashFlowStatement] =
    useState<CashFlowStatement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCashFlowStatement();
  }, [filters.startDate, filters.endDate]);

  const loadCashFlowStatement = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportsService.generateCashFlowStatement(
        filters.startDate,
        filters.endDate,
      );
      setCashFlowStatement(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to load cash flow statement: ${errorMessage}`);
      console.error("Error loading cash flow statement:", err);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    console.log("Exporting Cash Flow Statement...");
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Cash Flow Statement</h1>
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
          <h1 className="text-2xl font-bold">Cash Flow Statement</h1>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600">{error}</p>
            <Button onClick={loadCashFlowStatement} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!cashFlowStatement) return null;

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
            <h1 className="text-2xl font-bold">Cash Flow Statement</h1>
            <p className="text-gray-600">{cashFlowStatement.period}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadCashFlowStatement}>
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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Beginning Cash</p>
                <p className="text-xl font-bold text-blue-600">
                  {formatCurrency(cashFlowStatement.beginningCash)}
                </p>
              </div>
              <Wallet className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Operating Cash Flow</p>
                <p
                  className={`text-xl font-bold ${
                    cashFlowStatement.netOperatingCash >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {formatCurrency(cashFlowStatement.netOperatingCash)}
                </p>
              </div>
              <Activity
                className={`h-6 w-6 ${
                  cashFlowStatement.netOperatingCash >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Net Cash Flow</p>
                <p
                  className={`text-xl font-bold ${
                    cashFlowStatement.netCashFlow >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {formatCurrency(cashFlowStatement.netCashFlow)}
                </p>
              </div>
              {cashFlowStatement.netCashFlow >= 0 ? (
                <TrendingUp className="h-6 w-6 text-green-600" />
              ) : (
                <TrendingDown className="h-6 w-6 text-red-600" />
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ending Cash</p>
                <p className="text-xl font-bold text-purple-600">
                  {formatCurrency(cashFlowStatement.endingCash)}
                </p>
              </div>
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Operating Activities */}
            <div>
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-green-700">
                <Activity className="h-5 w-5" />
                OPERATING ACTIVITIES
              </h3>
              <div className="space-y-2">
                {cashFlowStatement.operatingActivities.map(
                  (activity, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between border-b border-gray-100 py-2"
                    >
                      <span className="text-sm">{activity.description}</span>
                      <span
                        className={`text-sm font-medium ${
                          activity.amount >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatCurrency(activity.amount)}
                      </span>
                    </div>
                  ),
                )}
                <div className="flex items-center justify-between border-t-2 border-green-200 pt-4">
                  <span className="font-bold text-green-700">
                    Net Operating Cash Flow
                  </span>
                  <span
                    className={`font-bold ${
                      cashFlowStatement.netOperatingCash >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatCurrency(cashFlowStatement.netOperatingCash)}
                  </span>
                </div>
              </div>
            </div>

            {/* Investing Activities */}
            <div>
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-blue-700">
                <Building className="h-5 w-5" />
                INVESTING ACTIVITIES
              </h3>
              <div className="space-y-2">
                {cashFlowStatement.investingActivities.length > 0 ? (
                  cashFlowStatement.investingActivities.map(
                    (activity, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between border-b border-gray-100 py-2"
                      >
                        <span className="text-sm">{activity.description}</span>
                        <span
                          className={`text-sm font-medium ${
                            activity.amount >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {formatCurrency(activity.amount)}
                        </span>
                      </div>
                    ),
                  )
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    No investing activities in this period
                  </p>
                )}
                <div className="flex items-center justify-between border-t-2 border-blue-200 pt-4">
                  <span className="font-bold text-blue-700">
                    Net Investing Cash Flow
                  </span>
                  <span
                    className={`font-bold ${
                      cashFlowStatement.netInvestingCash >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatCurrency(cashFlowStatement.netInvestingCash)}
                  </span>
                </div>
              </div>
            </div>

            {/* Financing Activities */}
            <div>
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-purple-700">
                <CreditCard className="h-5 w-5" />
                FINANCING ACTIVITIES
              </h3>
              <div className="space-y-2">
                {cashFlowStatement.financingActivities.length > 0 ? (
                  cashFlowStatement.financingActivities.map(
                    (activity, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between border-b border-gray-100 py-2"
                      >
                        <span className="text-sm">{activity.description}</span>
                        <span
                          className={`text-sm font-medium ${
                            activity.amount >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {formatCurrency(activity.amount)}
                        </span>
                      </div>
                    ),
                  )
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    No financing activities in this period
                  </p>
                )}
                <div className="flex items-center justify-between border-t-2 border-purple-200 pt-4">
                  <span className="font-bold text-purple-700">
                    Net Financing Cash Flow
                  </span>
                  <span
                    className={`font-bold ${
                      cashFlowStatement.netFinancingCash >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatCurrency(cashFlowStatement.netFinancingCash)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cash Flow Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b py-3">
              <span className="font-medium">Beginning Cash Balance</span>
              <span className="font-medium">
                {formatCurrency(cashFlowStatement.beginningCash)}
              </span>
            </div>
            <div className="flex items-center justify-between border-b py-3">
              <span className="font-medium text-green-700">
                Net Operating Cash Flow
              </span>
              <span
                className={`font-medium ${
                  cashFlowStatement.netOperatingCash >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {cashFlowStatement.netOperatingCash >= 0 ? "+" : ""}
                {formatCurrency(cashFlowStatement.netOperatingCash)}
              </span>
            </div>
            <div className="flex items-center justify-between border-b py-3">
              <span className="font-medium text-blue-700">
                Net Investing Cash Flow
              </span>
              <span
                className={`font-medium ${
                  cashFlowStatement.netInvestingCash >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {cashFlowStatement.netInvestingCash >= 0 ? "+" : ""}
                {formatCurrency(cashFlowStatement.netInvestingCash)}
              </span>
            </div>
            <div className="flex items-center justify-between border-b py-3">
              <span className="font-medium text-purple-700">
                Net Financing Cash Flow
              </span>
              <span
                className={`font-medium ${
                  cashFlowStatement.netFinancingCash >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {cashFlowStatement.netFinancingCash >= 0 ? "+" : ""}
                {formatCurrency(cashFlowStatement.netFinancingCash)}
              </span>
            </div>
            <div className="flex items-center justify-between border-t-2 border-gray-800 pt-4">
              <span className="text-lg font-bold">
                NET INCREASE (DECREASE) IN CASH
              </span>
              <span
                className={`text-lg font-bold ${
                  cashFlowStatement.netCashFlow >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {cashFlowStatement.netCashFlow >= 0 ? "+" : ""}
                {formatCurrency(cashFlowStatement.netCashFlow)}
              </span>
            </div>
            <div className="flex items-center justify-between border-t-4 border-gray-800 pt-4">
              <span className="text-xl font-bold">ENDING CASH BALANCE</span>
              <span className="text-xl font-bold text-purple-600">
                {formatCurrency(cashFlowStatement.endingCash)}
              </span>
            </div>
          </div>

          {/* Cash Flow Insights */}
          <div className="mt-8 rounded-lg bg-gray-50 p-4">
            <h4 className="mb-3 font-semibold">Cash Flow Insights</h4>
            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
              <div>
                <p className="text-gray-600">Operating Cash Conversion</p>
                <p className="font-semibold">
                  {cashFlowStatement.netOperatingCash >= 0
                    ? "Positive"
                    : "Negative"}
                  <Badge
                    variant={
                      cashFlowStatement.netOperatingCash >= 0
                        ? "default"
                        : "destructive"
                    }
                    className="ml-2"
                  >
                    {cashFlowStatement.netOperatingCash >= 0
                      ? "Healthy"
                      : "Monitor"}
                  </Badge>
                </p>
              </div>
              <div>
                <p className="text-gray-600">Cash Position Change</p>
                <p className="font-semibold">
                  {(
                    (cashFlowStatement.netCashFlow /
                      Math.max(cashFlowStatement.beginningCash, 1)) *
                    100
                  ).toFixed(1)}
                  %
                  <Badge
                    variant={
                      cashFlowStatement.netCashFlow >= 0
                        ? "default"
                        : "secondary"
                    }
                    className="ml-2"
                  >
                    {cashFlowStatement.netCashFlow >= 0 ? "Growth" : "Decline"}
                  </Badge>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CashFlowReport;
