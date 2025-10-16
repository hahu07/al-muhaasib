import React from 'react';
import { FinancialDashboardData, useFinancialFormatting } from '@/hooks/useFinancialDashboard';

interface PieChartProps {
  data: Array<{ label: string; value: number; color: string }>;
  title: string;
  total?: number;
}

function PieChart({ data, title, total }: PieChartProps) {
  const { formatCurrency, formatPercentage } = useFinancialFormatting();
  
  const chartTotal = total || data.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercent = 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      
      <div className="flex flex-col lg:flex-row items-center gap-6">
        <div className="relative">
          <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90">
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="transparent"
              stroke="#f3f4f6"
              strokeWidth="40"
            />
            {data.map((item, index) => {
              const percent = (item.value / chartTotal) * 100;
              const circumference = 2 * Math.PI * 80;
              const strokeDasharray = `${(percent / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((cumulativePercent / 100) * circumference);
              
              cumulativePercent += percent;
              
              return (
                <circle
                  key={index}
                  cx="100"
                  cy="100"
                  r="80"
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth="40"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-300 hover:opacity-80"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(chartTotal)}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 space-y-3">
          {data.map((item, index) => {
            const percent = (item.value / chartTotal) * 100;
            return (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium text-gray-700">{item.label}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(item.value)}</p>
                  <p className="text-xs text-gray-500">{formatPercentage(percent)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface BarChartProps {
  data: Array<{ label: string; value: number; color?: string }>;
  title: string;
  horizontal?: boolean;
}

function BarChart({ data, title }: BarChartProps) {
  const { formatCurrency } = useFinancialFormatting();
  const maxValue = Math.max(...data.map(item => item.value));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      
      <div className="space-y-4">
        {data.map((item, index) => {
          const widthPercent = (item.value / maxValue) * 100;
          const color = item.color || '#3b82f6';
          
          return (
            <div key={index} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700">{item.label}</span>
                <span className="font-semibold text-gray-900">{formatCurrency(item.value)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="h-3 rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${widthPercent}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface ExpenseBreakdownChartProps {
  data: FinancialDashboardData;
}

export function ExpenseBreakdownChart({ data }: ExpenseBreakdownChartProps) {
  const categoryColors = {
    salaries: '#ef4444',
    feeding: '#f97316',
    stationary: '#eab308',
    repair_and_maintenance: '#84cc16',
    utilities: '#06b6d4',
    transport: '#8b5cf6',
    marketing: '#ec4899',
    equipment: '#10b981',
    supplies: '#6366f1',
    other: '#64748b',
  };

  const chartData = Object.entries(data.expenses.byCategory).map(([category, expense]) => ({
    label: category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: expense.amount,
    color: categoryColors[category as keyof typeof categoryColors] || '#64748b',
  }));

  return <PieChart data={chartData} title="Expenses by Category" />;
}

interface PaymentMethodChartProps {
  data: Record<string, { amount: number; count: number }>;
}

export function PaymentMethodChart({ data }: PaymentMethodChartProps) {
  const methodColors = {
    cash: '#10b981',
    bank_transfer: '#3b82f6',
    online: '#8b5cf6',
    card: '#f59e0b',
    cheque: '#64748b',
    mobile_money: '#06b6d4',
  };

  const chartData = Object.entries(data).map(([method, payment]) => ({
    label: method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: payment.amount,
    color: methodColors[method as keyof typeof methodColors] || '#64748b',
  }));

  return <PieChart data={chartData} title="Payment Methods" />;
}

interface AccountBalancesChartProps {
  data: FinancialDashboardData;
}

export function AccountBalancesChart({ data }: AccountBalancesChartProps) {
  const typeColors = {
    bank: '#3b82f6',
    cash: '#10b981',
    petty_cash: '#f59e0b',
    savings: '#8b5cf6',
    investment: '#ef4444',
    mobile_money: '#06b6d4',
  };

  const chartData = Object.entries(data.accounts.byType).map(([type, balance]) => ({
    label: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: balance,
    color: typeColors[type as keyof typeof typeColors] || '#64748b',
  }));

  return <BarChart data={chartData} title="Account Balances by Type" />;
}

interface StudentPaymentStatusChartProps {
  data: FinancialDashboardData;
}

export function StudentPaymentStatusChart({ data }: StudentPaymentStatusChartProps) {
  const statusData = [
    {
      label: 'Paid',
      value: data.students.paidStudents,
      color: '#10b981',
    },
    {
      label: 'Partial',
      value: data.students.partialPaidStudents,
      color: '#f59e0b',
    },
    {
      label: 'Pending',
      value: data.students.unpaidStudents,
      color: '#3b82f6',
    },
    {
      label: 'Overdue',
      value: data.students.overdueStudents,
      color: '#ef4444',
    },
  ];

  return <PieChart data={statusData} title="Student Payment Status" total={data.students.totalStudents} />;
}

interface MonthlyTrendChartProps {
  data: Array<{ month: string; revenue: number; expenses: number }>;
  title: string;
}

export function MonthlyTrendChart({ data, title }: MonthlyTrendChartProps) {
  const { formatCurrency } = useFinancialFormatting();
  const maxValue = Math.max(
    ...data.flatMap(item => [item.revenue, item.expenses])
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      
      <div className="space-y-6">
        {data.map((item, index) => (
          <div key={index} className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">{item.month}</h4>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-green-600">Revenue</span>
                <span className="font-semibold">{formatCurrency(item.revenue)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 bg-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${(item.revenue / maxValue) * 100}%` }}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-red-600">Expenses</span>
                <span className="font-semibold">{formatCurrency(item.expenses)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 bg-red-500 rounded-full transition-all duration-500"
                  style={{ width: `${(item.expenses / maxValue) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}