"use client";

import React, { useState, useEffect } from "react";
import { expenseService } from "@/services";
import { useAuth } from "@/contexts/AuthContext";
import type { Expense } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SearchIcon,
  FilterIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DollarSignIcon,
  CalendarIcon,
  UserIcon,
  FileTextIcon,
  AlertCircleIcon,
  MoreVerticalIcon,
  DownloadIcon,
  PrinterIcon,
} from "lucide-react";

interface ExpenseListProps {
  onExpenseSelect?: (expense: Expense) => void;
  showActions?: boolean;
  className?: string;
  statusFilter?: "all" | "pending" | "approved" | "paid" | "rejected";
}

export const ExpenseList: React.FC<ExpenseListProps> = ({
  onExpenseSelect,
  showActions = true,
  className = "",
  statusFilter: initialStatusFilter,
}) => {
  const { appUser } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(
    initialStatusFilter || "all",
  );
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dateRangeFilter, setDateRangeFilter] = useState<string>("all");

  useEffect(() => {
    loadExpenses();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [expenses, searchTerm, statusFilter, categoryFilter, dateRangeFilter]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const data = await expenseService.list();
      // Sort by creation date (newest first)
      const toMs = (ts: unknown) => {
        if (typeof ts === "bigint") return Number(ts / BigInt(1_000_000));
        if (typeof ts === "number") return ts;
        if (typeof ts === "string") return Date.parse(ts);
        return 0;
      };
      const sortedData = data.sort(
        (a, b) => toMs(b.createdAt) - toMs(a.createdAt),
      );
      setExpenses(sortedData);
    } catch (error) {
      console.error("Error loading expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...expenses];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (expense) =>
          expense.description.toLowerCase().includes(term) ||
          expense.categoryName.toLowerCase().includes(term) ||
          expense.vendorName?.toLowerCase().includes(term) ||
          expense.reference.toLowerCase().includes(term),
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((expense) => expense.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(
        (expense) => expense.category === categoryFilter,
      );
    }

    // Date range filter
    if (dateRangeFilter !== "all") {
      const today = new Date();
      const filterDate = new Date();

      switch (dateRangeFilter) {
        case "today":
          filterDate.setDate(today.getDate());
          break;
        case "week":
          filterDate.setDate(today.getDate() - 7);
          break;
        case "month":
          filterDate.setMonth(today.getMonth() - 1);
          break;
        case "quarter":
          filterDate.setMonth(today.getMonth() - 3);
          break;
      }

      if (dateRangeFilter !== "all") {
        filtered = filtered.filter(
          (expense) => new Date(expense.paymentDate) >= filterDate,
        );
      }
    }

    setFilteredExpenses(filtered);
  };

  const handleApproveExpense = async (expenseId: string) => {
    if (!appUser) return;

    try {
      await expenseService.approveExpense(expenseId, appUser.id);
      loadExpenses(); // Reload to get updated data
    } catch (error) {
      console.error("Error approving expense:", error);
      alert("Failed to approve expense. Please try again.");
    }
  };

  const handleRejectExpense = async (expenseId: string) => {
    if (!appUser) return;

    const reason = prompt("Please provide a reason for rejection:");
    if (!reason) return;

    try {
      await expenseService.rejectExpense(expenseId, appUser.id, reason);
      loadExpenses(); // Reload to get updated data
    } catch (error) {
      console.error("Error rejecting expense:", error);
      alert("Failed to reject expense. Please try again.");
    }
  };

  const handleMarkAsPaid = async (expenseId: string) => {
    if (!confirm("Mark this expense as paid?")) return;

    try {
      await expenseService.markAsPaid(expenseId);
      loadExpenses(); // Reload to get updated data
    } catch (error) {
      console.error("Error marking expense as paid:", error);
      alert("Failed to mark expense as paid. Please try again.");
    }
  };

  const getStatusColor = (status: Expense["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "approved":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const getStatusIcon = (status: Expense["status"]) => {
    switch (status) {
      case "pending":
        return <ClockIcon className="h-4 w-4" />;
      case "approved":
        return <CheckCircleIcon className="h-4 w-4" />;
      case "paid":
        return <CheckCircleIcon className="h-4 w-4" />;
      case "rejected":
        return <XCircleIcon className="h-4 w-4" />;
      default:
        return <AlertCircleIcon className="h-4 w-4" />;
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

  // Get unique categories for filter
  const uniqueCategories = Array.from(new Set(expenses.map((e) => e.category)));

  const handleExportCSV = () => {
    // Generate CSV content
    const headers = [
      "Date",
      "Description",
      "Category",
      "Amount",
      "Payment Method",
      "Vendor",
      "Reference",
      "Status",
      "Recorded By",
    ];

    const rows = filteredExpenses.map((expense) => [
      formatDate(expense.paymentDate),
      expense.description,
      expense.categoryName,
      expense.amount,
      expense.paymentMethod.replace("_", " "),
      expense.vendorName || "",
      expense.reference,
      expense.status,
      expense.recordedBy,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    // Create a printable version
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow pop-ups to print");
      return;
    }

    const totalAmount = filteredExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0,
    );

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Expenses Report</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
            }
            h1 {
              text-align: center;
              color: #1a202c;
              margin-bottom: 10px;
            }
            .report-info {
              text-align: center;
              margin-bottom: 30px;
              color: #666;
              font-size: 14px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 12px;
              text-align: left;
            }
            th {
              background-color: #3182ce;
              color: white;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #f8f9fa;
            }
            .status-pending { color: #d97706; font-weight: bold; }
            .status-approved { color: #2563eb; font-weight: bold; }
            .status-paid { color: #059669; font-weight: bold; }
            .status-rejected { color: #dc2626; font-weight: bold; }
            .total-row {
              font-weight: bold;
              background-color: #e2e8f0 !important;
              font-size: 16px;
            }
            @media print {
              body { margin: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>Expenses Report</h1>
          <div class="report-info">
            <p>Generated on: ${new Date().toLocaleString("en-NG")}</p>
            <p>Total Expenses: ${filteredExpenses.length}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Vendor</th>
                <th>Status</th>
                <th>Reference</th>
              </tr>
            </thead>
            <tbody>
              ${filteredExpenses
                .map(
                  (expense) => `
                <tr>
                  <td>${formatDate(expense.paymentDate)}</td>
                  <td>${expense.description}</td>
                  <td>${expense.categoryName}</td>
                  <td>${formatCurrency(expense.amount)}</td>
                  <td>${expense.vendorName || "N/A"}</td>
                  <td class="status-${expense.status}">${expense.status.toUpperCase()}</td>
                  <td>${expense.reference}</td>
                </tr>
              `,
                )
                .join("")}
              <tr class="total-row">
                <td colspan="3">TOTAL</td>
                <td>${formatCurrency(totalAmount)}</td>
                <td colspan="3"></td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Filters */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        {/* Action Buttons Row */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Expense Filters
          </h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={filteredExpenses.length === 0}
              className="flex items-center gap-2"
            >
              <DownloadIcon className="h-4 w-4" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              disabled={filteredExpenses.length === 0}
              className="flex items-center gap-2"
            >
              <PrinterIcon className="h-4 w-4" />
              Print
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Search */}
          <div className="relative">
            <SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pr-4 pl-10 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          {/* Category Filter */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {uniqueCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category
                    .split("_")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date Range Filter */}
          <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
              setCategoryFilter("all");
              setDateRangeFilter("all");
            }}
            className="whitespace-nowrap"
          >
            <FilterIcon className="mr-2 h-4 w-4" />
            Clear
          </Button>
        </div>

        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredExpenses.length} of {expenses.length} expenses
        </div>
      </div>

      {/* Expense List */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        {filteredExpenses.length === 0 ? (
          <div className="py-12 text-center">
            <FileTextIcon className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm ||
              statusFilter !== "all" ||
              categoryFilter !== "all" ||
              dateRangeFilter !== "all"
                ? "No expenses found matching your filters"
                : "No expenses recorded yet"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-700 uppercase dark:text-gray-300">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-700 uppercase dark:text-gray-300">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-700 uppercase dark:text-gray-300">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-700 uppercase dark:text-gray-300">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-700 uppercase dark:text-gray-300">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-700 uppercase dark:text-gray-300">
                    Vendor
                  </th>
                  {showActions && (
                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-700 uppercase dark:text-gray-300">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredExpenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    onClick={() => onExpenseSelect?.(expense)}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {expense.description}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {expense.reference}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {expense.categoryName}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(expense.amount)}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="flex items-center gap-1 text-sm text-gray-900 dark:text-gray-100">
                        <CalendarIcon className="h-3 w-3" />
                        {formatDate(expense.paymentDate)}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(expense.status)}`}
                      >
                        {getStatusIcon(expense.status)}
                        {expense.status.charAt(0).toUpperCase() +
                          expense.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {expense.vendorName || "N/A"}
                      </p>
                    </td>
                    {showActions && appUser && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {(expense.status === "pending" &&
                            appUser.role === "super_admin") ||
                            (appUser?.role === "bursar" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleApproveExpense(expense.id);
                                  }}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <CheckCircleIcon className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRejectExpense(expense.id);
                                  }}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <XCircleIcon className="h-3 w-3" />
                                </Button>
                              </>
                            ))}
                          {(expense.status === "approved" &&
                            appUser.role === "super_admin") ||
                            (appUser?.role === "bursar" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsPaid(expense.id);
                                }}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <DollarSignIcon className="h-3 w-3" />
                                Pay
                              </Button>
                            ))}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
