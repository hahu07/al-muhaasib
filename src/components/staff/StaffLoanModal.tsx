"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  TrendingUp,
} from "lucide-react";
import {
  staffLoanService,
  loanRepaymentService,
  type StaffLoan,
  type LoanRepayment,
} from "@/services/staffFinancialService";
import { useToast } from "@/hooks/use-toast";
import type { StaffMember } from "@/types";

interface StaffLoanModalProps {
  open: boolean;
  onClose: () => void;
  staffMember: StaffMember;
}

export default function StaffLoanModal({
  open,
  onClose,
  staffMember,
}: StaffLoanModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loans, setLoans] = useState<StaffLoan[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<StaffLoan | null>(null);
  const [repayments, setRepayments] = useState<LoanRepayment[]>([]);
  const [showNewLoanForm, setShowNewLoanForm] = useState(false);
  const [editingLoan, setEditingLoan] = useState<StaffLoan | null>(null);

  const [formData, setFormData] = useState({
    amount: 0,
    purpose: "",
    numberOfInstallments: 12,
    startDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (open) {
      loadLoans();
    }
  }, [open]);

  const loadLoans = async () => {
    setLoading(true);
    try {
      const staffLoans = await staffLoanService.getByStaffId(staffMember.id);
      setLoans(staffLoans);
    } catch (error) {
      console.error("Error loading loans:", error);
      toast({
        title: "Error",
        description: "Failed to load loans",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadLoanDetails = async (loan: StaffLoan) => {
    setSelectedLoan(loan);
    try {
      const loanRepayments = await loanRepaymentService.getByLoanId(loan.id);
      setRepayments(loanRepayments);
    } catch (error) {
      console.error("Error loading loan details:", error);
    }
  };

  const handleEditLoan = (loan: StaffLoan) => {
    setEditingLoan(loan);
    setFormData({
      amount: loan.amount,
      purpose: loan.purpose,
      numberOfInstallments: loan.numberOfInstallments,
      startDate: loan.startDate,
    });
    setShowNewLoanForm(true);
  };

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingLoan) {
        // Update existing loan
        const monthlyInstallment = Math.round(
          formData.amount / formData.numberOfInstallments,
        );
        await staffLoanService.update(editingLoan.id, {
          amount: formData.amount,
          purpose: formData.purpose,
          numberOfInstallments: formData.numberOfInstallments,
          monthlyInstallment,
          startDate: formData.startDate,
          updatedAt: new Date().toISOString(),
        });

        toast({
          title: "Loan Updated",
          description: `Loan has been updated successfully`,
        });
      } else {
        // Create new loan
        await staffLoanService.createLoan({
          staffId: staffMember.id,
          staffName: `${staffMember.firstname} ${staffMember.surname}`,
          staffNumber: staffMember.staffNumber,
          amount: formData.amount,
          purpose: formData.purpose,
          numberOfInstallments: formData.numberOfInstallments,
          startDate: formData.startDate,
          status: "active",
          approvedBy: "current-admin",
          approvedDate: new Date().toISOString(),
        });

        toast({
          title: "Loan Created",
          description: `Loan of ₦${formData.amount.toLocaleString()} has been approved`,
        });
      }

      setShowNewLoanForm(false);
      setEditingLoan(null);
      setFormData({
        amount: 0,
        purpose: "",
        numberOfInstallments: 12,
        startDate: new Date().toISOString().split("T")[0],
      });
      loadLoans();
    } catch (error) {
      console.error("Error saving loan:", error);
      toast({
        title: "Error",
        description: editingLoan
          ? "Failed to update loan"
          : "Failed to create loan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRemainingBalance = async (loanId: string) => {
    return await staffLoanService.getRemainingBalance(loanId);
  };

  const getStatusColor = (status: StaffLoan["status"]) => {
    switch (status) {
      case "active":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "defaulted":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-x-hidden overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Loan Management - {staffMember.firstname} {staffMember.surname}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Action Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              onClick={() => setShowNewLoanForm(!showNewLoanForm)}
              disabled={loading}
              size="lg"
              className="w-full sm:w-auto"
            >
              <DollarSign className="mr-2 h-4 w-4" />
              {showNewLoanForm ? "Cancel" : "Create New Loan"}
            </Button>
            {selectedLoan && (
              <Button variant="outline" onClick={() => setSelectedLoan(null)}>
                ← Back to List
              </Button>
            )}
          </div>

          {/* New Loan Form */}
          {showNewLoanForm && (
            <form
              onSubmit={handleCreateLoan}
              className="rounded-lg border-2 border-green-200 bg-gradient-to-br from-green-50 to-white p-6 shadow-md dark:border-green-800 dark:from-green-900/20 dark:to-gray-900"
            >
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-gray-100">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                {editingLoan ? "Edit Loan" : "Create New Loan"}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Loan Amount (₦) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="installments">Number of Installments *</Label>
                  <Input
                    id="installments"
                    type="number"
                    min="1"
                    max="60"
                    value={formData.numberOfInstallments}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        numberOfInstallments: parseInt(e.target.value) || 1,
                      })
                    }
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="purpose">Purpose *</Label>
                  <Textarea
                    id="purpose"
                    value={formData.purpose}
                    onChange={(e) =>
                      setFormData({ ...formData, purpose: e.target.value })
                    }
                    placeholder="e.g., House rent, Medical emergency, Education"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="flex items-end">
                  <div className="w-full rounded border bg-blue-50 p-3">
                    <p className="text-sm text-gray-600">Monthly Installment</p>
                    <p className="text-lg font-bold text-blue-600">
                      {formatCurrency(
                        Math.round(
                          formData.amount / formData.numberOfInstallments,
                        ),
                      )}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading
                    ? editingLoan
                      ? "Updating..."
                      : "Creating..."
                    : editingLoan
                      ? "Update Loan"
                      : "Create Loan"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowNewLoanForm(false);
                    setEditingLoan(null);
                    setFormData({
                      amount: 0,
                      purpose: "",
                      numberOfInstallments: 12,
                      startDate: new Date().toISOString().split("T")[0],
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {/* Loan List or Details */}
          {!selectedLoan ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-2">
                <Calendar className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  Loan History
                  <span className="ml-2 text-sm font-normal text-gray-600 dark:text-gray-400">
                    ({loans.length} loan{loans.length !== 1 ? 's' : ''})
                  </span>
                </h3>
              </div>
              {loans.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  <DollarSign className="mx-auto mb-4 h-12 w-12 opacity-50" />
                  <p>No loans found</p>
                </div>
              ) : (
                loans.map((loan) => (
                  <div
                    key={loan.id}
                    className="cursor-pointer rounded-lg border-2 border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-green-300 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:hover:border-green-700"
                    onClick={() => loadLoanDetails(loan)}
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">{loan.purpose}</h4>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {new Date(loan.startDate).toLocaleDateString()} • {loan.numberOfInstallments} months
                        </p>
                      </div>
                      <Badge
                        className={`${getStatusColor(loan.status)} border-2 px-3 py-1 text-xs font-bold uppercase`}
                        variant="secondary"
                      >
                        {loan.status}
                      </Badge>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-4">
                      <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Loan Amount</p>
                        <p className="mt-1 text-lg font-bold text-green-600 dark:text-green-400">
                          ₦{loan.amount.toLocaleString()}
                        </p>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Monthly Payment</p>
                        <p className="mt-1 text-lg font-bold text-blue-600 dark:text-blue-400">
                          ₦{loan.monthlyInstallment.toLocaleString()}
                        </p>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Reference</p>
                        <p className="mt-1 text-sm font-mono font-semibold text-gray-700 dark:text-gray-300">
                          {loan.id.substring(0, 8).toUpperCase()}
                        </p>
                      </div>
                    </div>
                    {loan.status === "active" && (
                      <div className="mt-3 border-t pt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditLoan(loan);
                          }}
                        >
                          Edit Loan
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-lg border bg-gray-50 p-4">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold">
                      {selectedLoan.purpose}
                    </h3>
                    <p className="text-gray-600">
                      Started:{" "}
                      {new Date(selectedLoan.startDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge
                    className={getStatusColor(selectedLoan.status)}
                    variant="secondary"
                  >
                    {selectedLoan.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="rounded-lg border-2 border-green-200 bg-white p-4 text-center shadow-sm dark:border-green-800 dark:bg-gray-800">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Principal</p>
                    <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">
                      ₦{selectedLoan.amount.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg border-2 border-blue-200 bg-white p-4 text-center shadow-sm dark:border-blue-800 dark:bg-gray-800">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly</p>
                    <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">
                      ₦{selectedLoan.monthlyInstallment.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg border-2 border-purple-200 bg-white p-4 text-center shadow-sm dark:border-purple-800 dark:bg-gray-800">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Installments</p>
                    <p className="mt-1 text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {selectedLoan.numberOfInstallments}
                    </p>
                  </div>
                  <div className="rounded-lg border-2 border-orange-200 bg-white p-4 text-center shadow-sm dark:border-orange-800 dark:bg-gray-800">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Repaid</p>
                    <p className="mt-1 text-2xl font-bold text-orange-600 dark:text-orange-400">{repayments.length}</p>
                  </div>
                </div>
              </div>

              {/* Repayment History */}
              <div>
                <h4 className="mb-3 font-semibold">
                  Repayment History ({repayments.length})
                </h4>
                {repayments.length === 0 ? (
                  <p className="py-4 text-center text-gray-500">
                    No repayments yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {repayments.map((repayment) => (
                      <div
                        key={repayment.id}
                        className="flex items-center justify-between rounded border p-3"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>
                            {new Date(
                              repayment.paymentDate,
                            ).toLocaleDateString()}
                          </span>
                          <span className="text-sm text-gray-600">
                            ({repayment.month}/{repayment.year})
                          </span>
                        </div>
                        <span className="font-semibold">
                          {formatCurrency(repayment.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
