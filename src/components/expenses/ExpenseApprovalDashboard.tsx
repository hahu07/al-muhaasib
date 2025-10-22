"use client";

import React, { useState, useEffect } from "react";
import { expenseService } from "@/services";
import { useAuth } from "@/contexts/AuthContext";
import type { Expense } from "@/types";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DollarSignIcon,
  CalendarIcon,
  AlertTriangleIcon,
  RefreshCcwIcon,
  FilterIcon,
  EyeIcon,
  BuildingIcon,
} from "lucide-react";

interface ExpenseApprovalDashboardProps {
  className?: string;
}

export const ExpenseApprovalDashboard: React.FC<
  ExpenseApprovalDashboardProps
> = ({ className = "" }) => {
  const { appUser } = useAuth();
  const [pendingExpenses, setPendingExpenses] = useState<Expense[]>([]);
  const [approvedExpenses, setApprovedExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filterAmount, setFilterAmount] = useState<
    "all" | "low" | "medium" | "high"
  >("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // Statistics
  const [stats, setStats] = useState({
    totalPending: 0,
    totalPendingValue: 0,
    totalApproved: 0,
    totalApprovedValue: 0,
    urgentCount: 0,
  });

  useEffect(() => {
    if (appUser?.role === "super_admin" || appUser?.role === "bursar") {
      loadData();
    }
  }, [appUser]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Get pending expenses from local storage and approved from Juno
      const [pending, approved] = await Promise.all([
        expenseService.getPendingExpenses(), // From IndexedDB
        expenseService.getByStatus("approved"), // From Juno
      ]);

      // Sort pending by amount (highest first) to prioritize high-value items
      const sortedPending = pending.sort((a, b) => b.amount - a.amount);

      setPendingExpenses(sortedPending);
      setApprovedExpenses(approved);

      // Calculate statistics
      const totalPendingValue = pending.reduce(
        (sum, exp) => sum + exp.amount,
        0,
      );
      const totalApprovedValue = approved.reduce(
        (sum, exp) => sum + exp.amount,
        0,
      );
      const urgentCount = pending.filter((exp) => exp.amount > 50000).length; // High-value expenses

      setStats({
        totalPending: pending.length,
        totalPendingValue,
        totalApproved: approved.length,
        totalApprovedValue,
        urgentCount,
      });
    } catch (error) {
      console.error("Error loading approval data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (expenseId: string) => {
    if (!appUser) return;

    try {
      setProcessingIds((prev) => new Set(prev).add(expenseId));
      await expenseService.approveExpense(expenseId, appUser.id);
      await loadData(); // Reload data
    } catch (error) {
      console.error("Error approving expense:", error);
      alert("Failed to approve expense. Please try again.");
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(expenseId);
        return newSet;
      });
    }
  };

  const handleReject = async (expenseId: string) => {
    if (!appUser) return;

    const reason = prompt(
      "Please provide a reason for rejection (minimum 10 characters):",
    );
    if (!reason?.trim() || reason.trim().length < 10) {
      alert("Rejection reason must be at least 10 characters");
      return;
    }

    try {
      setProcessingIds((prev) => new Set(prev).add(expenseId));
      await expenseService.rejectExpense(expenseId, appUser.id, reason.trim());
      await loadData(); // Reload data
    } catch (error) {
      console.error("Error rejecting expense:", error);
      alert("Failed to reject expense. Please try again.");
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(expenseId);
        return newSet;
      });
    }
  };

  const handleMarkAsPaid = async (expenseId: string) => {
    if (!confirm("Mark this expense as paid?")) return;

    try {
      setProcessingIds((prev) => new Set(prev).add(expenseId));
      await expenseService.markAsPaid(expenseId);
      await loadData(); // Reload data
    } catch (error) {
      console.error("Error marking expense as paid:", error);
      alert("Failed to mark expense as paid. Please try again.");
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(expenseId);
        return newSet;
      });
    }
  };

  const handleBulkApprove = async () => {
    if (
      !appUser ||
      !confirm(
        `Approve all ${getFilteredPendingExpenses().length} visible expenses?`,
      )
    )
      return;

    const expenseIds = getFilteredPendingExpenses().map((exp) => exp.id);

    try {
      setLoading(true);
      for (const expenseId of expenseIds) {
        await expenseService.approveExpense(expenseId, appUser.id);
      }
      await loadData();
      alert(`Successfully approved ${expenseIds.length} expenses!`);
    } catch (error) {
      console.error("Error in bulk approval:", error);
      alert("Some expenses failed to approve. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getAmountCategory = (amount: number): "low" | "medium" | "high" => {
    if (amount < 10000) return "low";
    if (amount < 50000) return "medium";
    return "high";
  };

  const getAmountColor = (amount: number) => {
    const category = getAmountCategory(amount);
    switch (category) {
      case "low":
        return "text-green-600 dark:text-green-400";
      case "medium":
        return "text-yellow-600 dark:text-yellow-400";
      case "high":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-900 dark:text-gray-100";
    }
  };

  const getFilteredPendingExpenses = () => {
    let filtered = [...pendingExpenses];

    // Amount filter
    if (filterAmount !== "all") {
      filtered = filtered.filter(
        (exp) => getAmountCategory(exp.amount) === filterAmount,
      );
    }

    // Category filter
    if (filterCategory !== "all") {
      filtered = filtered.filter((exp) => exp.category === filterCategory);
    }

    return filtered;
  };

  const uniqueCategories = [
    ...new Set(pendingExpenses.map((exp) => exp.category)),
  ];

  if (
    !appUser ||
    (appUser.role !== "super_admin" && appUser.role !== "bursar")
  ) {
    return (
      <div className="py-8 text-center">
        <AlertTriangleIcon className="mx-auto mb-4 h-12 w-12 text-gray-400" />
        <p className="text-gray-600 dark:text-gray-400">
          Access denied. This dashboard is for administrators only.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const filteredPending = getFilteredPendingExpenses();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
            <CheckCircleIcon className="h-6 w-6" />
            Expense Approval Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Review and approve pending expense requests
          </p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm">
          <RefreshCcwIcon className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Pending Approval
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.totalPending}
              </p>
            </div>
            <ClockIcon className="h-8 w-8 text-yellow-500" />
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Value: {formatCurrency(stats.totalPendingValue)}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Approved
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.totalApproved}
              </p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-blue-500" />
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Value: {formatCurrency(stats.totalApprovedValue)}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                High Priority
              </p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {stats.urgentCount}
              </p>
            </div>
            <AlertTriangleIcon className="h-8 w-8 text-red-500" />
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Over ₦50,000 each
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Avg. Amount
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.totalPending > 0
                  ? formatCurrency(stats.totalPendingValue / stats.totalPending)
                  : "₦0"}
              </p>
            </div>
            <DollarSignIcon className="h-8 w-8 text-green-500" />
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Per expense
          </p>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-wrap items-center gap-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <FilterIcon className="h-4 w-4" />
          <span className="text-sm font-medium">Filters:</span>
        </div>

        <select
          value={filterAmount}
          onChange={(e) =>
            setFilterAmount(e.target.value as "all" | "low" | "medium" | "high")
          }
          className="rounded border border-gray-300 bg-white px-3 py-1 text-sm dark:border-gray-600 dark:bg-gray-700"
        >
          <option value="all">All Amounts</option>
          <option value="low">Low (&lt; ₦10K)</option>
          <option value="medium">Medium (₦10K - ₦50K)</option>
          <option value="high">High (&gt; ₦50K)</option>
        </select>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="rounded border border-gray-300 bg-white px-3 py-1 text-sm dark:border-gray-600 dark:bg-gray-700"
        >
          <option value="all">All Categories</option>
          {uniqueCategories.map((category) => (
            <option key={category} value={category}>
              {category
                .split("_")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ")}
            </option>
          ))}
        </select>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredPending.length} of {stats.totalPending} pending
          </span>
          {filteredPending.length > 0 && (
            <Button onClick={handleBulkApprove} variant="primary" size="sm">
              <CheckCircleIcon className="mr-2 h-4 w-4" />
              Approve All Visible
            </Button>
          )}
        </div>
      </div>

      {/* Pending Expenses */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Pending Expenses ({filteredPending.length})
          </h2>
        </div>

        {filteredPending.length === 0 ? (
          <div className="py-12 text-center">
            <CheckCircleIcon className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">
              {stats.totalPending === 0
                ? "No expenses awaiting approval! 🎉"
                : "No expenses match your current filters"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredPending.map((expense) => (
              <div
                key={expense.id}
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <h3 className="truncate text-lg font-medium text-gray-900 dark:text-gray-100">
                        {expense.description}
                      </h3>
                      {expense.amount > 50000 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-300">
                          <AlertTriangleIcon className="h-3 w-3" />
                          High Value
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
                      <div className="flex items-center gap-2">
                        <DollarSignIcon className="h-4 w-4 text-gray-400" />
                        <span
                          className={`font-semibold ${getAmountColor(expense.amount)}`}
                        >
                          {formatCurrency(expense.amount)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <BuildingIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">
                          {expense.vendorName || "No vendor specified"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">
                          {formatDate(expense.paymentDate)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>#{expense.reference}</span>
                      <span>Category: {expense.categoryName}</span>
                      <span>Requested by: {expense.recordedBy}</span>
                    </div>
                  </div>

                  <div className="ml-4 flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedExpense(expense);
                        setShowDetails(true);
                      }}
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => handleApprove(expense.id)}
                      disabled={processingIds.has(expense.id)}
                      className="border-green-300 text-green-600 hover:border-green-400 hover:text-green-700"
                    >
                      <CheckCircleIcon className="mr-1 h-4 w-4" />
                      Approve
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(expense.id)}
                      disabled={processingIds.has(expense.id)}
                      className="border-red-300 text-red-600 hover:border-red-400 hover:text-red-700"
                    >
                      <XCircleIcon className="mr-1 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approved Expenses Awaiting Payment */}
      {approvedExpenses.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Approved - Awaiting Payment ({approvedExpenses.length})
            </h2>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {approvedExpenses.map((expense) => (
              <div
                key={expense.id}
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      {expense.description}
                    </h3>
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-medium text-blue-600 dark:text-blue-400">
                        {formatCurrency(expense.amount)}
                      </span>
                      <span>#{expense.reference}</span>
                      <span>Vendor: {expense.vendorName || "N/A"}</span>
                      <span>Approved by: {expense.approvedBy}</span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleMarkAsPaid(expense.id)}
                    disabled={processingIds.has(expense.id)}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                  >
                    <DollarSignIcon className="mr-1 h-4 w-4" />
                    Mark as Paid
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expense Details Modal */}
      {showDetails && selectedExpense && (
        <Modal
          isOpen={showDetails}
          onClose={() => {
            setShowDetails(false);
            setSelectedExpense(null);
          }}
          title="Expense Details"
          size="lg"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Reference
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {selectedExpense.reference}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Amount
                </label>
                <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(selectedExpense.amount)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Category
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {selectedExpense.categoryName}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Payment Method
                </label>
                <p className="mt-1 text-sm text-gray-900 capitalize dark:text-gray-100">
                  {selectedExpense.paymentMethod.replace("_", " ")}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Payment Date
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {formatDate(selectedExpense.paymentDate)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Vendor
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {selectedExpense.vendorName || "Not specified"}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                {selectedExpense.description}
              </p>
            </div>

            {selectedExpense.purpose && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Purpose
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {selectedExpense.purpose}
                </p>
              </div>
            )}

            {selectedExpense.notes && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Notes
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {selectedExpense.notes}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDetails(false);
                  setSelectedExpense(null);
                }}
              >
                Close
              </Button>
              {selectedExpense.status === "pending" && (
                <>
                  <Button
                    onClick={() => {
                      handleApprove(selectedExpense.id);
                      setShowDetails(false);
                      setSelectedExpense(null);
                    }}
                    className="bg-green-600 text-white hover:bg-green-700"
                  >
                    <CheckCircleIcon className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => {
                      handleReject(selectedExpense.id);
                      setShowDetails(false);
                      setSelectedExpense(null);
                    }}
                    className="bg-red-600 text-white hover:bg-red-700"
                  >
                    <XCircleIcon className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
