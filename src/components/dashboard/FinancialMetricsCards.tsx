import React from "react";
import {
  DollarSignIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  PiggyBankIcon,
  CreditCardIcon,
  AlertTriangleIcon,
  UsersIcon,
  CalendarIcon,
} from "lucide-react";
import {
  FinancialDashboardData,
  useFinancialFormatting,
} from "@/hooks/useFinancialDashboard";

interface MetricCardProps {
  title: string;
  value: string;
  change?: number;
  changeType?: "increase" | "decrease" | "neutral";
  icon: React.ReactNode;
  description?: string;
  alert?: boolean;
  color?: "blue" | "green" | "red" | "yellow" | "purple" | "indigo";
}

function MetricCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon,
  description,
  alert = false,
  color = "blue",
}: MetricCardProps) {
  const { formatPercentage, getTrendColor } = useFinancialFormatting();

  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 text-blue-600",
    green: "bg-green-50 border-green-200 text-green-600",
    red: "bg-red-50 border-red-200 text-red-600",
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-600",
    purple: "bg-purple-50 border-purple-200 text-purple-600",
    indigo: "bg-indigo-50 border-indigo-200 text-indigo-600",
  };

  const TrendIcon =
    changeType === "increase"
      ? TrendingUpIcon
      : changeType === "decrease"
        ? TrendingDownIcon
        : null;

  return (
    <div
      className={`relative rounded-xl border-2 bg-white p-6 shadow-sm transition-shadow hover:shadow-md ${alert ? "border-red-300 ring-2 ring-red-200" : "border-gray-200"} `}
    >
      {alert && (
        <div className="absolute -top-2 -right-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500">
            <AlertTriangleIcon className="h-4 w-4 text-white" />
          </div>
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="mb-1 text-sm font-medium text-gray-600">{title}</p>
          <p className="mb-2 text-3xl font-bold text-gray-900">{value}</p>

          {change !== undefined && (
            <div
              className={`flex items-center gap-1 text-sm ${getTrendColor(change)}`}
            >
              {TrendIcon && <TrendIcon className="h-4 w-4" />}
              <span>{formatPercentage(Math.abs(change))}</span>
              <span className="text-gray-500">vs last period</span>
            </div>
          )}

          {description && (
            <p className="mt-2 text-sm text-gray-500">{description}</p>
          )}
        </div>

        <div className={`rounded-lg p-3 ${colorClasses[color]}`}>{icon}</div>
      </div>
    </div>
  );
}

interface FinancialMetricsCardsProps {
  data: FinancialDashboardData;
}

export function FinancialMetricsCards({ data }: FinancialMetricsCardsProps) {
  const { formatCurrency, formatNumber, formatPercentage } =
    useFinancialFormatting();

  const metrics = [
    {
      title: "Total Revenue",
      value: formatCurrency(data.revenue.totalCollected),
      change: 8.5,
      changeType: "increase" as const,
      icon: <DollarSignIcon className="h-6 w-6" />,
      description: "Collected fees and payments",
      color: "green" as const,
    },
    {
      title: "Total Expenses",
      value: formatCurrency(data.expenses.totalExpenses),
      change: 3.2,
      changeType: "increase" as const,
      icon: <CreditCardIcon className="h-6 w-6" />,
      description: "Operating and administrative costs",
      color: "red" as const,
    },
    {
      title: "Net Profit",
      value: formatCurrency(data.profitLoss.netProfit),
      change: data.profitLoss.profitMargin,
      changeType:
        data.profitLoss.netProfit >= 0
          ? ("increase" as const)
          : ("decrease" as const),
      icon: <TrendingUpIcon className="h-6 w-6" />,
      description: `${formatPercentage(data.profitLoss.profitMargin)} profit margin`,
      color:
        data.profitLoss.netProfit >= 0 ? ("green" as const) : ("red" as const),
    },
    {
      title: "Cash Balance",
      value: formatCurrency(data.accounts.totalBalance),
      icon: <PiggyBankIcon className="h-6 w-6" />,
      description: "Available across all accounts",
      color: "blue" as const,
      alert: data.alerts.lowBalanceAccounts > 0,
    },
    {
      title: "Pending Payments",
      value: formatCurrency(data.revenue.totalPending),
      icon: <CalendarIcon className="h-6 w-6" />,
      description: "Outstanding student fees",
      color: "yellow" as const,
      alert: data.revenue.totalOverdue > 0,
    },
    {
      title: "Students Enrolled",
      value: formatNumber(data.students.totalStudents),
      icon: <UsersIcon className="h-6 w-6" />,
      description: `${data.students.paidStudents} paid, ${data.students.overdueStudents} overdue`,
      color: "purple" as const,
      alert: data.students.overdueStudents > 10,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {metrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  );
}

// Quick stats summary component
interface QuickStatsProps {
  data: FinancialDashboardData;
}

export function QuickStats({ data }: QuickStatsProps) {
  const { formatCurrency, formatNumber } = useFinancialFormatting();

  const stats = [
    {
      label: "Overdue Invoices",
      value: formatNumber(data.alerts.overdueInvoices),
      color: "text-red-600",
    },
    {
      label: "Pending Expenses",
      value: formatNumber(data.alerts.pendingExpenses),
      color: "text-yellow-600",
    },
    {
      label: "Scholarship Budget Used",
      value: formatCurrency(data.scholarships.usedBudget),
      color: "text-purple-600",
    },
    {
      label: "Active Accounts",
      value: formatNumber(Object.keys(data.accounts.byType).length),
      color: "text-blue-600",
    },
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">Quick Stats</h3>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <div key={index} className="text-center">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-sm text-gray-600">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
