import React from 'react';
import { 
  DollarSignIcon, 
  CreditCardIcon, 
  TrendingUpIcon, 
  ClockIcon,
  CheckCircleIcon,
  AlertCircleIcon 
} from 'lucide-react';
import { FinancialDashboardData, useFinancialFormatting } from '@/hooks/useFinancialDashboard';
import { PaymentMethodChart } from './FinancialCharts';

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

export function RevenueAnalytics({ data, paymentMethods = {} }: RevenueAnalyticsProps) {
  const { formatCurrency, formatPercentage } = useFinancialFormatting();

  const revenueMetrics: RevenueMetric[] = [
    {
      label: 'Total Collected',
      value: data.revenue.totalCollected,
      icon: <DollarSignIcon className="w-5 h-5" />,
      color: 'bg-green-50 text-green-600 border-green-200',
      description: 'Total revenue collected',
      trend: 12.5,
    },
    {
      label: 'Pending Collection',
      value: data.revenue.totalPending,
      icon: <ClockIcon className="w-5 h-5" />,
      color: 'bg-yellow-50 text-yellow-600 border-yellow-200',
      description: 'Outstanding payments',
      trend: -5.2,
    },
    {
      label: 'Overdue Amount',
      value: data.revenue.totalOverdue,
      icon: <AlertCircleIcon className="w-5 h-5" />,
      color: 'bg-red-50 text-red-600 border-red-200',
      description: 'Past due collections',
      trend: -8.1,
    },
  ];

  const collectionRate = data.revenue.totalCollected / 
    (data.revenue.totalCollected + data.revenue.totalPending + data.revenue.totalOverdue) * 100;

  return (
    <div className="space-y-6">
      {/* Revenue Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {revenueMetrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${metric.color}`}>
                    {metric.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(metric.value)}</p>
                  </div>
                </div>
                
                {metric.trend && (
                  <div className={`flex items-center gap-1 text-sm mt-2 ${
                    metric.trend > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <TrendingUpIcon className={`w-4 h-4 ${metric.trend < 0 ? 'rotate-180' : ''}`} />
                    <span>{formatPercentage(Math.abs(metric.trend))}</span>
                    <span className="text-gray-500">vs last month</span>
                  </div>
                )}
                
                {metric.description && (
                  <p className="text-sm text-gray-500 mt-2">{metric.description}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Collection Rate Progress */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Collection Performance</h3>
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-600">
              {formatPercentage(collectionRate)} Collection Rate
            </span>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="relative">
            <div className="flex justify-between text-sm mb-2">
              <span>Revenue Collection Progress</span>
              <span className="font-semibold">
                {formatCurrency(data.revenue.totalCollected)} / {formatCurrency(
                  data.revenue.totalCollected + data.revenue.totalPending + data.revenue.totalOverdue
                )}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="h-3 bg-green-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(collectionRate, 100)}%` }}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600">Collected</p>
              <p className="font-semibold text-green-600">
                {formatPercentage((data.revenue.totalCollected / 
                  (data.revenue.totalCollected + data.revenue.totalPending + data.revenue.totalOverdue)) * 100)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="font-semibold text-yellow-600">
                {formatPercentage((data.revenue.totalPending / 
                  (data.revenue.totalCollected + data.revenue.totalPending + data.revenue.totalOverdue)) * 100)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Overdue</p>
              <p className="font-semibold text-red-600">
                {formatPercentage((data.revenue.totalOverdue / 
                  (data.revenue.totalCollected + data.revenue.totalPending + data.revenue.totalOverdue)) * 100)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods Chart */}
        {Object.keys(paymentMethods).length > 0 && (
          <PaymentMethodChart data={paymentMethods} />
        )}

        {/* Monthly Revenue Trend */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue Trend</h3>
          
          {data.revenue.monthlyTrend.length > 0 ? (
            <div className="space-y-3">
              {data.revenue.monthlyTrend.slice(-6).map((month, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{month.month}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 bg-blue-500 rounded-full"
                        style={{
                          width: `${(month.amount / Math.max(...data.revenue.monthlyTrend.map(m => m.amount))) * 100}%`
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-20 text-right">
                      {formatCurrency(month.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <TrendingUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Monthly trend data will appear here</p>
            </div>
          )}
        </div>
      </div>

      {/* Revenue Sources Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Sources</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <CreditCardIcon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-1">Tuition Fees</p>
            <p className="text-xl font-bold text-blue-600">
              {formatCurrency(data.revenue.totalCollected * 0.8)}
            </p>
            <p className="text-xs text-gray-500">80% of revenue</p>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <DollarSignIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-1">Registration Fees</p>
            <p className="text-xl font-bold text-green-600">
              {formatCurrency(data.revenue.totalCollected * 0.1)}
            </p>
            <p className="text-xs text-gray-500">10% of revenue</p>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <CheckCircleIcon className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-1">Activity Fees</p>
            <p className="text-xl font-bold text-purple-600">
              {formatCurrency(data.revenue.totalCollected * 0.07)}
            </p>
            <p className="text-xs text-gray-500">7% of revenue</p>
          </div>
          
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <AlertCircleIcon className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-1">Other Fees</p>
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