"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Banknote,
  Plus,
  Users,
  TrendingUp,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Download,
  Filter,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Receipt,
  Calculator,
  AlertTriangle,
  Building2,
  Phone,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { staffService, salaryPaymentService } from "@/services/staffService";
import type { StaffMember, SalaryPayment } from "@/types";
import { useToast } from "@/hooks/use-toast";
import SalaryPaymentForm from "./SalaryPaymentForm";

interface PayrollStats {
  totalStaff: number;
  totalGross: number;
  totalDeductions: number;
  totalNetPay: number;
  pendingPayments: number;
  approvedPayments: number;
  paidPayments: number;
  byPaymentMethod: Record<string, { count: number; amount: number }>;
}

export default function PayrollDashboard() {
  const { toast } = useToast();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [payments, setPayments] = useState<SalaryPayment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<SalaryPayment[]>([]);
  const [payrollStats, setPayrollStats] = useState<PayrollStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<SalaryPayment | null>(
    null,
  );
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);

  // Current month and year
  const currentDate = new Date();
  const currentMonth = String(currentDate.getMonth() + 1).padStart(2, "0");
  const currentYear = String(currentDate.getFullYear());

  // Filters
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "approved" | "paid"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    applyFilters();
  }, [payments, statusFilter, searchTerm]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [staffData, paymentsData, statsData] = await Promise.all([
        staffService.getActiveStaff(),
        salaryPaymentService.getByMonthAndYear(selectedMonth, selectedYear),
        salaryPaymentService.getPayrollSummary(selectedMonth, selectedYear),
      ]);

      setStaff(staffData);
      setPayments(paymentsData);
      setPayrollStats(statsData);
    } catch (error) {
      console.error("Error loading payroll data:", error);
      toast({
        title: "Error",
        description: "Failed to load payroll data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...payments];

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.staffName.toLowerCase().includes(term) ||
          p.staffNumber.toLowerCase().includes(term) ||
          p.reference.toLowerCase().includes(term),
      );
    }

    setFilteredPayments(filtered);
  };

  const handleProcessPayment = (staffId?: string) => {
    setSelectedPayment(null);
    setSelectedStaffId(staffId || "");
    setShowPaymentForm(true);
  };

  const handleEditPayment = (payment: SalaryPayment) => {
    setSelectedPayment(payment);
    setSelectedStaffId(payment.staffId);
    setShowPaymentForm(true);
  };

  const handleViewPayment = (payment: SalaryPayment) => {
    setSelectedPayment(payment);
    setShowPaymentDetails(true);
  };

  const handleApprovePayment = async (payment: SalaryPayment) => {
    try {
      await salaryPaymentService.approveSalaryPayment(
        payment.id,
        "current-admin",
      );
      toast({
        title: "Payment Approved",
        description: `Salary payment for ${payment.staffName} has been approved`,
      });
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve payment",
        variant: "destructive",
      });
    }
  };

  const handleMarkAsPaid = async (payment: SalaryPayment) => {
    try {
      await salaryPaymentService.markAsPaid(payment.id);
      toast({
        title: "Payment Completed",
        description: `Salary payment for ${payment.staffName} has been marked as paid`,
      });
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark payment as paid",
        variant: "destructive",
      });
    }
  };

  const handleFormSuccess = () => {
    setShowPaymentForm(false);
    setSelectedPayment(null);
    setSelectedStaffId("");
    loadData();
  };

  const handleExportPayments = () => {
    try {
      const monthName = monthNames[parseInt(selectedMonth) - 1];
      const exportDate = new Date().toLocaleString();

      // Calculate totals
      const totalBasicSalary = filteredPayments.reduce(
        (sum, p) => sum + p.basicSalary,
        0,
      );
      const totalGrossAmount = filteredPayments.reduce(
        (sum, p) => sum + p.totalGross,
        0,
      );
      const totalDeductionsAmount = filteredPayments.reduce(
        (sum, p) => sum + p.totalDeductions,
        0,
      );
      const totalNetPayAmount = filteredPayments.reduce(
        (sum, p) => sum + p.netPay,
        0,
      );

      // Count by status
      const pendingCount = filteredPayments.filter(
        (p) => p.status === "pending",
      ).length;
      const approvedCount = filteredPayments.filter(
        (p) => p.status === "approved",
      ).length;
      const paidCount = filteredPayments.filter(
        (p) => p.status === "paid",
      ).length;

      // Helper function to escape CSV values
      const escapeCSV = (value: string | number) => {
        const str = String(value);
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      // Build clean tabular CSV content
      const csvLines: string[] = [];

      // Title row with report header merged across columns
      csvLines.push(`"SALARY PAYMENTS REPORT - ${monthName} ${selectedYear}"`);
      csvLines.push(`"Generated: ${exportDate} | Records: ${filteredPayments.length} | Pending: ${pendingCount} | Approved: ${approvedCount} | Paid: ${paidCount}"`);
      csvLines.push(""); // Empty line

      // Data table headers with proper alignment
      const headers = [
        "No",
        "Staff Name",
        "Staff Number",
        "Reference",
        "Basic Salary",
        "Allowances",
        "Gross Pay",
        "Deductions",
        "Net Pay",
        "Method",
        "Date",
        "Status",
      ];
      csvLines.push(headers.join(","));

      // Data rows with proper number formatting (no currency symbols for spreadsheet compatibility)
      filteredPayments.forEach((payment, index) => {
        const allowancesTotal =
          payment.allowances?.reduce((sum, a) => sum + a.amount, 0) || 0;

        const row = [
          (index + 1).toString(),
          escapeCSV(payment.staffName),
          escapeCSV(payment.staffNumber),
          escapeCSV(payment.reference),
          payment.basicSalary.toFixed(2),
          allowancesTotal.toFixed(2),
          payment.totalGross.toFixed(2),
          payment.totalDeductions.toFixed(2),
          payment.netPay.toFixed(2),
          escapeCSV(payment.paymentMethod.replace("_", " ").toUpperCase()),
          new Date(payment.paymentDate).toLocaleDateString("en-GB"),
          escapeCSV(payment.status.toUpperCase()),
        ];
        csvLines.push(row.join(","));
      });

      // Footer totals row
      csvLines.push(""); // Empty line
      csvLines.push(
        [
          "",
          "",
          "",
          "TOTALS",
          totalBasicSalary.toFixed(2),
          "",
          totalGrossAmount.toFixed(2),
          totalDeductionsAmount.toFixed(2),
          totalNetPayAmount.toFixed(2),
          "",
          "",
          "",
        ].join(","),
      );

      // Summary section at bottom
      csvLines.push(""); // Empty line
      csvLines.push("Summary,Amount");
      csvLines.push(`Total Basic Salary,${totalBasicSalary.toFixed(2)}`);
      csvLines.push(`Total Allowances,${(totalGrossAmount - totalBasicSalary).toFixed(2)}`);
      csvLines.push(`Total Gross Pay,${totalGrossAmount.toFixed(2)}`);
      csvLines.push(`Total Deductions,${totalDeductionsAmount.toFixed(2)}`);
      csvLines.push(`Total Net Pay,${totalNetPayAmount.toFixed(2)}`);

      // Create CSV content
      const csvContent = csvLines.join("\n");

      // Add BOM for proper Excel/Calc UTF-8 encoding
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      const filename = `Salary_Payments_${monthName}_${selectedYear}_${new Date().getTime()}.csv`;
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Cleanup
      setTimeout(() => URL.revokeObjectURL(url), 100);

      toast({
        title: "Export Successful",
        description: `Exported ${filteredPayments.length} salary payment(s) to ${filename}`,
      });
    } catch (error) {
      console.error("Error exporting payments:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export salary payments",
        variant: "destructive",
      });
    }
  };

  const handleGeneratePayslip = async (payment: SalaryPayment) => {
    try {
      const payslipData = await salaryPaymentService.generatePayslip(
        payment.id,
      );

      // Create a printable payslip
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast({
          title: "Error",
          description: "Please allow pop-ups to generate payslip",
          variant: "destructive",
        });
        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Payslip - ${payslipData.payslipNumber}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              max-width: 800px;
              margin: 20px auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
              margin-bottom: 20px;
            }
            .info-section {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 20px;
            }
            .section {
              margin-bottom: 20px;
            }
            .section h3 {
              background: #f0f0f0;
              padding: 10px;
              margin: 0 0 10px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            table td {
              padding: 8px;
              border-bottom: 1px solid #ddd;
            }
            table td:last-child {
              text-align: right;
              font-weight: bold;
            }
            .total {
              background: #f9f9f9;
              font-weight: bold;
              font-size: 1.1em;
            }
            .net-pay {
              background: #e8f5e9;
              font-size: 1.2em;
            }
            @media print {
              body { margin: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>SALARY PAYSLIP</h1>
            <p><strong>Payslip Number:</strong> ${payslipData.payslipNumber}</p>
            <p><strong>Period:</strong> ${payslipData.formattedPeriod}</p>
          </div>

          <div class="info-section">
            <div>
              <p><strong>Employee Name:</strong> ${payslipData.payment.staffName}</p>
              <p><strong>Staff Number:</strong> ${payslipData.payment.staffNumber}</p>
            </div>
            <div>
              <p><strong>Payment Date:</strong> ${new Date(payslipData.payment.paymentDate).toLocaleDateString()}</p>
              <p><strong>Payment Method:</strong> ${payslipData.payment.paymentMethod.replace("_", " ").toUpperCase()}</p>
              <p><strong>Reference:</strong> ${payslipData.payment.reference}</p>
            </div>
          </div>

          <div class="section">
            <h3>Earnings</h3>
            <table>
              <tr>
                <td>Basic Salary</td>
                <td>₦${payslipData.payment.basicSalary.toLocaleString()}</td>
              </tr>
              ${
                payslipData.payment.allowances
                  ?.map(
                    (allowance) => `
                <tr>
                  <td>${allowance.name}</td>
                  <td>₦${allowance.amount.toLocaleString()}</td>
                </tr>
              `,
                  )
                  .join("") || ""
              }
              <tr class="total">
                <td>Total Gross</td>
                <td>₦${payslipData.payment.totalGross.toLocaleString()}</td>
              </tr>
            </table>
          </div>

          ${
            payslipData.payment.deductions &&
            payslipData.payment.deductions.length > 0
              ? `
          <div class="section">
            <h3>Deductions</h3>
            <table>
              ${payslipData.payment.deductions
                .map(
                  (deduction) => `
                <tr>
                  <td>${deduction.name}</td>
                  <td>₦${deduction.amount.toLocaleString()}</td>
                </tr>
              `,
                )
                .join("")}
              <tr class="total">
                <td>Total Deductions</td>
                <td>₦${payslipData.payment.totalDeductions.toLocaleString()}</td>
              </tr>
            </table>
          </div>
          `
              : ""
          }

          <div class="section">
            <table>
              <tr class="net-pay">
                <td><strong>NET PAY</strong></td>
                <td><strong>₦${payslipData.payment.netPay.toLocaleString()}</strong></td>
              </tr>
            </table>
          </div>

          <div style="margin-top: 40px; text-align: center;">
            <button onclick="window.print()" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;">Print Payslip</button>
          </div>

          <div style="margin-top: 60px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666;">
            <p style="font-size: 12px;">This is a computer-generated payslip and does not require a signature.</p>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();

      toast({
        title: "Payslip Generated",
        description: `Payslip ${payslipData.payslipNumber} has been generated`,
      });
    } catch (error) {
      console.error("Error generating payslip:", error);
      toast({
        title: "Error",
        description: "Failed to generate payslip",
        variant: "destructive",
      });
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

  const getStatusColor = (status: SalaryPayment["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-blue-100 text-blue-800";
      case "paid":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: SalaryPayment["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="h-3 w-3" />;
      case "approved":
        return <CheckCircle className="h-3 w-3" />;
      case "paid":
        return <Banknote className="h-3 w-3" />;
      default:
        return <XCircle className="h-3 w-3" />;
    }
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const unprocessedStaff = staff.filter(
    (s) => !payments.some((p) => p.staffId === s.id),
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading payroll data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Payroll Dashboard
          </h1>
          <p className="text-gray-600">
            Manage salary payments for {monthNames[parseInt(selectedMonth) - 1]}{" "}
            {selectedYear}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => handleProcessPayment()}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Process Salary
          </Button>
        </div>
      </div>

      {/* Period Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Payroll Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="month">Month</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthNames.map((month, index) => (
                    <SelectItem
                      key={index + 1}
                      value={String(index + 1).padStart(2, "0")}
                    >
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="year">Year</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(
                    { length: 5 },
                    (_, i) => currentDate.getFullYear() - 2 + i,
                  ).map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={loadData} className="w-full">
                Load Payroll
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {payrollStats && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Staff
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {payrollStats.totalStaff}
                  </p>
                </div>
                <div className="rounded-full bg-blue-100 p-3">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Gross
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(payrollStats.totalGross)}
                  </p>
                </div>
                <div className="rounded-full bg-green-100 p-3">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Net Pay
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatCurrency(payrollStats.totalNetPay)}
                  </p>
                </div>
                <div className="rounded-full bg-purple-100 p-3">
                  <Banknote className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Paid Payments
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {payrollStats.paidPayments}
                  </p>
                  <p className="text-xs text-gray-500">
                    {payrollStats.pendingPayments} pending,{" "}
                    {payrollStats.approvedPayments} approved
                  </p>
                </div>
                <div className="rounded-full bg-orange-100 p-3">
                  <CheckCircle className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="payments" className="space-y-6">
        <TabsList>
          <TabsTrigger value="payments">Salary Payments</TabsTrigger>
          <TabsTrigger value="unprocessed">Unprocessed Staff</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Search payments..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={statusFilter}
                    onValueChange={(value) =>
                      setStatusFilter(value as typeof statusFilter)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleExportPayments}
                    disabled={filteredPayments.length === 0}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payments List */}
          <Card>
            <CardHeader>
              <CardTitle>Salary Payments ({filteredPayments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="rounded-lg border p-4 transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                          <span className="font-semibold text-blue-600">
                            {payment.staffName
                              .split(" ")
                              .map((n) => n.charAt(0))
                              .join("")}
                          </span>
                        </div>

                        <div className="flex-1">
                          <div className="mb-1 flex items-center gap-3">
                            <h3 className="text-lg font-semibold">
                              {payment.staffName}
                            </h3>
                            <Badge
                              className={getStatusColor(payment.status)}
                              variant="secondary"
                            >
                              <span className="flex items-center gap-1">
                                {getStatusIcon(payment.status)}
                                {payment.status}
                              </span>
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 gap-2 text-sm text-gray-600 md:grid-cols-2 lg:grid-cols-4">
                            <div className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              Staff No: {payment.staffNumber}
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              Gross: {formatCurrency(payment.totalGross)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Banknote className="h-3 w-3" />
                              Net: {formatCurrency(payment.netPay)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {payment.reference}
                            </div>
                          </div>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => handleViewPayment(payment)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEditPayment(payment)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Payment
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />

                          {payment.status === "pending" && (
                            <DropdownMenuItem
                              onClick={() => handleApprovePayment(payment)}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Approve Payment
                            </DropdownMenuItem>
                          )}

                          {payment.status === "approved" && (
                            <DropdownMenuItem
                              onClick={() => handleMarkAsPaid(payment)}
                            >
                              <Banknote className="mr-2 h-4 w-4" />
                              Mark as Paid
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuItem
                            onClick={() => handleGeneratePayslip(payment)}
                          >
                            <Receipt className="mr-2 h-4 w-4" />
                            Generate Payslip
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}

                {filteredPayments.length === 0 && (
                  <div className="py-12 text-center">
                    <Banknote className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                    <h3 className="mb-2 text-lg font-medium text-gray-900">
                      No salary payments found
                    </h3>
                    <p className="mb-4 text-gray-600">
                      {searchTerm || statusFilter !== "all"
                        ? "No payments match your current filters"
                        : `No salary payments have been processed for ${monthNames[parseInt(selectedMonth) - 1]} ${selectedYear}`}
                    </p>
                    {!(searchTerm || statusFilter !== "all") && (
                      <Button onClick={() => handleProcessPayment()}>
                        <Plus className="mr-2 h-4 w-4" />
                        Process First Salary Payment
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unprocessed" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                Unprocessed Staff ({unprocessedStaff.length})
              </CardTitle>
              <p className="text-sm text-gray-600">
                Staff members who haven&apos;t received salary for{" "}
                {monthNames[parseInt(selectedMonth) - 1]} {selectedYear}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {unprocessedStaff.map((staffMember) => (
                  <div
                    key={staffMember.id}
                    className="rounded-lg border p-4 transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                          <span className="font-semibold text-orange-600">
                            {staffMember.firstname.charAt(0)}
                            {staffMember.surname.charAt(0)}
                          </span>
                        </div>

                        <div className="flex-1">
                          <h3 className="mb-1 text-lg font-semibold">
                            {staffMember.firstname} {staffMember.surname}
                          </h3>

                          <div className="grid grid-cols-1 gap-2 text-sm text-gray-600 md:grid-cols-2 lg:grid-cols-4">
                            <div className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {staffMember.position}
                              {staffMember.department &&
                                ` • ${staffMember.department}`}
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {staffMember.phone}
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {formatCurrency(
                                staffService.calculateTotalCompensation(
                                  staffMember,
                                ),
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Staff No: {staffMember.staffNumber}
                            </div>
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleProcessPayment(staffMember.id)}
                        size="sm"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Process Salary
                      </Button>
                    </div>
                  </div>
                ))}

                {unprocessedStaff.length === 0 && (
                  <div className="py-12 text-center">
                    <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-400" />
                    <h3 className="mb-2 text-lg font-medium text-gray-900">
                      All Staff Processed!
                    </h3>
                    <p className="text-gray-600">
                      All active staff members have salary payments for{" "}
                      {monthNames[parseInt(selectedMonth) - 1]} {selectedYear}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {payrollStats && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Payment Method Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Method Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(payrollStats.byPaymentMethod).map(
                      ([method, data]) => {
                        const percentage =
                          payrollStats.totalStaff > 0
                            ? (data.count / payrollStats.totalStaff) * 100
                            : 0;
                        return (
                          <div key={method} className="space-y-2">
                            <div className="flex justify-between">
                              <span className="capitalize">
                                {method.replace("_", " ")}
                              </span>
                              <span>
                                {data.count} ({percentage.toFixed(1)}%)
                              </span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-gray-200">
                              <div
                                className="h-2 rounded-full bg-blue-600 transition-all"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <div className="text-sm text-gray-600">
                              Total: {formatCurrency(data.amount)}
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Payment Status Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Status Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border bg-yellow-50 p-3">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <span>Pending</span>
                      </div>
                      <span className="font-semibold">
                        {payrollStats.pendingPayments}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border bg-blue-50 p-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                        <span>Approved</span>
                      </div>
                      <span className="font-semibold">
                        {payrollStats.approvedPayments}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border bg-green-50 p-3">
                      <div className="flex items-center gap-2">
                        <Banknote className="h-4 w-4 text-green-600" />
                        <span>Paid</span>
                      </div>
                      <span className="font-semibold">
                        {payrollStats.paidPayments}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Financial Summary */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Financial Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Total Gross Pay</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(payrollStats.totalGross)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Total Deductions</p>
                      <p className="text-2xl font-bold text-red-600">
                        {formatCurrency(payrollStats.totalDeductions)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Total Net Pay</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(payrollStats.totalNetPay)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Salary Payment Form Dialog */}
      <Dialog open={showPaymentForm} onOpenChange={setShowPaymentForm}>
        <DialogContent className="max-h-[90vh] max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {selectedPayment
                ? "Edit Salary Payment"
                : "Process Salary Payment"}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[calc(90vh-100px)] overflow-y-auto pr-2">
            <SalaryPaymentForm
              staffId={selectedStaffId}
              paymentData={selectedPayment}
              onSuccess={handleFormSuccess}
              onCancel={() => setShowPaymentForm(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Details Dialog */}
      <Dialog open={showPaymentDetails} onOpenChange={setShowPaymentDetails}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Salary Payment Details</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-6">
              {/* Staff Info */}
              <div className="flex items-center space-x-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                  <span className="text-xl font-bold text-blue-600">
                    {selectedPayment.staffName
                      .split(" ")
                      .map((n) => n.charAt(0))
                      .join("")}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">
                    {selectedPayment.staffName}
                  </h2>
                  <p className="text-gray-600">
                    Staff No: {selectedPayment.staffNumber}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Badge
                      className={getStatusColor(selectedPayment.status)}
                      variant="secondary"
                    >
                      <span className="flex items-center gap-1">
                        {getStatusIcon(selectedPayment.status)}
                        {selectedPayment.status}
                      </span>
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <h3 className="mb-3 font-semibold">Payment Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reference:</span>
                      <span>{selectedPayment.reference}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Period:</span>
                      <span>
                        {monthNames[parseInt(selectedPayment.month) - 1]}{" "}
                        {selectedPayment.year}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Method:</span>
                      <span className="capitalize">
                        {selectedPayment.paymentMethod.replace("_", " ")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Date:</span>
                      <span>
                        {new Date(
                          selectedPayment.paymentDate,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 font-semibold">Financial Breakdown</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Basic Salary:</span>
                      <span className="font-semibold">
                        {formatCurrency(selectedPayment.basicSalary)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Gross:</span>
                      <span className="font-semibold">
                        {formatCurrency(selectedPayment.totalGross)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Deductions:</span>
                      <span className="font-semibold text-red-600">
                        -{formatCurrency(selectedPayment.totalDeductions)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-semibold text-gray-600">
                        Net Pay:
                      </span>
                      <span className="font-bold text-green-600">
                        {formatCurrency(selectedPayment.netPay)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Allowances */}
              {selectedPayment.allowances &&
                selectedPayment.allowances.length > 0 && (
                  <div>
                    <h3 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">
                      Allowances
                    </h3>
                    <div className="space-y-2">
                      {selectedPayment.allowances.map((allowance, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-lg border border-green-200 bg-green-100 p-3 dark:border-green-700 dark:bg-green-900/30"
                        >
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {allowance.name}
                          </span>
                          <span className="font-bold text-green-700 dark:text-green-400">
                            +{formatCurrency(allowance.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Statutory Deductions */}
              {selectedPayment.statutoryDeductions && (
                <div>
                  <h3 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">
                    Statutory Deductions
                  </h3>
                  <div className="space-y-2">
                    {selectedPayment.statutoryDeductions.nhf > 0 && (
                      <div className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-700 dark:bg-orange-900/30">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          NHF (2.5%)
                        </span>
                        <span className="font-bold text-orange-700 dark:text-orange-400">
                          -{formatCurrency(selectedPayment.statutoryDeductions.nhf)}
                        </span>
                      </div>
                    )}
                    {selectedPayment.statutoryDeductions.pensionEmployee > 0 && (
                      <div className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-700 dark:bg-orange-900/30">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          Pension - Employee (8%)
                        </span>
                        <span className="font-bold text-orange-700 dark:text-orange-400">
                          -{formatCurrency(selectedPayment.statutoryDeductions.pensionEmployee)}
                        </span>
                      </div>
                    )}
                    {selectedPayment.statutoryDeductions.pensionEmployer > 0 && (
                      <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-700 dark:bg-blue-900/30">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          Pension - Employer (10%)
                        </span>
                        <span className="font-bold text-blue-700 dark:text-blue-400">
                          {formatCurrency(selectedPayment.statutoryDeductions.pensionEmployer)}
                        </span>
                      </div>
                    )}
                    {selectedPayment.statutoryDeductions.nhis > 0 && (
                      <div className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-700 dark:bg-orange-900/30">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          NHIS (5%)
                        </span>
                        <span className="font-bold text-orange-700 dark:text-orange-400">
                          -{formatCurrency(selectedPayment.statutoryDeductions.nhis)}
                        </span>
                      </div>
                    )}
                    {selectedPayment.statutoryDeductions.paye > 0 && (
                      <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-700 dark:bg-red-900/30">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          PAYE Tax
                        </span>
                        <span className="font-bold text-red-700 dark:text-red-400">
                          -{formatCurrency(selectedPayment.statutoryDeductions.paye)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between rounded-lg border border-gray-300 bg-gray-100 p-3 dark:border-gray-600 dark:bg-gray-800">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        Total Statutory (Employee)
                      </span>
                      <span className="font-bold text-gray-900 dark:text-gray-100">
                        -{formatCurrency(selectedPayment.statutoryDeductions.totalEmployeeDeductions)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Other Deductions */}
              {selectedPayment.deductions &&
                selectedPayment.deductions.filter(d => !d.isStatutory).length > 0 && (
                  <div>
                    <h3 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">
                      Other Deductions
                    </h3>
                    <div className="space-y-2">
                      {selectedPayment.deductions
                        .filter(d => !d.isStatutory)
                        .map((deduction, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-lg border border-red-200 bg-red-100 p-3 dark:border-red-700 dark:bg-red-900/30"
                        >
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {deduction.name}
                          </span>
                          <span className="font-bold text-red-700 dark:text-red-400">
                            -{formatCurrency(deduction.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
