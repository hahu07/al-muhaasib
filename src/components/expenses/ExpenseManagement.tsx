"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ExpenseRecordingForm } from "./ExpenseRecordingForm";
import { ExpenseList } from "./ExpenseList";
import { ExpenseCategoryManager } from "./ExpenseCategoryManager";
import { ExpenseApprovalDashboard } from "./ExpenseApprovalDashboard";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { expenseService } from "@/services";
import { useAuth } from "@/contexts/AuthContext";
import type { Expense } from "@/types";
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
} from "lucide-react";

type ActiveTab = "overview" | "record" | "list" | "categories" | "approvals";

export const ExpenseManagement: React.FC = () => {
  const router = useRouter();
  const { appUser } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
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
      console.error("Error loading expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordSuccess = (expenseId: string) => {
    setShowRecordModal(false);
    loadExpenses(); // Reload expenses
    // Show success message
    alert("Expense recorded successfully!");
  };

  const handleExpenseSelect = (expense: Expense) => {
    setSelectedExpense(expense);
    // You could open a detailed view modal here
  };

  // Calculate summary statistics
  const getExpenseSummary = () => {
    const pending = expenses.filter((e) => e.status === "pending");
    const approved = expenses.filter((e) => e.status === "approved");
    const paid = expenses.filter((e) => e.status === "paid");
    const rejected = expenses.filter((e) => e.status === "rejected");

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
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const tabs = [
    {
      id: "overview",
      label: "Overview",
      icon: <BarChartIcon className="h-4 w-4" />,
    },
    {
      id: "record",
      label: "Record Expense",
      icon: <PlusIcon className="h-4 w-4" />,
    },
    {
      id: "list",
      label: "Expense List",
      icon: <ListIcon className="h-4 w-4" />,
    },
    ...(appUser?.role === "super_admin" || appUser?.role === "bursar"
      ? [
          {
            id: "approvals",
            label: "Approvals",
            icon: <CheckSquareIcon className="h-4 w-4" />,
          },
          {
            id: "categories",
            label: "Categories",
            icon: <SettingsIcon className="h-4 w-4" />,
          },
        ]
      : []),
  ] as const;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => router.push("/dashboard/accounting")}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Expense Management
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Record, track, and manage school expenses
            </p>
          </div>
        </div>

        <div className="mt-9 flex items-center gap-3">
          {/* Quick Approval Access for Admins */}
          {appUser?.role === "super_admin" ||
            (appUser?.role === "bursar" && summary.pendingCount > 0 && (
              <Button
                onClick={() => setActiveTab("approvals")}
                variant="outline"
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-50 dark:border-yellow-600 dark:text-yellow-400 dark:hover:bg-yellow-900/20"
              >
                <CheckSquareIcon className="mr-2 h-4 w-4" />
                {summary.pendingCount} Pending
              </Button>
            ))}

          <Button onClick={() => setShowRecordModal(true)} variant="primary">
            <PlusIcon className="mr-2 h-4 w-4" />
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
              className={`flex items-center gap-2 border-b-2 px-1 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
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
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Total Expenses
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {summary.totalExpenses}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <FileTextIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>

              <div
                className={`rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all dark:border-gray-700 dark:bg-gray-800 ${
                  appUser?.role === "super_admin" ||
                  (appUser?.role === "bursar" && summary.pendingCount > 0)
                    ? "cursor-pointer hover:border-yellow-300 hover:shadow-md dark:hover:border-yellow-600"
                    : ""
                }`}
                onClick={() => {
                  if (
                    appUser?.role === "super_admin" ||
                    (appUser?.role === "bursar" && summary.pendingCount > 0)
                  ) {
                    setActiveTab("approvals");
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Pending Approval
                      {appUser?.role === "super_admin" ||
                        (appUser?.role === "bursar" &&
                          summary.pendingCount > 0 && (
                            <span className="ml-2 text-xs text-yellow-600 dark:text-yellow-400">
                              (Click to review)
                            </span>
                          ))}
                    </p>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {summary.pendingCount}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatCurrency(summary.totalPending)}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                    <ClockIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
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
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <CheckCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
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
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                    <DollarSignIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Expenses - Limited view for overview */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Recent Expenses
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("list")}
                >
                  View All
                </Button>
              </div>
              <div className="p-4">
                {expenses.length === 0 ? (
                  <div className="py-8 text-center">
                    <FileTextIcon className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No expenses recorded yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {expenses.slice(0, 5).map((expense) => (
                      <div
                        key={expense.id}
                        onClick={() => handleExpenseSelect(expense)}
                        className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                            {expense.description}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {expense.categoryName} • {expense.reference}
                          </p>
                        </div>
                        <div className="ml-4 flex items-center gap-3">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {formatCurrency(expense.amount)}
                          </p>
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${
                              expense.status === "pending"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                                : expense.status === "approved"
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                  : expense.status === "paid"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                            }`}
                          >
                            {expense.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            {(summary.pendingCount > 0 && appUser?.role === "super_admin") ||
              (appUser?.role === "bursar" && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-900/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertCircleIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      <div>
                        <p className="font-medium text-amber-800 dark:text-amber-300">
                          Action Required
                        </p>
                        <p className="text-sm text-amber-700 dark:text-amber-400">
                          {summary.pendingCount} expense
                          {summary.pendingCount !== 1 ? "s" : ""} awaiting
                          approval
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => setActiveTab("approvals")}
                      variant="outline"
                      className="border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-600 dark:text-amber-400 dark:hover:bg-amber-900/30"
                    >
                      <CheckSquareIcon className="mr-2 h-4 w-4" />
                      Review & Approve
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        )}

        {activeTab === "record" && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <ExpenseRecordingForm onSuccess={handleRecordSuccess} />
          </div>
        )}

        {activeTab === "list" && (
          <ExpenseList
            onExpenseSelect={handleExpenseSelect}
            showActions={
              appUser?.role === "super_admin" || appUser?.role === "bursar"
            }
          />
        )}

        {activeTab === "approvals" &&
          (appUser?.role === "super_admin" || appUser?.role === "bursar") && (
            <ExpenseApprovalDashboard />
          )}

        {activeTab === "categories" &&
          (appUser?.role === "super_admin" || appUser?.role === "bursar") && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
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
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(selectedExpense.amount)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Status
                </label>
                <p className="text-gray-900 capitalize dark:text-gray-100">
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
