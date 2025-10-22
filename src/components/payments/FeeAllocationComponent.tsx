"use client";

import { useState, useEffect } from "react";
import { AlertCircleIcon, CheckCircleIcon, DollarSignIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { StudentFeeAssignment, PaymentAllocation, FeeType } from "@/types";

interface FeeAllocationComponentProps {
  feeAssignments: StudentFeeAssignment[];
  totalPaymentAmount: number;
  onAllocationChange: (allocations: PaymentAllocation[]) => void;
  className?: string;
}

interface AllocationItem {
  categoryId: string;
  categoryName: string;
  feeType: FeeType;
  maxAmount: number;
  allocatedAmount: number;
}

export function FeeAllocationComponent({
  feeAssignments,
  totalPaymentAmount,
  onAllocationChange,
  className = "",
}: FeeAllocationComponentProps) {
  const [allocations, setAllocations] = useState<AllocationItem[]>([]);
  const [autoAllocate, setAutoAllocate] = useState(true);

  // Initialize allocations from fee assignments
  useEffect(() => {
    const allocationItems: AllocationItem[] = [];

    feeAssignments.forEach((assignment) => {
      assignment.feeItems.forEach((item) => {
        // Only include items with outstanding balance
        if (item.balance > 0) {
          allocationItems.push({
            categoryId: item.categoryId,
            categoryName: item.categoryName,
            feeType: item.type,
            maxAmount: item.balance,
            allocatedAmount: 0,
          });
        }
      });
    });

    setAllocations(allocationItems);
  }, [feeAssignments]);

  // Auto-allocate payment amount when enabled
  useEffect(() => {
    if (autoAllocate && totalPaymentAmount > 0 && allocations.length > 0) {
      autoAllocateAmount(totalPaymentAmount);
    }
  }, [totalPaymentAmount, allocations.length, autoAllocate]);

  const autoAllocateAmount = (amount: number) => {
    let remainingAmount = amount;
    const newAllocations = [...allocations];

    // Reset all allocations first
    newAllocations.forEach((item) => {
      item.allocatedAmount = 0;
    });

    // Allocate in order of priority (mandatory fees first, then by balance amount)
    const sortedItems = [...newAllocations].sort((a, b) => {
      // Find if this is a mandatory item from fee assignments
      const aAssignment = feeAssignments.find((fa) =>
        fa.feeItems.some((fi) => fi.categoryId === a.categoryId),
      );
      const bAssignment = feeAssignments.find((fa) =>
        fa.feeItems.some((fi) => fi.categoryId === b.categoryId),
      );

      const aItem = aAssignment?.feeItems.find(
        (fi) => fi.categoryId === a.categoryId,
      );
      const bItem = bAssignment?.feeItems.find(
        (fi) => fi.categoryId === b.categoryId,
      );

      const aMandatory = aItem?.isMandatory || false;
      const bMandatory = bItem?.isMandatory || false;

      // Mandatory fees first
      if (aMandatory !== bMandatory) {
        return aMandatory ? -1 : 1;
      }

      // Then by balance amount (higher first)
      return b.maxAmount - a.maxAmount;
    });

    // Allocate amounts
    for (const item of sortedItems) {
      if (remainingAmount <= 0) break;

      const allocation = Math.min(remainingAmount, item.maxAmount);
      const originalItem = newAllocations.find(
        (a) => a.categoryId === item.categoryId,
      );
      if (originalItem) {
        originalItem.allocatedAmount = allocation;
        remainingAmount -= allocation;
      }
    }

    setAllocations(newAllocations);
    updatePaymentAllocations(newAllocations);
  };

  const handleAllocationChange = (categoryId: string, amount: number) => {
    const newAllocations = allocations.map((item) =>
      item.categoryId === categoryId
        ? {
            ...item,
            allocatedAmount: Math.min(Math.max(0, amount), item.maxAmount),
          }
        : item,
    );

    setAllocations(newAllocations);
    updatePaymentAllocations(newAllocations);

    // Disable auto-allocate when user manually changes amounts
    if (autoAllocate) {
      setAutoAllocate(false);
    }
  };

  const updatePaymentAllocations = (allocationItems: AllocationItem[]) => {
    const paymentAllocations: PaymentAllocation[] = allocationItems
      .filter((item) => item.allocatedAmount > 0)
      .map((item) => ({
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        feeType: item.feeType,
        amount: item.allocatedAmount,
      }));

    onAllocationChange(paymentAllocations);
  };

  const getTotalAllocated = () => {
    return allocations.reduce((sum, item) => sum + item.allocatedAmount, 0);
  };

  const getRemainingAmount = () => {
    return totalPaymentAmount - getTotalAllocated();
  };

  const isValidAllocation = () => {
    return getTotalAllocated() === totalPaymentAmount;
  };

  if (feeAssignments.length === 0) {
    return (
      <div
        className={`rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-900/20 ${className}`}
      >
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
          <AlertCircleIcon className="h-5 w-5" />
          <div>
            <h4 className="font-medium">No Fee Assignments Found</h4>
            <p className="mt-1 text-sm">
              This student has no fee assignments yet. Please assign fees before
              recording payments.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const outstandingBalance = allocations.reduce(
    (sum, item) => sum + item.maxAmount,
    0,
  );

  if (outstandingBalance === 0) {
    return (
      <div
        className={`rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-700 dark:bg-green-900/20 ${className}`}
      >
        <div className="flex items-center gap-2 text-green-800 dark:text-green-300">
          <CheckCircleIcon className="h-5 w-5" />
          <div>
            <h4 className="font-medium">All Fees Paid</h4>
            <p className="mt-1 text-sm">
              This student has no outstanding fee balance.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="rounded-lg border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 dark:border-blue-700 dark:from-blue-900/20 dark:to-indigo-900/20">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h4 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-gray-100">
              <svg
                className="h-5 w-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              Payment Allocation
            </h4>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Distribute this payment across fee categories
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800">
            <input
              type="checkbox"
              id="auto-allocate"
              checked={autoAllocate}
              onChange={(e) => {
                setAutoAllocate(e.target.checked);
                if (e.target.checked) {
                  autoAllocateAmount(totalPaymentAmount);
                }
              }}
              className="rounded border-gray-300 dark:border-gray-600"
            />
            <label
              htmlFor="auto-allocate"
              className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Auto-allocate
            </label>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
          <div>
            <span className="text-xs tracking-wide text-gray-600 uppercase dark:text-gray-400">
              Payment Amount
            </span>
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
              ₦{totalPaymentAmount.toLocaleString()}
            </div>
          </div>
          <div>
            <span className="text-xs tracking-wide text-gray-600 uppercase dark:text-gray-400">
              Allocated
            </span>
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
              ₦{getTotalAllocated().toLocaleString()}
            </div>
          </div>
          <div>
            <span className="text-xs tracking-wide text-gray-600 uppercase dark:text-gray-400">
              Remaining
            </span>
            <div
              className={`text-lg font-bold ${
                getRemainingAmount() === 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              ₦{getRemainingAmount().toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Validation Alert */}
      {!isValidAllocation() && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-700 dark:bg-red-900/20">
          <div className="flex items-center gap-2 text-sm text-red-800 dark:text-red-300">
            <AlertCircleIcon className="h-4 w-4" />
            <span>
              Total allocation must equal payment amount.
              {getRemainingAmount() > 0
                ? `Please allocate the remaining ₦${getRemainingAmount().toLocaleString()}.`
                : `Please reduce allocation by ₦${Math.abs(getRemainingAmount()).toLocaleString()}.`}
            </span>
          </div>
        </div>
      )}

      {/* Fee Categories */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h5 className="font-semibold text-gray-900 dark:text-gray-100">
            Fee Categories ({allocations.length})
          </h5>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Adjust amounts per category or use &quot;Max&quot; button
          </span>
        </div>

        <div className="max-h-64 space-y-2 overflow-y-auto">
          {allocations.map((item) => {
            const assignment = feeAssignments.find((fa) =>
              fa.feeItems.some((fi) => fi.categoryId === item.categoryId),
            );
            const feeItem = assignment?.feeItems.find(
              (fi) => fi.categoryId === item.categoryId,
            );
            const isMandatory = feeItem?.isMandatory || false;

            return (
              <div
                key={item.categoryId}
                className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-600"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {item.categoryName}
                    </span>
                    {isMandatory && (
                      <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
                        Required
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Balance: ₦{item.maxAmount.toLocaleString()}
                  </div>
                </div>

                <div className="w-32">
                  <Input
                    type="number"
                    min="0"
                    max={item.maxAmount}
                    step="0.01"
                    value={item.allocatedAmount.toString()}
                    onChange={(e) =>
                      handleAllocationChange(
                        item.categoryId,
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    className="text-right"
                    placeholder="0.00"
                  />
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleAllocationChange(item.categoryId, item.maxAmount)
                  }
                  className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  disabled={item.maxAmount === 0}
                >
                  Max
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Allocation Buttons */}
      {totalPaymentAmount > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setAutoAllocate(true);
              autoAllocateAmount(totalPaymentAmount);
            }}
            className="rounded-md bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
          >
            Auto Allocate
          </button>
          <button
            type="button"
            onClick={() => {
              const newAllocations = allocations.map((item) => ({
                ...item,
                allocatedAmount: 0,
              }));
              setAllocations(newAllocations);
              updatePaymentAllocations(newAllocations);
              setAutoAllocate(false);
            }}
            className="rounded-md bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}
