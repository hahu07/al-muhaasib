import React from "react";
import {
  DollarSignIcon,
  CreditCardIcon,
  TrendingUpIcon,
  ClockIcon,
  CheckCircleIcon,
  AlertCircleIcon,
} from "lucide-react";
import {
  FinancialDashboardData,
  useFinancialFormatting,
} from "@/hooks/useFinancialDashboard";
import { PaymentMethodChart } from "./FinancialCharts";

interface RevenueMetric {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  description?: string;
  trend?: number;
}

interface RevenueAnalyticsProps {
  data: FinancialDashboardData;
  paymentMethods?: Record<string, { amount: number; count: number }>;
}

export function RevenueAnalytics({
  data,
  paymentMethods = {},
}: RevenueAnalyticsProps) {
  const { formatCurrency, formatPercentage } = useFinancialFormatting();

  const revenueMetrics: RevenueMetric[] = [
    {
      label: "Total Collected",
      value: data.revenue.totalCollected,
      icon: <DollarSignIcon className="h-5 w-5" />,
      color: "bg-green-50 text-green-600 border-green-200",
      description: "Total revenue collected",
      trend: 12.5,
    },
    {
      label: "Pending Collection",
      value: data.revenue.totalPending,
      icon: <ClockIcon className="h-5 w-5" />,
      color: "bg-yellow-50 text-yellow-600 border-yellow-200",
      description: "Outstanding payments",
      trend: -5.2,
    },
    {
      label: "Overdue Amount",
      value: data.revenue.totalOverdue,
      icon: <AlertCircleIcon className="h-5 w-5" />,
      color: "bg-red-50 text-red-600 border-red-200",
      description: "Past due collections",
      trend: -8.1,
    },
  ];

  const collectionRate =
    (data.revenue.totalCollected /
      (data.revenue.totalCollected +
        data.revenue.totalPending +
        data.revenue.totalOverdue)) *
    100;

  return (
    <div className="space-y-6">
      {/* Revenue Overview Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {revenueMetrics.map((metric, index) => (
          <div
            key={index}
            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-3">
                  <div className={`rounded-lg p-2 ${metric.color}`}>
                    {metric.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {metric.label}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(metric.value)}
                    </p>
                  </div>
                </div>

                {metric.trend && (
                  <div
                    className={`mt-2 flex items-center gap-1 text-sm ${
                      metric.trend > 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    <TrendingUpIcon
                      className={`h-4 w-4 ${metric.trend < 0 ? "rotate-180" : ""}`}
                    />
                    <span>{formatPercentage(Math.abs(metric.trend))}</span>
                    <span className="text-gray-500">vs last month</span>
                  </div>
                )}

                {metric.description && (
                  <p className="mt-2 text-sm text-gray-500">
                    {metric.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Collection Rate Progress */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Collection Performance
          </h3>
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-600">
              {formatPercentage(collectionRate)} Collection Rate
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <div className="mb-2 flex justify-between text-sm">
              <span>Revenue Collection Progress</span>
              <span className="font-semibold">
                {formatCurrency(data.revenue.totalCollected)} /{" "}
                {formatCurrency(
                  data.revenue.totalCollected +
                    data.revenue.totalPending +
                    data.revenue.totalOverdue,
                )}
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-gray-200">
              <div
                className="h-3 rounded-full bg-green-500 transition-all duration-500"
                style={{ width: `${Math.min(collectionRate, 100)}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600">Collected</p>
              <p className="font-semibold text-green-600">
                {formatPercentage(
                  (data.revenue.totalCollected /
                    (data.revenue.totalCollected +
                      data.revenue.totalPending +
                      data.revenue.totalOverdue)) *
                    100,
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="font-semibold text-yellow-600">
                {formatPercentage(
                  (data.revenue.totalPending /
                    (data.revenue.totalCollected +
                      data.revenue.totalPending +
                      data.revenue.totalOverdue)) *
                    100,
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Overdue</p>
              <p className="font-semibold text-red-600">
                {formatPercentage(
                  (data.revenue.totalOverdue /
                    (data.revenue.totalCollected +
                      data.revenue.totalPending +
                      data.revenue.totalOverdue)) *
                    100,
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Payment Methods Chart */}
        {Object.keys(paymentMethods).length > 0 && (
          <PaymentMethodChart data={paymentMethods} />
        )}

        {/* Monthly Revenue Trend */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Monthly Revenue Trend
          </h3>

          {data.revenue.monthlyTrend.length > 0 ? (
            <div className="space-y-3">
              {data.revenue.monthlyTrend.slice(-6).map((month, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {month.month}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-32 rounded-full bg-gray-200">
                      <div
                        className="h-2 rounded-full bg-blue-500"
                        style={{
                          width: `${(month.amount / Math.max(...data.revenue.monthlyTrend.map((m) => m.amount))) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="w-20 text-right text-sm font-semibold text-gray-900">
                      {formatCurrency(month.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <TrendingUpIcon className="mx-auto mb-2 h-12 w-12 text-gray-400" />
              <p className="text-gray-500">
                Monthly trend data will appear here
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Revenue Sources Breakdown */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Revenue Sources
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-blue-50 p-4 text-center">
            <CreditCardIcon className="mx-auto mb-2 h-8 w-8 text-blue-600" />
            <p className="mb-1 text-sm text-gray-600">Tuition Fees</p>
            <p className="text-xl font-bold text-blue-600">
              {formatCurrency(data.revenue.totalCollected * 0.8)}
            </p>
            <p className="text-xs text-gray-500">80% of revenue</p>
          </div>

          <div className="rounded-lg bg-green-50 p-4 text-center">
            <DollarSignIcon className="mx-auto mb-2 h-8 w-8 text-green-600" />
            <p className="mb-1 text-sm text-gray-600">Registration Fees</p>
            <p className="text-xl font-bold text-green-600">
              {formatCurrency(data.revenue.totalCollected * 0.1)}
            </p>
            <p className="text-xs text-gray-500">10% of revenue</p>
          </div>

          <div className="rounded-lg bg-purple-50 p-4 text-center">
            <CheckCircleIcon className="mx-auto mb-2 h-8 w-8 text-purple-600" />
            <p className="mb-1 text-sm text-gray-600">Activity Fees</p>
            <p className="text-xl font-bold text-purple-600">
              {formatCurrency(data.revenue.totalCollected * 0.07)}
            </p>
            <p className="text-xs text-gray-500">7% of revenue</p>
          </div>

          <div className="rounded-lg bg-yellow-50 p-4 text-center">
            <AlertCircleIcon className="mx-auto mb-2 h-8 w-8 text-yellow-600" />
            <p className="mb-1 text-sm text-gray-600">Other Fees</p>
            <p className="text-xl font-bold text-yellow-600">
              {formatCurrency(data.revenue.totalCollected * 0.03)}
            </p>
            <p className="text-xs text-gray-500">3% of revenue</p>
          </div>
        </div>
      </div>
    </div>
  );
}
