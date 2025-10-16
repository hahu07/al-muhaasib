'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ExpenseRecordingForm } from './ExpenseRecordingForm';
import { ExpenseList } from './ExpenseList';
import { ExpenseCategoryManager } from './ExpenseCategoryManager';
import { ExpenseApprovalDashboard } from './ExpenseApprovalDashboard';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { expenseService } from '@/services';
import { useAuth } from '@/contexts/AuthContext';
import type { Expense } from '@/types';
import {
  DollarSignIcon,
  PlusIcon,
  ListIcon,
  SettingsIcon,
  TrendingUpIcon,
  ClockIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ArrowLeftIcon,
  FileTextIcon,
  BarChartIcon,
  CheckSquareIcon,
} from 'lucide-react';

type ActiveTab = 'overview' | 'record' | 'list' | 'categories' | 'approvals';

export const ExpenseManagement: React.FC = () => {
  const router = useRouter();
  const { appUser } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const data = await expenseService.list();
      setExpenses(data);
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordSuccess = (expenseId: string) => {
    setShowRecordModal(false);
    loadExpenses(); // Reload expenses
    // Show success message
    alert('Expense recorded successfully!');
  };

  const handleExpenseSelect = (expense: Expense) => {
    setSelectedExpense(expense);
    // You could open a detailed view modal here
  };

  // Calculate summary statistics
  const getExpenseSummary = () => {
    const pending = expenses.filter(e => e.status === 'pending');
    const approved = expenses.filter(e => e.status === 'approved');
    const paid = expenses.filter(e => e.status === 'paid');
    const rejected = expenses.filter(e => e.status === 'rejected');

    const totalPending = pending.reduce((sum, e) => sum + e.amount, 0);
    const totalApproved = approved.reduce((sum, e) => sum + e.amount, 0);
    const totalPaid = paid.reduce((sum, e) => sum + e.amount, 0);

    return {
      totalExpenses: expenses.length,
      pendingCount: pending.length,
      approvedCount: approved.length,
      paidCount: paid.length,
      rejectedCount: rejected.length,
      totalPending,
      totalApproved,
      totalPaid,
    };
  };

  const summary = getExpenseSummary();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <BarChartIcon className="w-4 h-4" /> },
    { id: 'record', label: 'Record Expense', icon: <PlusIcon className="w-4 h-4" /> },
    { id: 'list', label: 'Expense List', icon: <ListIcon className="w-4 h-4" /> },
    ...(appUser?.role === 'admin' ? [
      { id: 'approvals', label: 'Approvals', icon: <CheckSquareIcon className="w-4 h-4" /> },
      { id: 'categories', label: 'Categories', icon: <SettingsIcon className="w-4 h-4" /> }
    ] : []),
  ] as const;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => router.push('/')}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Expense Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Record, track, and manage school expenses
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-9">
          {/* Quick Approval Access for Admins */}
          {appUser?.role === 'admin' && summary.pendingCount > 0 && (
            <Button 
              onClick={() => setActiveTab('approvals')} 
              variant="outline"
              className="border-yellow-300 text-yellow-700 hover:bg-yellow-50 dark:border-yellow-600 dark:text-yellow-400 dark:hover:bg-yellow-900/20"
            >
              <CheckSquareIcon className="w-4 h-4 mr-2" />
              {summary.pendingCount} Pending
            </Button>
          )}
          
          <Button onClick={() => setShowRecordModal(true)} variant="primary">
            <PlusIcon className="w-4 h-4 mr-2" />
            Record Expense
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Total Expenses
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {summary.totalExpenses}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <FileTextIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>

              <div 
                className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-all ${
                  appUser?.role === 'admin' && summary.pendingCount > 0
                    ? 'cursor-pointer hover:shadow-md hover:border-yellow-300 dark:hover:border-yellow-600'
                    : ''
                }`}
                onClick={() => {
                  if (appUser?.role === 'admin' && summary.pendingCount > 0) {
                    setActiveTab('approvals');
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Pending Approval
                      {appUser?.role === 'admin' && summary.pendingCount > 0 && (
                        <span className="ml-2 text-xs text-yellow-600 dark:text-yellow-400">
                          (Click to review)
                        </span>
                      )}
                    </p>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {summary.pendingCount}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatCurrency(summary.totalPending)}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                    <ClockIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Approved
                    </p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {summary.approvedCount}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatCurrency(summary.totalApproved)}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <CheckCircleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Paid
                    </p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {summary.paidCount}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatCurrency(summary.totalPaid)}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <DollarSignIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Expenses */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Recent Expenses
                </h3>
              </div>
              <div className="p-6">
                <ExpenseList 
                  onExpenseSelect={handleExpenseSelect}
                  showActions={appUser?.role === 'admin'}
                  className="mt-0"
                />
              </div>
            </div>

            {/* Quick Actions */}
            {summary.pendingCount > 0 && appUser?.role === 'admin' && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertCircleIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <div>
                      <p className="font-medium text-amber-800 dark:text-amber-300">
                        Action Required
                      </p>
                      <p className="text-sm text-amber-700 dark:text-amber-400">
                        {summary.pendingCount} expense{summary.pendingCount !== 1 ? 's' : ''} awaiting approval
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setActiveTab('approvals')}
                    variant="outline"
                    className="border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-600 dark:text-amber-400 dark:hover:bg-amber-900/30"
                  >
                    <CheckSquareIcon className="w-4 h-4 mr-2" />
                    Review & Approve
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'record' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <ExpenseRecordingForm 
              onSuccess={handleRecordSuccess}
            />
          </div>
        )}

        {activeTab === 'list' && (
          <ExpenseList 
            onExpenseSelect={handleExpenseSelect}
            showActions={appUser?.role === 'admin'}
          />
        )}

        {activeTab === 'approvals' && appUser?.role === 'admin' && (
          <ExpenseApprovalDashboard />
        )}

        {activeTab === 'categories' && appUser?.role === 'admin' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <ExpenseCategoryManager />
          </div>
        )}
      </div>

      {/* Record Expense Modal */}
      {showRecordModal && (
        <Modal
          isOpen={showRecordModal}
          onClose={() => setShowRecordModal(false)}
          title="Record New Expense"
          size="lg"
        >
          <ExpenseRecordingForm 
            onSuccess={handleRecordSuccess}
            onCancel={() => setShowRecordModal(false)}
          />
        </Modal>
      )}

      {/* Expense Details Modal */}
      {selectedExpense && (
        <Modal
          isOpen={!!selectedExpense}
          onClose={() => setSelectedExpense(null)}
          title="Expense Details"
          size="md"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Reference
                </label>
                <p className="text-gray-900 dark:text-gray-100">
                  {selectedExpense.reference}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Category
                </label>
                <p className="text-gray-900 dark:text-gray-100">
                  {selectedExpense.categoryName}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Amount
                </label>
                <p className="text-gray-900 dark:text-gray-100 font-semibold">
                  {formatCurrency(selectedExpense.amount)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Status
                </label>
                <p className="text-gray-900 dark:text-gray-100 capitalize">
                  {selectedExpense.status}
                </p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Description
              </label>
              <p className="text-gray-900 dark:text-gray-100">
                {selectedExpense.description}
              </p>
            </div>
            {selectedExpense.notes && (
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Notes
                </label>
                <p className="text-gray-900 dark:text-gray-100">
                  {selectedExpense.notes}
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};