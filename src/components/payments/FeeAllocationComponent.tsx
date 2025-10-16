"use client";

import { useState, useEffect } from 'react';
import { AlertCircleIcon, CheckCircleIcon, DollarSignIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { StudentFeeAssignment, PaymentAllocation, FeeType } from '@/types';

interface FeeAllocationComponentProps {
  feeAssignments: StudentFeeAssignment[];
  totalPaymentAmount: number;
  onAllocationChange: (allocations: PaymentAllocation[]) => void;
  className?: string;
}

interface AllocationItem {
  categoryId: string;
  categoryName: string;
  type: FeeType;
  maxAmount: number;
  allocatedAmount: number;
}

export function FeeAllocationComponent({
  feeAssignments,
  totalPaymentAmount,
  onAllocationChange,
  className = '',
}: FeeAllocationComponentProps) {
  const [allocations, setAllocations] = useState<AllocationItem[]>([]);
  const [autoAllocate, setAutoAllocate] = useState(true);

  // Initialize allocations from fee assignments
  useEffect(() => {
    const allocationItems: AllocationItem[] = [];
    
    feeAssignments.forEach(assignment => {
      assignment.feeItems.forEach(item => {
        // Only include items with outstanding balance
        if (item.balance > 0) {
          allocationItems.push({
            categoryId: item.categoryId,
            categoryName: item.categoryName,
            type: item.type,
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
    newAllocations.forEach(item => {
      item.allocatedAmount = 0;
    });

    // Allocate in order of priority (mandatory fees first, then by balance amount)
    const sortedItems = [...newAllocations].sort((a, b) => {
      // Find if this is a mandatory item from fee assignments
      const aAssignment = feeAssignments.find(fa => 
        fa.feeItems.some(fi => fi.categoryId === a.categoryId)
      );
      const bAssignment = feeAssignments.find(fa => 
        fa.feeItems.some(fi => fi.categoryId === b.categoryId)
      );
      
      const aItem = aAssignment?.feeItems.find(fi => fi.categoryId === a.categoryId);
      const bItem = bAssignment?.feeItems.find(fi => fi.categoryId === b.categoryId);
      
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
      const originalItem = newAllocations.find(a => a.categoryId === item.categoryId);
      if (originalItem) {
        originalItem.allocatedAmount = allocation;
        remainingAmount -= allocation;
      }
    }

    setAllocations(newAllocations);
    updatePaymentAllocations(newAllocations);
  };

  const handleAllocationChange = (categoryId: string, amount: number) => {
    const newAllocations = allocations.map(item => 
      item.categoryId === categoryId 
        ? { ...item, allocatedAmount: Math.min(Math.max(0, amount), item.maxAmount) }
        : item
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
      .filter(item => item.allocatedAmount > 0)
      .map(item => ({
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        type: item.type,
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
      <div className={`bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
          <AlertCircleIcon className="w-5 h-5" />
          <div>
            <h4 className="font-medium">No Fee Assignments Found</h4>
            <p className="text-sm mt-1">
              This student has no fee assignments yet. Please assign fees before recording payments.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const outstandingBalance = allocations.reduce((sum, item) => sum + item.maxAmount, 0);

  if (outstandingBalance === 0) {
    return (
      <div className={`bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 text-green-800 dark:text-green-300">
          <CheckCircleIcon className="w-5 h-5" />
          <div>
            <h4 className="font-medium">All Fees Paid</h4>
            <p className="text-sm mt-1">
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
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Payment Allocation
        </h4>
        <div className="flex items-center gap-2">
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
          <label htmlFor="auto-allocate" className="text-sm text-gray-600 dark:text-gray-400">
            Auto-allocate
          </label>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Payment Amount:</span>
            <div className="font-semibold text-gray-900 dark:text-gray-100">
              ₦{totalPaymentAmount.toLocaleString()}
            </div>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Allocated:</span>
            <div className="font-semibold text-blue-600 dark:text-blue-400">
              ₦{getTotalAllocated().toLocaleString()}
            </div>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Remaining:</span>
            <div className={`font-semibold ${
              getRemainingAmount() === 0 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              ₦{getRemainingAmount().toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Validation Alert */}
      {!isValidAllocation() && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3">
          <div className="flex items-center gap-2 text-red-800 dark:text-red-300 text-sm">
            <AlertCircleIcon className="w-4 h-4" />
            <span>
              Total allocation must equal payment amount. 
              {getRemainingAmount() > 0 
                ? `Please allocate the remaining ₦${getRemainingAmount().toLocaleString()}.`
                : `Please reduce allocation by ₦${Math.abs(getRemainingAmount()).toLocaleString()}.`
              }
            </span>
          </div>
        </div>
      )}

      {/* Fee Categories */}
      <div className="space-y-3">
        <h5 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
          Allocate across fee categories:
        </h5>
        
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {allocations.map((item) => {
            const assignment = feeAssignments.find(fa => 
              fa.feeItems.some(fi => fi.categoryId === item.categoryId)
            );
            const feeItem = assignment?.feeItems.find(fi => fi.categoryId === item.categoryId);
            const isMandatory = feeItem?.isMandatory || false;

            return (
              <div key={item.categoryId} className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {item.categoryName}
                    </span>
                    {isMandatory && (
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
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
                    onChange={(e) => handleAllocationChange(item.categoryId, parseFloat(e.target.value) || 0)}
                    className="text-right"
                    placeholder="0.00"
                  />
                </div>
                
                <button
                  type="button"
                  onClick={() => handleAllocationChange(item.categoryId, item.maxAmount)}
                  className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
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
            className="px-3 py-1 text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
          >
            Auto Allocate
          </button>
          <button
            type="button"
            onClick={() => {
              const newAllocations = allocations.map(item => ({ ...item, allocatedAmount: 0 }));
              setAllocations(newAllocations);
              updatePaymentAllocations(newAllocations);
              setAutoAllocate(false);
            }}
            className="px-3 py-1 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}