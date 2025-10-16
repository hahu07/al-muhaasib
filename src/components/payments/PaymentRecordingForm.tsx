'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { PaymentReceipt } from './PaymentReceipt';
import { FeeAllocationComponent } from './FeeAllocationComponent';
import { enhancedPaymentService, studentFeeAssignmentService } from '@/services';
import { useAuth } from '@/contexts/AuthContext';
import type { StudentProfile, Payment, PaymentAllocation, StudentFeeAssignment } from '@/types';

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
  const [loading, setLoading] = useState(false);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showReceipt, setShowReceipt] = useState(false);
  const [completedPayment, setCompletedPayment] = useState<Payment | null>(null);
  const [feeAssignments, setFeeAssignments] = useState<StudentFeeAssignment[]>([]);
  const [paymentAllocations, setPaymentAllocations] = useState<PaymentAllocation[]>([]);

  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: 'cash' as 'cash' | 'bank_transfer' | 'pos' | 'online' | 'cheque',
    paymentDate: new Date().toISOString().split('T')[0],
    paidBy: `${student.guardianFirstname} ${student.guardianSurname}`,
    notes: '',
    reference: '',
  });

  // Load fee assignments on component mount
  useEffect(() => {
    loadFeeAssignments();
  }, [student.id]);

  const loadFeeAssignments = async () => {
    try {
      setLoadingAssignments(true);
      const assignments = await studentFeeAssignmentService.getByStudentId(student.id);
      setFeeAssignments(assignments);
    } catch (error) {
      console.error('Error loading fee assignments:', error);
    } finally {
      setLoadingAssignments(false);
    }
  };

  const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'pos', label: 'POS' },
    { value: 'online', label: 'Online Payment' },
    { value: 'cheque', label: 'Cheque' },
  ];

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    const amount = parseFloat(formData.amount);
    if (!formData.amount || isNaN(amount) || amount <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }

    // Validate against actual fee assignments balance
    const outstandingBalance = feeAssignments.reduce((sum, assignment) => 
      sum + assignment.feeItems.reduce((itemSum, item) => itemSum + item.balance, 0), 0
    );

    if (amount > outstandingBalance) {
      newErrors.amount = `Amount cannot exceed outstanding balance of ₦${outstandingBalance.toLocaleString()}`;
    }

    // Check if fee assignments exist
    if (feeAssignments.length === 0) {
      newErrors.amount = 'No fee assignments found. Please assign fees to this student first.';
    } else {
      // Only validate allocations if fee assignments exist
      if (paymentAllocations.length === 0 && amount > 0) {
        newErrors.amount = 'Please allocate the payment amount across fee categories.';
      }

      const totalAllocated = paymentAllocations.reduce((sum, alloc) => sum + alloc.amount, 0);
      if (Math.abs(totalAllocated - amount) > 0.01) {
        newErrors.amount = 'Total allocation must equal payment amount.';
      }
    }

    if (!formData.paymentDate) {
      newErrors.paymentDate = 'Payment date is required';
    }

    if (!formData.paidBy.trim()) {
      newErrors.paidBy = 'Payer name is required';
    }

    // Require reference for non-cash payments
    if (formData.paymentMethod !== 'cash' && !formData.reference.trim()) {
      newErrors.reference = 'Reference number is required for this payment method';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('Form submission started');
    console.log('Auth context state:', { user, appUser, authLoading });
    console.log('Fee assignments:', feeAssignments);
    console.log('Payment allocations:', paymentAllocations);
    console.log('Form data:', formData);

    if (!validate()) {
      console.log('Validation failed:', errors);
      return;
    }

    if (!appUser) {
      console.error('No authenticated user found');
      alert('Authentication required. Please sign in to record payments.');
      return;
    }

    try {
      setLoading(true);
      console.log('Recording payment...');

      const amount = parseFloat(formData.amount);

      // Handle case where there are no fee assignments
      if (feeAssignments.length === 0) {
        alert('Cannot record payment: No fee assignments found for this student. Please assign fees first.');
        return;
      }

      // Find the main fee assignment (assuming first one for now)
      const mainAssignment = feeAssignments[0];
      if (!mainAssignment) {
        throw new Error('No fee assignment found');
      }

      // Record the payment
      const payment = await enhancedPaymentService.recordPayment({
        studentId: student.id,
        studentName: `${student.firstname} ${student.surname}`,
        classId: student.classId,
        className: student.className,
        feeAssignmentId: mainAssignment.id,
        amount,
        paymentMethod: formData.paymentMethod,
        paymentDate: formData.paymentDate,
        feeAllocations: paymentAllocations,
        paidBy: formData.paidBy.trim(),
        notes: formData.notes.trim() || undefined,
        recordedBy: appUser.id,
      });

      // Update fee assignments with payment allocations
      try {
        await studentFeeAssignmentService.recordPayment(
          mainAssignment.id,
          amount,
          paymentAllocations.map(alloc => ({
            categoryId: alloc.categoryId,
            amount: alloc.amount
          }))
        );
        
        // Recalculate student totals
        await studentFeeAssignmentService.recalculateStudentTotals(student.id);
      } catch (assignmentError) {
        console.error('Error updating fee assignments:', assignmentError);
        // Payment was recorded, but assignment update failed - log this
      }

      // Show receipt
      setCompletedPayment(payment);
      setShowReceipt(true);
    } catch (error) {
      console.error('Error recording payment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to record payment: ${errorMessage}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Calculate actual outstanding balance from fee assignments
  const outstandingBalance = feeAssignments.reduce((sum, assignment) => 
    sum + assignment.feeItems.reduce((itemSum, item) => itemSum + item.balance, 0), 0
  );

  const quickAmounts = [
    { label: 'Full Balance', value: outstandingBalance },
    { label: '50%', value: Math.round(outstandingBalance * 0.5) },
    { label: '₦10,000', value: 10000 },
    { label: '₦20,000', value: 20000 },
    { label: '₦50,000', value: 50000 },
  ];

  // If receipt is shown, display it
  if (showReceipt && completedPayment) {
    return (
      <PaymentReceipt
        payment={completedPayment}
        receiptNumber={`RCP-${completedPayment.reference.replace('PAY-', '')}`}
        onClose={() => {
          setShowReceipt(false);
          onSuccess?.(completedPayment.id);
        }}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Student Info Summary */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {student.firstname} {student.surname}
        </h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Class:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{student.className}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Admission No:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{student.admissionNumber}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Total Fees:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
              ₦{student.totalFeesAssigned.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Paid:</span>
            <span className="ml-2 font-medium text-green-600 dark:text-green-400">
              ₦{student.totalPaid.toLocaleString()}
            </span>
          </div>
          <div className="col-span-2">
            <span className="text-gray-600 dark:text-gray-400">Outstanding Balance:</span>
            <span className="ml-2 font-bold text-red-600 dark:text-red-400 text-lg">
              ₦{outstandingBalance.toLocaleString()}
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
            name="amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={handleChange}
            error={errors.amount}
            placeholder="0.00"
            required
          />
          {/* Quick amount buttons */}
          <div className="flex flex-wrap gap-2 mt-2">
            {quickAmounts.filter(qa => qa.value <= outstandingBalance && qa.value > 0).map((qa) => (
              <button
                key={qa.label}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, amount: qa.value.toString() }))}
                className="px-3 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {qa.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Payment Method *
          </label>
          <Select 
            value={formData.paymentMethod} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value as typeof formData.paymentMethod }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent>
              {paymentMethods.map(method => (
                <SelectItem key={method.value} value={method.value}>
                  {method.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Input
          label="Payment Date"
          name="paymentDate"
          type="date"
          value={formData.paymentDate}
          onChange={handleChange}
          error={errors.paymentDate}
          required
        />

        <Input
          label="Paid By"
          name="paidBy"
          value={formData.paidBy}
          onChange={handleChange}
          error={errors.paidBy}
          helperText="Name of the person making payment"
          required
        />

        {formData.paymentMethod !== 'cash' && (
          <Input
            label="Reference Number"
            name="reference"
            value={formData.reference}
            onChange={handleChange}
            error={errors.reference}
            placeholder="Transaction reference, cheque number, etc."
            required
          />
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notes (Optional)
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Additional notes about this payment..."
          />
        </div>
      </div>

      {/* Fee Allocation */}
      {!loadingAssignments && parseFloat(formData.amount || '0') > 0 && (
        <FeeAllocationComponent
          feeAssignments={feeAssignments}
          totalPaymentAmount={parseFloat(formData.amount || '0')}
          onAllocationChange={setPaymentAllocations}
          className="border-t border-gray-200 dark:border-gray-700 pt-6"
        />
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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
