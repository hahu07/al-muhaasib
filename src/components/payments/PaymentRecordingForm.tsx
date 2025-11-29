"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getPaymentFormSchema, type PaymentFormValues } from "@/validation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PaymentReceipt } from "./PaymentReceipt";
import { FeeAllocationComponent } from "./FeeAllocationComponent";
import {
  enhancedPaymentService,
  studentFeeAssignmentService,
} from "@/services";
import { useAuth } from "@/contexts/AuthContext";
import { useSchool } from "@/contexts/SchoolContext";
import type {
  StudentProfile,
  Payment,
  PaymentAllocation,
  StudentFeeAssignment,
} from "@/types";

interface PaymentRecordingFormProps {
  student: StudentProfile;
  onSuccess?: (paymentId: string) => void;
  onCancel?: () => void;
}

export const PaymentRecordingForm: React.FC<PaymentRecordingFormProps> = ({
  student,
  onSuccess,
  onCancel,
}) => {
  const { user, appUser, loading: authLoading } = useAuth();
  const { formatCurrency, config } = useSchool();
  const [loading, setLoading] = useState(false);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [showReceipt, setShowReceipt] = useState(false);
  const [completedPayment, setCompletedPayment] = useState<Payment | null>(
    null,
  );
  const [feeAssignments, setFeeAssignments] = useState<StudentFeeAssignment[]>(
    [],
  );
  const [paymentAllocations, setPaymentAllocations] = useState<
    PaymentAllocation[]
  >([]);

  const outstandingBalance = useMemo(
    () =>
      feeAssignments.reduce(
        (sum, assignment) =>
          sum +
          assignment.feeItems.reduce(
            (itemSum, item) => itemSum + item.balance,
            0,
          ),
        0,
      ),
    [feeAssignments],
  );

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(getPaymentFormSchema(outstandingBalance)),
    defaultValues: {
      amount: 0,
      paymentMethod: "cash",
      paymentDate: new Date().toISOString().split("T")[0],
      paidBy: `${student.guardianFirstname} ${student.guardianSurname}`,
      notes: "",
      reference: "",
    },
  });

  // Load fee assignments on component mount
  useEffect(() => {
    loadFeeAssignments();
  }, [student.id]);

  const loadFeeAssignments = async () => {
    try {
      setLoadingAssignments(true);
      const assignments = await studentFeeAssignmentService.getByStudentId(
        student.id,
      );
      setFeeAssignments(assignments);
    } catch (error) {
      console.error("Error loading fee assignments:", error);
    } finally {
      setLoadingAssignments(false);
    }
  };

  const allPaymentMethods = [
    { value: "cash", label: "Cash" },
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "pos", label: "POS" },
    { value: "online", label: "Online Payment" },
    { value: "cheque", label: "Cheque" },
  ];

  // Filter payment methods based on school config
  const paymentMethods = React.useMemo(() => {
    if (!config?.defaultPaymentMethods || config.defaultPaymentMethods.length === 0) {
      console.log('[PaymentForm] No payment methods configured, showing all');
      return allPaymentMethods;
    }
    
    console.log('[PaymentForm] Enabled payment methods:', config.defaultPaymentMethods);
    const filtered = allPaymentMethods.filter(method => 
      config.defaultPaymentMethods.includes(method.value as any)
    );
    console.log('[PaymentForm] Filtered methods:', filtered.map(m => m.value));
    return filtered;
  }, [config?.defaultPaymentMethods]);

  // Update payment method if current value is not in enabled methods
  useEffect(() => {
    const currentMethod = watch('paymentMethod');
    const isCurrentMethodEnabled = paymentMethods.some(m => m.value === currentMethod);
    
    if (!isCurrentMethodEnabled && paymentMethods.length > 0) {
      console.log('[PaymentForm] Current method not enabled, switching to:', paymentMethods[0].value);
      setValue('paymentMethod', paymentMethods[0].value as any);
    }
  }, [paymentMethods, watch, setValue]);

  const onSubmit = async (values: PaymentFormValues) => {
    console.log("Form submission started");
    console.log("Auth context state:", { user, appUser, authLoading });
    console.log("Fee assignments:", feeAssignments);
    console.log("Payment allocations:", paymentAllocations);
    console.log("Form data:", values);

    // Additional UI-level checks related to allocations and assignments
    if (feeAssignments.length === 0) {
      alert(
        "Cannot record payment: No fee assignments found for this student. Please assign fees first.",
      );
      return;
    }

    if (paymentAllocations.length === 0 && values.amount > 0) {
      alert("Please allocate the payment amount across fee categories.");
      return;
    }

    const totalAllocated = paymentAllocations.reduce(
      (sum, alloc) => sum + alloc.amount,
      0,
    );
    if (Math.abs(totalAllocated - values.amount) > 0.01) {
      alert("Total allocation must equal payment amount.");
      return;
    }

    if (!appUser) {
      console.error("No authenticated user found");
      alert("Authentication required. Please sign in to record payments.");
      return;
    }

    try {
      setLoading(true);
      console.log("Recording payment...");

      // Find the main fee assignment (assuming first one for now)
      const mainAssignment = feeAssignments[0];
      if (!mainAssignment) {
        throw new Error("No fee assignment found");
      }

      // Record the payment
      const payment = await enhancedPaymentService.recordPayment({
        studentId: student.id,
        studentName: `${student.firstname} ${student.surname}`,
        classId: student.classId,
        className: student.className,
        feeAssignmentId: mainAssignment.id,
        amount: values.amount,
        paymentMethod: values.paymentMethod,
        paymentDate: values.paymentDate,
        feeAllocations: paymentAllocations,
        paidBy: values.paidBy.trim(),
        notes: values.notes?.trim() || undefined,
        recordedBy: appUser.id,
      });

      // Update fee assignments with payment allocations
      try {
        await studentFeeAssignmentService.recordPayment(
          mainAssignment.id,
          values.amount,
          paymentAllocations.map((alloc) => ({
            categoryId: alloc.categoryId,
            amount: alloc.amount,
          })),
        );

        // Recalculate student totals
        await studentFeeAssignmentService.recalculateStudentTotals(student.id);
      } catch (assignmentError) {
        console.error("Error updating fee assignments:", assignmentError);
        // Payment was recorded, but assignment update failed - log this
      }

      // Show receipt
      setCompletedPayment(payment);
      setShowReceipt(true);
    } catch (error) {
      console.error("Error recording payment:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      alert(`Failed to record payment: ${errorMessage}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  // Quick fill helpers
  const quickAmounts = [
    { label: "Full Balance", value: outstandingBalance },
    { label: "50%", value: Math.round(outstandingBalance * 0.5) },
    { label: "₦10,000", value: 10000 },
    { label: "₦20,000", value: 20000 },
    { label: "₦50,000", value: 50000 },
  ];

  // keep quickAmounts defined above

  // If receipt is shown, display it
  if (showReceipt && completedPayment) {
    return (
      <PaymentReceipt
        payment={completedPayment}
        receiptNumber={`RCP-${completedPayment.reference.replace("PAY-", "")}`}
        onClose={() => {
          setShowReceipt(false);
          onSuccess?.(completedPayment.id);
        }}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Student Info Summary */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <h4 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">
          {student.firstname} {student.surname}
        </h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Class:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
              {student.className}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">
              Admission No:
            </span>
            <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
              {student.admissionNumber}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">
              Total Fees:
            </span>
            <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
              {formatCurrency(student.totalFeesAssigned)}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Paid:</span>
            <span className="ml-2 font-medium text-green-600 dark:text-green-400">
              {formatCurrency(student.totalPaid)}
            </span>
          </div>
          <div className="col-span-2">
            <span className="text-gray-600 dark:text-gray-400">
              Outstanding Balance:
            </span>
            <span className="ml-2 text-lg font-bold text-red-600 dark:text-red-400">
              {formatCurrency(outstandingBalance)}
            </span>
            {loadingAssignments && (
              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                Loading...
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Payment Details */}
      <div className="space-y-4">
        <div>
          <Input
            label="Amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            required
            {...register("amount", { valueAsNumber: true })}
            error={errors.amount?.message}
          />
          {/* Quick amount buttons */}
          <div className="mt-2 flex flex-wrap gap-2">
            {quickAmounts
              .filter((qa) => qa.value <= outstandingBalance && qa.value > 0)
              .map((qa) => (
                <button
                  key={qa.label}
                  type="button"
                  onClick={() =>
                    setValue("amount", qa.value, { shouldValidate: true })
                  }
                  className="rounded-md bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  {qa.label}
                </button>
              ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Payment Method *
          </label>
          <Controller
            control={control}
            name="paymentMethod"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <Input
          label="Payment Date"
          type="date"
          required
          {...register("paymentDate")}
          error={errors.paymentDate?.message}
        />

        <Input
          label="Paid By"
          helperText="Name of the person making payment"
          required
          {...register("paidBy")}
          error={errors.paidBy?.message}
        />

        {watch("paymentMethod") !== "cash" && (
          <Input
            label="Reference Number"
            placeholder="Transaction reference, cheque number, etc."
            required
            {...register("reference")}
            error={errors.reference?.message}
          />
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Notes (Optional)
          </label>
          <textarea
            rows={3}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            placeholder="Additional notes about this payment..."
            {...register("notes")}
          />
        </div>
      </div>

      {/* Fee Allocation */}
      {!loadingAssignments && (watch("amount") || 0) > 0 && (
        <FeeAllocationComponent
          feeAssignments={feeAssignments}
          totalPaymentAmount={watch("amount") || 0}
          onAllocationChange={setPaymentAllocations}
          className="border-t border-gray-200 pt-6 dark:border-gray-700"
        />
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={loading}>
          Record Payment
        </Button>
      </div>
    </form>
  );
};
