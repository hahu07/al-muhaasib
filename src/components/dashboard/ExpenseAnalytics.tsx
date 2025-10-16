import React from 'react';
import {
  CreditCardIcon,
  UsersIcon,
  WrenchIcon,
  FileTextIcon,
  UtensilsIcon,
  TruckIcon,
  MonitorIcon,
  PackageIcon,
  TrendingUpIcon,
  AlertTriangleIcon,
  ClockIcon,
} from 'lucide-react';
import { FinancialDashboardData, useFinancialFormatting } from '@/hooks/useFinancialDashboard';
import { ExpenseBreakdownChart } from './FinancialCharts';

interface ExpenseCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  amount: number;
  count: number;
  color: string;
  description: string;
  trend?: number;
}

interface ExpenseAnalyticsProps {
  data: FinancialDashboardData;
}

export function ExpenseAnalytics({ data }: ExpenseAnalyticsProps) {
  const { formatCurrency, formatNumber, formatPercentage } = useFinancialFormatting();

  // Icon mapping for expense categories
  const categoryIcons = {
    salaries: <UsersIcon className="w-5 h-5" />,
    feeding: <UtensilsIcon className="w-5 h-5" />,
    stationary: <FileTextIcon className="w-5 h-5" />,
    repair_and_maintenance: <WrenchIcon className="w-5 h-5" />,
    utilities: <MonitorIcon className="w-5 h-5" />,
    transport: <TruckIcon className="w-5 h-5" />,
    equipment: <MonitorIcon className="w-5 h-5" />,
    supplies: <PackageIcon className="w-5 h-5" />,
    marketing: <TrendingUpIcon className="w-5 h-5" />,
    other: <CreditCardIcon className="w-5 h-5" />,
  };

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

  const categoryDescriptions = {
    salaries: 'Staff compensation and benefits',
    feeding: 'Student meals and nutrition programs',
    stationary: 'Office supplies and materials',
    repair_and_maintenance: 'Facility maintenance and repairs',
    utilities: 'Electricity, water, and internet',
    transport: 'School transportation services',
    marketing: 'Promotional and marketing activities',
    equipment: 'Educational and office equipment',
    supplies: 'General supplies and consumables',
    other: 'Miscellaneous expenses',
  };

  const expenseCategories: ExpenseCategory[] = Object.entries(data.expenses.byCategory).map(([key, expense]) => ({
    id: key,
    name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    icon: categoryIcons[key as keyof typeof categoryIcons] || <CreditCardIcon className="w-5 h-5" />,
    amount: expense.amount,
    count: expense.count,
    color: categoryColors[key as keyof typeof categoryColors] || '#64748b',
    description: categoryDescriptions[key as keyof typeof categoryDescriptions] || 'General expenses',
    trend: Math.random() > 0.5 ? (Math.random() * 20 - 10) : undefined, // Mock trend data
  }));

  const totalExpenseCount = expenseCategories.reduce((sum, cat) => sum + cat.count, 0);
  const largestCategory = expenseCategories.reduce((max, cat) => cat.amount > max.amount ? cat : max, expenseCategories[0]);

  return (
    <div className="space-y-6">
      {/* Expense Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-red-50 text-red-600">
                  <CreditCardIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.expenses.totalExpenses)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm text-red-600 mt-2">
                <TrendingUpIcon className="w-4 h-4" />
                <span>5.2%</span>
                <span className="text-gray-500">vs last month</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">Total operational costs</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-yellow-50 text-yellow-600">
                  <ClockIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(data.expenses.pendingApprovals)}</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">Expenses awaiting approval</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <FileTextIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(totalExpenseCount)}</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">Number of expense records</p>
            </div>
          </div>
        </div>
      </div>

      {/* Expense Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {expenseCategories.map((category) => {
          const percentage = (category.amount / data.expenses.totalExpenses) * 100;
          
          return (
            <div key={category.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ 
                    backgroundColor: `${category.color}20`, 
                    color: category.color 
                  }}>
                    {category.icon}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{category.name}</h4>
                    <p className="text-xs text-gray-500">{category.description}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-lg font-bold text-gray-900">{formatCurrency(category.amount)}</span>
                  <span className="text-sm text-gray-500">{formatPercentage(percentage)}</span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: category.color,
                    }}
                  />
                </div>
                
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{formatNumber(category.count)} transactions</span>
                  {category.trend && (
                    <span className={category.trend > 0 ? 'text-red-500' : 'text-green-500'}>
                      {category.trend > 0 ? '+' : ''}{formatPercentage(category.trend)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Breakdown Chart */}
        <ExpenseBreakdownChart data={data} />

        {/* Top Spending Categories */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Spending Categories</h3>
          
          <div className="space-y-4">
            {expenseCategories
              .sort((a, b) => b.amount - a.amount)
              .slice(0, 5)
              .map((category, index) => (
                <div key={category.id} className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 font-semibold text-sm">
                    {index + 1}
                  </div>
                  
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-1 rounded" style={{ 
                      backgroundColor: `${category.color}20`, 
                      color: category.color 
                    }}>
                      {category.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{category.name}</p>
                      <p className="text-sm text-gray-500">{formatNumber(category.count)} transactions</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(category.amount)}</p>
                    <p className="text-sm text-gray-500">
                      {formatPercentage((category.amount / data.expenses.totalExpenses) * 100)}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Expense Insights */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Insights</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUpIcon className="w-5 h-5 text-blue-600" />
              </div>
              <h4 className="font-semibold text-blue-900">Highest Category</h4>
            </div>
            <p className="text-xl font-bold text-blue-600">{largestCategory?.name}</p>
            <p className="text-sm text-blue-700">
              {formatCurrency(largestCategory?.amount || 0)} ({formatPercentage((largestCategory?.amount || 0) / data.expenses.totalExpenses * 100)})
            </p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileTextIcon className="w-5 h-5 text-green-600" />
              </div>
              <h4 className="font-semibold text-green-900">Avg. per Transaction</h4>
            </div>
            <p className="text-xl font-bold text-green-600">
              {formatCurrency(data.expenses.totalExpenses / totalExpenseCount)}
            </p>
            <p className="text-sm text-green-700">Across all categories</p>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangleIcon className="w-5 h-5 text-yellow-600" />
              </div>
              <h4 className="font-semibold text-yellow-900">Pending Review</h4>
            </div>
            <p className="text-xl font-bold text-yellow-600">{formatNumber(data.expenses.pendingApprovals)}</p>
            <p className="text-sm text-yellow-700">Expenses need approval</p>
          </div>
        </div>
      </div>
    </div>
  );
}