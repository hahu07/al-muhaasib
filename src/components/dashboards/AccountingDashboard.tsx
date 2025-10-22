"use client";

import React, { useState, useEffect } from "react";
import {
  DollarSignIcon,
  UsersIcon,
  CreditCardIcon,
  TrendingUpIcon,
  ClockIcon,
  PlusIcon,
  SearchIcon,
  FilterIcon,
  DownloadIcon,
  BookOpenIcon,
  FileTextIcon,
  UserCheckIcon,
  PackageIcon,
  FileBarChartIcon,
  Settings,
  Database,
} from "lucide-react";
import {
  useFinancialDashboard,
  type FinancialDashboardData,
} from "@/hooks/useFinancialDashboard";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useRouter } from "next/navigation";
import { paymentService, studentService } from "@/services";
import type { Payment, StudentProfile } from "@/types";
import StaffRouter from "@/components/staff/StaffRouter";
import AssetManagement from "@/components/assets/AssetManagement";
import ReportsDashboard from "@/components/reports/ReportsDashboard";

// Export utilities
function generateCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) {
    alert("No data to export");
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header] ?? "";
          // Escape commas and quotes
          return typeof value === "string" &&
            (value.includes(",") || value.includes('"'))
            ? `"${value.replace(/"/g, '""')}"`
            : value;
        })
        .join(","),
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `${filename}_${new Date().toISOString().split("T")[0]}.csv`,
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function generatePDF(
  data: Record<string, unknown>[],
  title: string,
  filename: string,
) {
  // Simple HTML-based PDF generation
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .summary { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .date { text-align: right; color: #666; }
      </style>
    </head>
    <body>
      <div class="date">Generated on: ${new Date().toLocaleDateString()}</div>
      <h1>${title}</h1>
      ${generateTableHTML(data)}
    </body>
    </html>
  `;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  }
}

function generateTableHTML(data: Record<string, unknown>[]) {
  if (data.length === 0) return "<p>No data available</p>";

  const headers = Object.keys(data[0]);
  return `
    <table>
      <thead>
        <tr>
          ${headers.map((header) => `<th>${header}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${data
          .map(
            (row) => `
          <tr>
            ${headers.map((header) => `<td>${row[header] ?? ""}</td>`).join("")}
          </tr>
        `,
          )
          .join("")}
      </tbody>
    </table>
  `;
}

// Hook for real-time dashboard data
function useRealtimeDashboardData() {
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [recentStudents, setRecentStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRealtimeData = async () => {
    try {
      setLoading(true);

      // Fetch recent payments (last 10)
      const allPayments = await paymentService.list();
      const toMs = (ts: unknown) => {
        if (typeof ts === "bigint") return Number(ts / BigInt(1_000_000));
        if (typeof ts === "number") return ts;
        if (typeof ts === "string") return Date.parse(ts);
        return 0;
      };
      const sortedPayments = allPayments
        .filter((p) => p.status === "confirmed")
        .sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt))
        .slice(0, 10);
      setRecentPayments(sortedPayments);

      // Fetch all students for dashboard stats
      const allStudents = await studentService.list();
      setRecentStudents(allStudents);
    } catch (error) {
      console.error("Error fetching realtime dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealtimeData();

    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchRealtimeData, 120000);
    return () => clearInterval(interval);
  }, []);

  return {
    recentPayments,
    recentStudents,
    loading,
    refresh: fetchRealtimeData,
  };
}

export function AccountingDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "students"
    | "transactions"
    | "expenses"
    | "staff"
    | "assets"
    | "reports"
  >("overview");
  const { data, loading, error } = useFinancialDashboard();
  const {
    recentPayments,
    recentStudents,
    loading: realtimeLoading,
    refresh: refreshRealtime,
  } = useRealtimeDashboardData();
  const [showStudentListModal, setShowStudentListModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const handleExportReport = () => {
    setShowExportModal(true);
  };

  if (loading) {
    return <AccountingDashboardSkeleton />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  if (!data) {
    return <EmptyState />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Mobile Header */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-xl font-bold text-gray-900 sm:text-2xl dark:text-blue-300">
                Accounting Dashboard
              </h1>
              <p className="text-sm text-gray-600 opacity-70 dark:text-blue-300">
                Financial management and student payments
              </p>
            </div>
            {/* Action buttons */}
            <div className="flex shrink-0 items-center gap-2">
              <Button
                size="sm"
                variant="primary"
                className="whitespace-nowrap"
                onClick={() => router.push("/students")}
              >
                <PlusIcon className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">New Payment</span>
              </Button>
            </div>
          </div>

          {/* Mobile Navigation Tabs */}
          <div className="mt-4 -mb-1 flex space-x-1 overflow-x-auto pb-1">
            {[
              {
                id: "overview",
                label: "Overview",
                icon: <TrendingUpIcon className="h-4 w-4" />,
              },
              {
                id: "students",
                label: "Students",
                icon: <UsersIcon className="h-4 w-4" />,
              },
              {
                id: "transactions",
                label: "Payments",
                icon: <CreditCardIcon className="h-4 w-4" />,
              },
              {
                id: "expenses",
                label: "Expenses",
                icon: <DollarSignIcon className="h-4 w-4" />,
              },
              {
                id: "staff",
                label: "Staff",
                icon: <UserCheckIcon className="h-4 w-4" />,
              },
              {
                id: "assets",
                label: "Assets",
                icon: <PackageIcon className="h-4 w-4" />,
              },
              {
                id: "reports",
                label: "Reports",
                icon: <FileBarChartIcon className="h-4 w-4" />,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() =>
                  setActiveTab(
                    tab.id as
                      | "overview"
                      | "students"
                      | "transactions"
                      | "expenses"
                      | "staff"
                      | "assets"
                      | "reports",
                  )
                }
                className={`flex flex-shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                } `}
              >
                <span className="flex-shrink-0">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6 p-4 sm:p-6">
        {activeTab === "overview" && (
          <OverviewTab
            data={data}
            recentPayments={recentPayments}
            realtimeLoading={realtimeLoading}
            onExport={handleExportReport}
          />
        )}
        {activeTab === "students" && (
          <StudentsTab
            data={data}
            recentStudents={recentStudents}
            realtimeLoading={realtimeLoading}
          />
        )}
        {activeTab === "transactions" && (
          <TransactionsTab
            data={data}
            recentPayments={recentPayments}
            realtimeLoading={realtimeLoading}
            onExport={handleExportReport}
          />
        )}
        {activeTab === "expenses" && <ExpensesTab />}
        {activeTab === "staff" && <StaffRouter />}
        {activeTab === "assets" && <AssetManagement />}
        {activeTab === "reports" && <ReportsDashboard />}
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <Modal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          title="Export Financial Report"
          size="md"
        >
          <ExportModal
            data={data}
            recentPayments={recentPayments}
            recentStudents={recentStudents}
            onClose={() => setShowExportModal(false)}
          />
        </Modal>
      )}
    </div>
  );
}

// Overview Tab Component
function OverviewTab({
  data,
  recentPayments,
  realtimeLoading,
  onExport,
}: {
  data: FinancialDashboardData;
  recentPayments: Payment[];
  realtimeLoading: boolean;
  onExport?: () => void;
}) {
  const router = useRouter();

  const formatTimeAgo = (date: Date | string | bigint | number) => {
    const toDate = (d: Date | string | bigint | number) => {
      if (typeof d === "bigint") return new Date(Number(d / BigInt(1_000_000)));
      if (typeof d === "number") return new Date(d);
      return new Date(d);
    };
    const now = new Date();
    const paymentDate = toDate(date);
    const diffInMinutes = Math.floor(
      (now.getTime() - paymentDate.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440)
      return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={`₦${data.revenue.totalCollected.toLocaleString()}`}
          icon={<DollarSignIcon className="h-6 w-6 text-green-600" />}
          trend="+12%"
          trendColor="text-green-600"
        />
        <StatCard
          title="Pending"
          value={`₦${data.revenue.totalPending.toLocaleString()}`}
          icon={<ClockIcon className="h-6 w-6 text-yellow-600" />}
          trend={`${data.students.unpaidStudents} students`}
          trendColor="text-yellow-600"
        />
        <StatCard
          title="Total Students"
          value={data.students.totalStudents.toString()}
          icon={<UsersIcon className="h-6 w-6 text-blue-600" />}
          trend={`${data.students.paidStudents} paid`}
          trendColor="text-green-600"
        />
        <StatCard
          title="This Month"
          value={`₦${data.revenue.monthlyTrend[data.revenue.monthlyTrend.length - 1]?.amount.toLocaleString() || "0"}`}
          icon={<TrendingUpIcon className="h-6 w-6 text-purple-600" />}
          trend="Current"
          trendColor="text-purple-600"
        />
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          <ActionButton
            icon={<PlusIcon className="h-5 w-5" />}
            label="Record Payment"
            onClick={() => router.push("/students")}
          />
          <ActionButton
            icon={<UsersIcon className="h-5 w-5" />}
            label="Add Student"
            onClick={() => router.push("/students")}
          />
          <ActionButton
            icon={<BookOpenIcon className="h-5 w-5" />}
            label="Fee Management"
            onClick={() => router.push("/fees")}
          />
          <ActionButton
            icon={<FileTextIcon className="h-5 w-5" />}
            label="Record Expense"
            onClick={() => router.push("/expenses")}
          />
          <ActionButton
            icon={<UserCheckIcon className="h-5 w-5" />}
            label="Staff Management"
            onClick={() => router.push("/staff")}
          />
          <ActionButton
            icon={<PackageIcon className="h-5 w-5" />}
            label="Asset Management"
            onClick={() => router.push("/assets")}
          />
          <ActionButton
            icon={<FileBarChartIcon className="h-5 w-5" />}
            label="Financial Reports"
            onClick={() => router.push("/reports")}
          />
          <ActionButton
            icon={<DownloadIcon className="h-5 w-5" />}
            label="Export Report"
            onClick={onExport || (() => {})}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
          {realtimeLoading && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
          )}
        </div>
        <div className="space-y-3">
          {recentPayments.length > 0 ? (
            recentPayments.slice(0, 5).map((payment) => (
              <div
                key={payment.id}
                className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/50"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <DollarSignIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    Payment received from {payment.studentName}
                  </p>
                  <p className="text-xs opacity-60">
                    ₦{payment.amount.toLocaleString()} • {payment.paymentMethod}{" "}
                    • {formatTimeAgo(payment.createdAt)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              <DollarSignIcon className="mx-auto mb-2 h-12 w-12 opacity-30" />
              <p className="text-sm">No recent payments</p>
              <p className="text-xs opacity-60">
                Recent payment activity will appear here
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Students Tab Component
function StudentsTab({
  data,
  recentStudents,
  realtimeLoading,
}: {
  data: FinancialDashboardData;
  recentStudents: StudentProfile[];
  realtimeLoading: boolean;
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const getPaymentStatus = (
    student: StudentProfile,
  ): "paid" | "partial" | "pending" => {
    if (student.balance === 0 && student.totalPaid > 0) return "paid";
    if (student.totalPaid > 0 && student.balance > 0) return "partial";
    return "pending";
  };

  const filteredStudents = recentStudents.filter(
    (student) =>
      searchTerm === "" ||
      `${student.firstname} ${student.surname}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      student.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pr-4 pl-10 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500"
            />
          </div>
          <Button variant="outline" size="sm">
            <FilterIcon className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>
      </div>

      {/* Payment Status Summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatusCard
          title="Paid"
          count={data.students.paidStudents}
          color="green"
        />
        <StatusCard
          title="Partial"
          count={data.students.partialPaidStudents}
          color="yellow"
        />
        <StatusCard
          title="Pending"
          count={data.students.unpaidStudents}
          color="red"
        />
        <StatusCard
          title="Overdue"
          count={data.students.overdueStudents}
          color="red"
        />
      </div>

      {/* Students List */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Students
          </h3>
          {realtimeLoading && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
          )}
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredStudents.length > 0 ? (
            filteredStudents
              .slice(0, 10)
              .map((student) => (
                <RealStudentListItem
                  key={student.id}
                  student={student}
                  status={getPaymentStatus(student)}
                />
              ))
          ) : (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <UsersIcon className="mx-auto mb-2 h-12 w-12 opacity-30" />
              <p className="text-sm">No students found</p>
              <p className="text-xs opacity-60">
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "No students registered yet"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Transactions Tab Component
function TransactionsTab({
  data,
  recentPayments,
  realtimeLoading,
  onExport,
}: {
  data: FinancialDashboardData;
  recentPayments: Payment[];
  realtimeLoading: boolean;
  onExport?: () => void;
}) {
  const formatTimeAgo = (date: Date | string | bigint | number) => {
    const toDate = (d: Date | string | bigint | number) => {
      if (typeof d === "bigint") return new Date(Number(d / BigInt(1_000_000)));
      if (typeof d === "number") return new Date(d);
      return new Date(d);
    };
    const now = new Date();
    const paymentDate = toDate(date);
    const diffInMinutes = Math.floor(
      (now.getTime() - paymentDate.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440)
      return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };
  return (
    <div className="space-y-6">
      {/* Transaction Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard
          title="Total Collected"
          value={`₦${data.revenue.totalCollected.toLocaleString()}`}
          icon={<DollarSignIcon className="h-6 w-6 text-green-600" />}
          trend="+8.2%"
          trendColor="text-green-600"
        />
        <StatCard
          title="This Month"
          value={`₦${data.revenue.monthlyTrend[data.revenue.monthlyTrend.length - 1]?.amount.toLocaleString() || "0"}`}
          icon={<TrendingUpIcon className="h-6 w-6 text-blue-600" />}
          trend="Current month"
          trendColor="text-blue-600"
        />
        <StatCard
          title="Pending"
          value={`₦${data.revenue.totalPending.toLocaleString()}`}
          icon={<ClockIcon className="h-6 w-6 text-yellow-600" />}
          trend="Outstanding"
          trendColor="text-yellow-600"
        />
      </div>

      {/* Recent Transactions */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Recent Payments
          </h3>
          <div className="flex items-center gap-2">
            {realtimeLoading && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={onExport || (() => {})}
            >
              <DownloadIcon className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {recentPayments.length > 0 ? (
            recentPayments.map((payment) => (
              <RealTransactionListItem
                key={payment.id}
                payment={payment}
                formatTimeAgo={formatTimeAgo}
              />
            ))
          ) : (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <CreditCardIcon className="mx-auto mb-2 h-12 w-12 opacity-30" />
              <p className="text-sm">No payments recorded</p>
              <p className="text-xs opacity-60">
                Payment transactions will appear here
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Export Modal Component
function ExportModal({
  data,
  recentPayments,
  recentStudents,
  onClose,
}: {
  data: FinancialDashboardData | null;
  recentPayments: Payment[];
  recentStudents: StudentProfile[];
  onClose: () => void;
}) {
  const [exportType, setExportType] = useState<
    "students" | "payments" | "summary"
  >("summary");
  const [format, setFormat] = useState<"csv" | "pdf">("csv");
  const [dateRange, setDateRange] = useState<"all" | "month" | "week">("all");
  const [loading, setLoading] = useState(false);

  const filterDataByDate = (
    data: Record<string, unknown>[],
    dateField: string,
  ) => {
    if (dateRange === "all") return data;

    const now = new Date();
    const cutoffDate = new Date();

    if (dateRange === "month") {
      cutoffDate.setMonth(now.getMonth() - 1);
    } else if (dateRange === "week") {
      cutoffDate.setDate(now.getDate() - 7);
    }

    return data.filter((item) => {
      const itemDate = new Date(item[dateField] as string | Date);
      return itemDate >= cutoffDate;
    });
  };

  const handleExport = async () => {
    try {
      setLoading(true);

      let exportData: Record<string, unknown>[] = [];
      let filename = "";
      let title = "";

      switch (exportType) {
        case "students":
          exportData = filterDataByDate(
            recentStudents as Record<string, unknown>[],
            "createdAt",
          ).map((student) => {
            const s = student as unknown as StudentProfile;
            return {
              "Student Name": `${s.firstname} ${s.surname}`,
              "Admission Number": s.admissionNumber,
              Class: s.className,
              Guardian: `${s.guardianFirstname} ${s.guardianSurname}`,
              "Guardian Phone": s.guardianPhone,
              "Total Fees": `₦${s.totalFeesAssigned.toLocaleString()}`,
              "Amount Paid": `₦${s.totalPaid.toLocaleString()}`,
              Balance: `₦${s.balance.toLocaleString()}`,
              Status: s.isActive ? "Active" : "Inactive",
              "Admission Date": s.admissionDate,
            };
          });
          filename = "students_report";
          title = "Students Report";
          break;

        case "payments":
          exportData = filterDataByDate(
            recentPayments as Record<string, unknown>[],
            "createdAt",
          ).map((payment) => {
            const p = payment as unknown as Payment;
            const toDate = (ts: unknown) =>
              typeof ts === "bigint"
                ? new Date(Number((ts as bigint) / BigInt(1_000_000)))
                : new Date(ts as string | number | Date);
            return {
              Date: toDate(p.createdAt).toLocaleDateString(),
              "Student Name": p.studentName,
              Amount: `₦${p.amount.toLocaleString()}`,
              "Payment Method": p.paymentMethod.replace("_", " "),
              Reference: p.reference,
              Status: p.status,
              "Paid By": p.paidBy || "N/A",
              Notes: p.notes || "N/A",
            };
          });
          filename = "payments_report";
          title = "Payments Report";
          break;

        case "summary":
          if (!data) {
            alert("Financial summary data is not available");
            return;
          }
          exportData = [
            {
              Metric: "Total Revenue Collected",
              Value: `₦${data.revenue.totalCollected.toLocaleString()}`,
              Description: "Total amount collected from student payments",
            },
            {
              Metric: "Total Pending",
              Value: `₦${data.revenue.totalPending.toLocaleString()}`,
              Description: "Outstanding amount from students",
            },
            {
              Metric: "Total Students",
              Value: data.students.totalStudents.toString(),
              Description: "Number of registered students",
            },
            {
              Metric: "Paid Students",
              Value: data.students.paidStudents.toString(),
              Description: "Students who have paid in full",
            },
            {
              Metric: "Partial Payment Students",
              Value: data.students.partialPaidStudents.toString(),
              Description: "Students with partial payments",
            },
            {
              Metric: "Unpaid Students",
              Value: data.students.unpaidStudents.toString(),
              Description: "Students with no payments",
            },
          ];
          filename = "financial_summary";
          title = "Financial Summary Report";
          break;
      }

      if (exportData.length === 0) {
        alert("No data available for the selected criteria");
        return;
      }

      if (format === "csv") {
        generateCSV(exportData, filename);
      } else {
        generatePDF(exportData, title, filename);
      }

      onClose();
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Export Type Selection */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          What would you like to export?
        </label>
        <div className="space-y-2">
          {[
            {
              id: "summary",
              label: "Financial Summary",
              desc: "Overview of revenue, students, and key metrics",
            },
            {
              id: "students",
              label: "Students Report",
              desc: "Detailed student information and payment status",
            },
            {
              id: "payments",
              label: "Payments Report",
              desc: "Transaction history and payment details",
            },
          ].map((option) => (
            <div key={option.id} className="flex items-start">
              <input
                type="radio"
                id={option.id}
                name="exportType"
                value={option.id}
                checked={exportType === option.id}
                onChange={(e) =>
                  setExportType(
                    e.target.value as "students" | "payments" | "summary",
                  )
                }
                className="mt-1 mr-3"
              />
              <div>
                <label
                  htmlFor={option.id}
                  className="cursor-pointer text-sm font-medium text-gray-900 dark:text-gray-100"
                >
                  {option.label}
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {option.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Format Selection */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Export Format
        </label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="csv"
              checked={format === "csv"}
              onChange={(e) => setFormat(e.target.value as "csv" | "pdf")}
              className="mr-2"
            />
            <span className="text-sm text-gray-900 dark:text-gray-100">
              CSV (Excel compatible)
            </span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="pdf"
              checked={format === "pdf"}
              onChange={(e) => setFormat(e.target.value as "csv" | "pdf")}
              className="mr-2"
            />
            <span className="text-sm text-gray-900 dark:text-gray-100">
              PDF (Print ready)
            </span>
          </label>
        </div>
      </div>

      {/* Date Range Selection */}
      {(exportType === "students" || exportType === "payments") && (
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Date Range
          </label>
          <select
            value={dateRange}
            onChange={(e) =>
              setDateRange(e.target.value as "all" | "month" | "week")
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="all">All Time</option>
            <option value="month">Last 30 Days</option>
            <option value="week">Last 7 Days</option>
          </select>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
        <Button variant="outline" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleExport} disabled={loading}>
          {loading ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              Exporting...
            </>
          ) : (
            <>
              <DownloadIcon className="mr-2 h-4 w-4" />
              Export {format.toUpperCase()}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// Helper Components
function StatCard({
  title,
  value,
  icon,
  trend,
  trendColor,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  trendColor?: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">
            {title}
          </p>
          <p className="truncate text-xl font-bold text-gray-900 sm:text-2xl dark:text-white">
            {value}
          </p>
          {trend && (
            <p
              className={`mt-2 text-xs ${trendColor || "text-gray-500 dark:text-gray-400"}`}
            >
              {trend}
            </p>
          )}
        </div>
        <div className="flex-shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 sm:h-12 sm:w-12 dark:bg-gray-700">
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex min-h-[4rem] flex-col items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 transition-colors hover:bg-gray-100 sm:min-h-[3rem] sm:flex-row sm:justify-start sm:gap-3 sm:p-4 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
    >
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 sm:h-6 sm:w-6 dark:bg-blue-900/30 dark:text-blue-400">
        {icon}
      </div>
      <span className="text-center text-xs font-medium text-gray-900 sm:text-left sm:text-sm dark:text-gray-200">
        {label}
      </span>
    </button>
  );
}

function StatusCard({
  title,
  count,
  color,
}: {
  title: string;
  count: number;
  color: "green" | "yellow" | "red";
}) {
  const colors = {
    green: "bg-green-50 text-green-700 border-green-200",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
    red: "bg-red-50 text-red-700 border-red-200",
  };

  const darkColors = {
    green: "dark:bg-green-900/20 dark:text-green-400 dark:border-green-700",
    yellow: "dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-700",
    red: "dark:bg-red-900/20 dark:text-red-400 dark:border-red-700",
  };

  return (
    <div
      className={`rounded-lg border p-3 text-center sm:p-4 ${colors[color]} ${darkColors[color]}`}
    >
      <p className="mb-1 text-sm font-medium">{title}</p>
      <p className="text-xl font-bold sm:text-2xl">{count}</p>
    </div>
  );
}

function RealStudentListItem({
  student,
  status,
}: {
  student: StudentProfile;
  status: "paid" | "partial" | "pending";
}) {
  const statusColors = {
    paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    partial:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    pending: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <div className="p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
            {student.firstname} {student.surname}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Class: {student.className} • ID: {student.admissionNumber}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {student.balance > 0
              ? `₦${student.balance.toLocaleString()} due`
              : "₦0"}
          </p>
          <span
            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${statusColors[status]}`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
      </div>
    </div>
  );
}

function StudentListItem() {
  // Legacy component kept for compatibility
  return (
    <div className="p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
            John Doe
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Class: JSS 3A • ID: STU001
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            ₦45,000
          </p>
          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            Partial
          </span>
        </div>
      </div>
    </div>
  );
}

function RealTransactionListItem({
  payment,
  formatTimeAgo,
}: {
  payment: Payment;
  formatTimeAgo: (date: Date | string | bigint | number) => string;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  return (
    <div className="p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Payment from {payment.studentName}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {payment.paymentMethod.replace("_", " ")} • REF: {payment.reference}{" "}
            • {formatTimeAgo(payment.createdAt)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-green-600 dark:text-green-400">
            +₦{payment.amount.toLocaleString()}
          </p>
          <span
            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(payment.status)}`}
          >
            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
          </span>
        </div>
      </div>
    </div>
  );
}

function TransactionListItem() {
  // Legacy component kept for compatibility
  return (
    <div className="p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Payment from John Doe
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Bank Transfer • REF: TXN12345 • 2 hours ago
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-green-600 dark:text-green-400">
            +₦50,000
          </p>
          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
            Completed
          </span>
        </div>
      </div>
    </div>
  );
}

// Expenses Tab Component
function ExpensesTab() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Quick Actions for Expenses */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold">Expense Management</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <ActionButton
            icon={<PlusIcon className="h-5 w-5" />}
            label="Record Expense"
            onClick={() => router.push("/expenses")}
          />
          <ActionButton
            icon={<FileTextIcon className="h-5 w-5" />}
            label="View Expenses"
            onClick={() => router.push("/expenses")}
          />
          <ActionButton
            icon={<DollarSignIcon className="h-5 w-5" />}
            label="Expense Reports"
            onClick={() => router.push("/expenses")}
          />
        </div>
      </div>

      {/* Expenses Overview */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Expense Overview</h2>
        </div>
        <div className="py-12 text-center text-gray-500 dark:text-gray-400">
          <FileTextIcon className="mx-auto mb-4 h-12 w-12 opacity-30" />
          <p className="mb-2 text-lg font-medium">Expense Management</p>
          <p className="mb-4 text-sm">
            Record, track, and manage school expenses
          </p>
          <button
            onClick={() => router.push("/expenses")}
            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Go to Expenses
          </button>
        </div>
      </div>
    </div>
  );
}

// Loading and Error States
function AccountingDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="animate-pulse">
        <div className="mb-4 h-8 w-64 rounded bg-gray-200"></div>
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-lg bg-gray-200"></div>
          ))}
        </div>
        <div className="h-96 rounded-lg bg-gray-200"></div>
      </div>
    </div>
  );
}

function ErrorState({ error }: { error: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="text-center">
        <p className="mb-4 text-red-600">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="text-center">
        <p className="mb-4 text-gray-500">No data available</p>
        <Button onClick={() => window.location.reload()}>Refresh</Button>
      </div>
    </div>
  );
}
