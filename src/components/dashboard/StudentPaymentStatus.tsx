import React from 'react';
import {
  UsersIcon,
  CheckCircleIcon,
  ClockIcon,
  AlertTriangleIcon,
  DollarSignIcon,
  TrendingUpIcon,
  CalendarIcon,
  BookOpenIcon,
} from 'lucide-react';
import { FinancialDashboardData, useFinancialFormatting } from '@/hooks/useFinancialDashboard';
import { StudentPaymentStatusChart } from './FinancialCharts';

interface PaymentStatusMetric {
  status: 'paid' | 'partial' | 'pending' | 'overdue';
  label: string;
  count: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  description: string;
}

interface StudentPaymentStatusProps {
  data: FinancialDashboardData;
}

export function StudentPaymentStatus({ data }: StudentPaymentStatusProps) {
  const { formatNumber, formatPercentage, getPaymentStatusColor } = useFinancialFormatting();

  const paymentStatusMetrics: PaymentStatusMetric[] = [
    {
      status: 'paid',
      label: 'Fully Paid',
      count: data.students.paidStudents,
      icon: <CheckCircleIcon className="w-5 h-5" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Students with all fees paid',
    },
    {
      status: 'partial',
      label: 'Partially Paid',
      count: data.students.partialPaidStudents,
      icon: <DollarSignIcon className="w-5 h-5" />,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      description: 'Students with partial payments',
    },
    {
      status: 'pending',
      label: 'Pending Payment',
      count: data.students.unpaidStudents,
      icon: <ClockIcon className="w-5 h-5" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'Students yet to make payment',
    },
    {
      status: 'overdue',
      label: 'Overdue',
      count: data.students.overdueStudents,
      icon: <AlertTriangleIcon className="w-5 h-5" />,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description: 'Students with overdue payments',
    },
  ];

  const paidPercentage = (data.students.paidStudents / data.students.totalStudents) * 100;
  const overduePercentage = (data.students.overdueStudents / data.students.totalStudents) * 100;

  return (
    <div className="space-y-6">
      {/* Student Overview */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <UsersIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Student Payment Overview</h3>
              <p className="text-sm text-gray-500">Payment status across all enrolled students</p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900">{formatNumber(data.students.totalStudents)}</p>
            <p className="text-sm text-gray-500">Total Students</p>
          </div>
        </div>

        {/* Payment Status Progress Bars */}
        <div className="space-y-4">
          {paymentStatusMetrics.map((metric) => {
            const percentage = (metric.count / data.students.totalStudents) * 100;
            
            return (
              <div key={metric.status} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-1 rounded ${metric.bgColor} ${metric.color}`}>
                      {metric.icon}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{metric.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {formatNumber(metric.count)}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({formatPercentage(percentage)})
                    </span>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      metric.status === 'paid' ? 'bg-green-500' :
                      metric.status === 'partial' ? 'bg-yellow-500' :
                      metric.status === 'pending' ? 'bg-blue-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {paymentStatusMetrics.map((metric) => {
          const percentage = (metric.count / data.students.totalStudents) * 100;
          
          return (
            <div key={metric.status} className={`
              bg-white rounded-xl border-2 p-6 shadow-sm hover:shadow-md transition-shadow
              ${metric.status === 'overdue' && metric.count > 0 ? 'ring-2 ring-red-200 border-red-300' : 'border-gray-200'}
            `}>
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${metric.bgColor} ${metric.color}`}>
                  {metric.icon}
                </div>
                {metric.status === 'overdue' && metric.count > 0 && (
                  <div className="flex items-center justify-center w-6 h-6 bg-red-500 rounded-full">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                <p className="text-3xl font-bold text-gray-900">{formatNumber(metric.count)}</p>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${metric.color}`}>
                    {formatPercentage(percentage)}
                  </span>
                  <span className="text-sm text-gray-500">of all students</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">{metric.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Payment Status Chart */}
        <StudentPaymentStatusChart data={data} />

        {/* Payment Performance Metrics */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Performance</h3>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircleIcon className="w-8 h-8 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900">Collection Rate</p>
                  <p className="text-sm text-green-700">Students who paid in full</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">{formatPercentage(paidPercentage)}</p>
                <p className="text-sm text-green-500">Success rate</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertTriangleIcon className="w-8 h-8 text-red-600" />
                <div>
                  <p className="font-semibold text-red-900">At-Risk Students</p>
                  <p className="text-sm text-red-700">Students with overdue payments</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-red-600">{formatPercentage(overduePercentage)}</p>
                <p className="text-sm text-red-500">Need attention</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <TrendingUpIcon className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="font-semibold text-blue-900">Payment Progress</p>
                  <p className="text-sm text-blue-700">Students making payments</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">
                  {formatPercentage(((data.students.paidStudents + data.students.partialPaidStudents) / data.students.totalStudents) * 100)}
                </p>
                <p className="text-sm text-blue-500">Active payers</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Status Details */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Status Breakdown</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Count</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Percentage</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Action Required</th>
              </tr>
            </thead>
            <tbody>
              {paymentStatusMetrics.map((metric, index) => {
                const percentage = (metric.count / data.students.totalStudents) * 100;
                const actionRequired = 
                  metric.status === 'overdue' ? 'Send reminder notices' :
                  metric.status === 'pending' ? 'Follow up for payment' :
                  metric.status === 'partial' ? 'Request balance payment' :
                  'Monitor payment status';
                
                return (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-1 rounded ${metric.bgColor} ${metric.color}`}>
                          {metric.icon}
                        </div>
                        <span className="font-medium text-gray-900">{metric.label}</span>
                      </div>
                    </td>
                    <td className="text-right py-3 px-4 font-semibold text-gray-900">
                      {formatNumber(metric.count)}
                    </td>
                    <td className="text-right py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPaymentStatusColor(metric.status)}`}>
                        {formatPercentage(percentage)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{actionRequired}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="flex items-center gap-3 p-4 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
            <AlertTriangleIcon className="w-5 h-5 text-red-600" />
            <div className="text-left">
              <p className="font-semibold text-red-900">Send Overdue Notices</p>
              <p className="text-sm text-red-700">{formatNumber(data.students.overdueStudents)} students</p>
            </div>
          </button>
          
          <button className="flex items-center gap-3 p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors">
            <ClockIcon className="w-5 h-5 text-yellow-600" />
            <div className="text-left">
              <p className="font-semibold text-yellow-900">Payment Reminders</p>
              <p className="text-sm text-yellow-700">{formatNumber(data.students.unpaidStudents)} students</p>
            </div>
          </button>
          
          <button className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
            <CalendarIcon className="w-5 h-5 text-blue-600" />
            <div className="text-left">
              <p className="font-semibold text-blue-900">Payment Plans</p>
              <p className="text-sm text-blue-700">Setup installments</p>
            </div>
          </button>
          
          <button className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
            <BookOpenIcon className="w-5 h-5 text-green-600" />
            <div className="text-left">
              <p className="font-semibold text-green-900">Payment Report</p>
              <p className="text-sm text-green-700">Generate detailed report</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}