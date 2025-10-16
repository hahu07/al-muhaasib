import React from 'react';
import {
  AlertTriangleIcon,
  AlertCircleIcon,
  InfoIcon,
  CheckCircleIcon,
  BellIcon,
  XCircleIcon,
  TrendingDownIcon,
  DollarSignIcon,
  ClockIcon,
  UserXIcon,
} from 'lucide-react';
import { FinancialDashboardData, useFinancialFormatting } from '@/hooks/useFinancialDashboard';

type AlertType = 'critical' | 'warning' | 'info' | 'success';
type AlertCategory = 'payment' | 'expense' | 'account' | 'budget' | 'system';

interface Alert {
  id: string;
  type: AlertType;
  category: AlertCategory;
  title: string;
  message: string;
  count?: number;
  amount?: number;
  icon: React.ReactNode;
  timestamp: Date;
  actionRequired: string;
  priority: number; // 1-5, 1 being highest priority
}

interface FinancialAlertsProps {
  data: FinancialDashboardData;
}

export function FinancialAlerts({ data }: FinancialAlertsProps) {
  const { formatCurrency, formatNumber } = useFinancialFormatting();

  // Generate alerts based on financial data
  const generateAlerts = (): Alert[] => {
    const alerts: Alert[] = [];

    // Critical Alerts
    if (data.alerts.overdueInvoices > 0) {
      alerts.push({
        id: 'overdue-invoices',
        type: 'critical',
        category: 'payment',
        title: 'Overdue Invoices',
        message: `${data.alerts.overdueInvoices} invoices are past due and require immediate attention.`,
        count: data.alerts.overdueInvoices,
        icon: <AlertTriangleIcon className="w-5 h-5" />,
        timestamp: new Date(),
        actionRequired: 'Send payment reminders and follow up with students',
        priority: 1,
      });
    }

    if (data.alerts.lowBalanceAccounts > 0) {
      alerts.push({
        id: 'low-balance',
        type: 'critical',
        category: 'account',
        title: 'Low Account Balances',
        message: `${data.alerts.lowBalanceAccounts} accounts have critically low balances.`,
        count: data.alerts.lowBalanceAccounts,
        icon: <TrendingDownIcon className="w-5 h-5" />,
        timestamp: new Date(),
        actionRequired: 'Review cash flow and consider fund transfer',
        priority: 1,
      });
    }

    if (data.students.overdueStudents > (data.students.totalStudents * 0.15)) {
      alerts.push({
        id: 'high-overdue-rate',
        type: 'critical',
        category: 'payment',
        title: 'High Overdue Payment Rate',
        message: `${data.students.overdueStudents} students (${((data.students.overdueStudents / data.students.totalStudents) * 100).toFixed(1)}%) have overdue payments.`,
        count: data.students.overdueStudents,
        icon: <UserXIcon className="w-5 h-5" />,
        timestamp: new Date(),
        actionRequired: 'Implement payment collection strategy',
        priority: 2,
      });
    }

    // Warning Alerts
    if (data.alerts.pendingExpenses > 10) {
      alerts.push({
        id: 'pending-expenses',
        type: 'warning',
        category: 'expense',
        title: 'Pending Expense Approvals',
        message: `${data.alerts.pendingExpenses} expenses are awaiting approval.`,
        count: data.alerts.pendingExpenses,
        icon: <ClockIcon className="w-5 h-5" />,
        timestamp: new Date(),
        actionRequired: 'Review and approve pending expenses',
        priority: 3,
      });
    }

    if (data.alerts.scholarshipBudgetAlerts > 0) {
      alerts.push({
        id: 'scholarship-budget',
        type: 'warning',
        category: 'budget',
        title: 'Scholarship Budget Alert',
        message: 'Scholarship budget is running low and may need replenishment.',
        amount: data.scholarships.totalBudget - data.scholarships.usedBudget,
        icon: <DollarSignIcon className="w-5 h-5" />,
        timestamp: new Date(),
        actionRequired: 'Review scholarship allocations and budget',
        priority: 3,
      });
    }

    if (data.profitLoss.profitMargin < 5) {
      alerts.push({
        id: 'low-profit-margin',
        type: 'warning',
        category: 'budget',
        title: 'Low Profit Margin',
        message: `Current profit margin is ${data.profitLoss.profitMargin.toFixed(1)}%, below recommended threshold.`,
        amount: data.profitLoss.netProfit,
        icon: <TrendingDownIcon className="w-5 h-5" />,
        timestamp: new Date(),
        actionRequired: 'Review expenses and revenue optimization',
        priority: 2,
      });
    }

    // Info Alerts
    if (data.students.partialPaidStudents > 0) {
      alerts.push({
        id: 'partial-payments',
        type: 'info',
        category: 'payment',
        title: 'Partial Payments',
        message: `${data.students.partialPaidStudents} students have made partial payments.`,
        count: data.students.partialPaidStudents,
        icon: <InfoIcon className="w-5 h-5" />,
        timestamp: new Date(),
        actionRequired: 'Send balance payment reminders',
        priority: 4,
      });
    }

    // Success Alerts
    if ((data.students.paidStudents / data.students.totalStudents) * 100 >= 80) {
      alerts.push({
        id: 'good-collection-rate',
        type: 'success',
        category: 'payment',
        title: 'Excellent Collection Rate',
        message: `${((data.students.paidStudents / data.students.totalStudents) * 100).toFixed(1)}% of students have paid their fees in full.`,
        count: data.students.paidStudents,
        icon: <CheckCircleIcon className="w-5 h-5" />,
        timestamp: new Date(),
        actionRequired: 'Continue monitoring payment trends',
        priority: 5,
      });
    }

    return alerts.sort((a, b) => a.priority - b.priority);
  };

  const alerts = generateAlerts();
  const criticalAlerts = alerts.filter(alert => alert.type === 'critical');
  const warningAlerts = alerts.filter(alert => alert.type === 'warning');

  const getAlertStyles = (type: AlertType) => {
    const styles = {
      critical: {
        container: 'bg-red-50 border-red-200 text-red-800',
        icon: 'text-red-600',
        badge: 'bg-red-100 text-red-800',
      },
      warning: {
        container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        icon: 'text-yellow-600',
        badge: 'bg-yellow-100 text-yellow-800',
      },
      info: {
        container: 'bg-blue-50 border-blue-200 text-blue-800',
        icon: 'text-blue-600',
        badge: 'bg-blue-100 text-blue-800',
      },
      success: {
        container: 'bg-green-50 border-green-200 text-green-800',
        icon: 'text-green-600',
        badge: 'bg-green-100 text-green-800',
      },
    };
    return styles[type];
  };

  const getCategoryLabel = (category: AlertCategory) => {
    const labels = {
      payment: 'Payment',
      expense: 'Expense',
      account: 'Account',
      budget: 'Budget',
      system: 'System',
    };
    return labels[category];
  };

  return (
    <div className="space-y-6">
      {/* Alert Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <BellIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Financial Alerts</h3>
              <p className="text-sm text-gray-500">
                {alerts.length} total alerts • {criticalAlerts.length} critical • {warningAlerts.length} warnings
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">{criticalAlerts.length}</p>
            <p className="text-sm text-red-700">Critical</p>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">{warningAlerts.length}</p>
            <p className="text-sm text-yellow-700">Warnings</p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">
              {alerts.filter(a => a.type === 'info').length}
            </p>
            <p className="text-sm text-blue-700">Info</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">
              {alerts.filter(a => a.type === 'success').length}
            </p>
            <p className="text-sm text-green-700">Success</p>
          </div>
        </div>
      </div>

      {/* Alert List */}
      <div className="space-y-4">
        {alerts.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm text-center">
            <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">All Clear!</h3>
            <p className="text-gray-600">No financial alerts at the moment. Everything looks good!</p>
          </div>
        ) : (
          alerts.map((alert) => {
            const styles = getAlertStyles(alert.type);
            
            return (
              <div
                key={alert.id}
                className={`
                  rounded-xl border-2 p-6 shadow-sm transition-all duration-200 hover:shadow-md
                  ${styles.container}
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-2 rounded-lg bg-white/50 ${styles.icon}`}>
                      {alert.icon}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-lg">{alert.title}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles.badge}`}>
                          {getCategoryLabel(alert.category)}
                        </span>
                        {alert.type === 'critical' && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-600 text-white">
                            URGENT
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm mb-3 opacity-90">{alert.message}</p>
                      
                      <div className="flex items-center gap-4 text-sm">
                        {alert.count && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Count:</span>
                            <span>{formatNumber(alert.count)}</span>
                          </div>
                        )}
                        {alert.amount && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Amount:</span>
                            <span>{formatCurrency(alert.amount)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Priority:</span>
                          <span>
                            {'★'.repeat(6 - alert.priority)}
                            {'☆'.repeat(alert.priority - 1)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-3 p-3 bg-white/30 rounded-lg">
                        <p className="text-sm font-medium mb-1">Action Required:</p>
                        <p className="text-sm opacity-90">{alert.actionRequired}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <button className="p-2 rounded-lg bg-white/50 hover:bg-white/70 transition-colors">
                      <XCircleIcon className="w-4 h-4" />
                    </button>
                    <p className="text-xs opacity-70">
                      {alert.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Alert Actions */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {criticalAlerts.length > 0 && (
              <button className="flex items-center gap-3 p-4 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200">
                <AlertTriangleIcon className="w-5 h-5 text-red-600" />
                <div className="text-left">
                  <p className="font-semibold text-red-900">Address Critical Issues</p>
                  <p className="text-sm text-red-700">{criticalAlerts.length} items need attention</p>
                </div>
              </button>
            )}
            
            {warningAlerts.length > 0 && (
              <button className="flex items-center gap-3 p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors border border-yellow-200">
                <AlertCircleIcon className="w-5 h-5 text-yellow-600" />
                <div className="text-left">
                  <p className="font-semibold text-yellow-900">Review Warnings</p>
                  <p className="text-sm text-yellow-700">{warningAlerts.length} items to review</p>
                </div>
              </button>
            )}
            
            <button className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200">
              <InfoIcon className="w-5 h-5 text-blue-600" />
              <div className="text-left">
                <p className="font-semibold text-blue-900">Generate Report</p>
                <p className="text-sm text-blue-700">Export all alerts</p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}