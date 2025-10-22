"use client";

import React from "react";
import { PrinterIcon, DownloadIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Payment } from "@/types";

interface PaymentReceiptProps {
  payment: Payment;
  receiptNumber: string;
  schoolName?: string;
  schoolAddress?: string;
  schoolPhone?: string;
  onClose?: () => void;
}

export const PaymentReceipt: React.FC<PaymentReceiptProps> = ({
  payment,
  receiptNumber,
  schoolName = "Al-Muhaasib School",
  schoolAddress = "School Address Here",
  schoolPhone = "+234 XXX XXX XXXX",
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="bg-white">
      {/* Action Buttons - Hide on print */}
      <div className="mb-4 flex justify-end gap-2 print:hidden">
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <PrinterIcon className="mr-2 h-4 w-4" />
          Print
        </Button>
        {onClose && (
          <Button variant="outline" size="sm" onClick={onClose}>
            <XIcon className="mr-2 h-4 w-4" />
            Close
          </Button>
        )}
      </div>

      {/* Receipt Content */}
      <div className="rounded-lg border-2 border-gray-300 p-8 print:border-0">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600">
              <span className="text-2xl font-bold text-white">₦</span>
            </div>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            {schoolName}
          </h1>
          <p className="text-gray-600">{schoolAddress}</p>
          <p className="text-gray-600">{schoolPhone}</p>
          <div className="mt-4 border-t-2 border-gray-300 pt-4">
            <h2 className="text-xl font-semibold text-gray-900">
              PAYMENT RECEIPT
            </h2>
            <p className="mt-1 text-gray-600">Receipt No: {receiptNumber}</p>
          </div>
        </div>

        {/* Student & Payment Info */}
        <div className="mb-8 grid grid-cols-2 gap-8">
          {/* Left Column */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-500 uppercase">
              Student Information
            </h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-600">Name:</span>
                <p className="font-medium text-gray-900">
                  {payment.studentName}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Class:</span>
                <p className="font-medium text-gray-900">{payment.className}</p>
              </div>
              {payment.paidBy && (
                <div>
                  <span className="text-sm text-gray-600">Paid By:</span>
                  <p className="font-medium text-gray-900">{payment.paidBy}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-500 uppercase">
              Payment Details
            </h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-600">Date:</span>
                <p className="font-medium text-gray-900">
                  {formatDate(payment.paymentDate)}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Payment Method:</span>
                <p className="font-medium text-gray-900 capitalize">
                  {payment.paymentMethod.replace("_", " ")}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Reference:</span>
                <p className="font-medium text-gray-900">{payment.reference}</p>
              </div>
              {payment.transactionId && (
                <div>
                  <span className="text-sm text-gray-600">Transaction ID:</span>
                  <p className="text-xs font-medium text-gray-900">
                    {payment.transactionId}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fee Breakdown */}
        <div className="mb-8">
          <h3 className="mb-3 text-sm font-semibold text-gray-500 uppercase">
            Payment Breakdown
          </h3>
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="py-2 text-left text-sm font-semibold text-gray-900">
                  Fee Category
                </th>
                <th className="py-2 text-right text-sm font-semibold text-gray-900">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {payment.feeAllocations.map((allocation, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="py-3 text-gray-900">
                    {allocation.categoryName}
                  </td>
                  <td className="py-3 text-right text-gray-900">
                    {formatCurrency(allocation.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300">
                <td className="py-4 text-lg font-bold text-gray-900">
                  Total Amount Paid
                </td>
                <td className="py-4 text-right text-lg font-bold text-gray-900">
                  {formatCurrency(payment.amount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Notes */}
        {payment.notes && (
          <div className="mb-8">
            <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase">
              Notes
            </h3>
            <p className="text-sm text-gray-700 italic">{payment.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 border-t border-gray-300 pt-6">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="mb-4 text-sm text-gray-600">Received By:</p>
              <div className="border-t border-gray-400 pt-2">
                <p className="text-sm text-gray-900">Authorized Signature</p>
              </div>
            </div>
            <div>
              <p className="mb-4 text-sm text-gray-600">Date:</p>
              <div className="border-t border-gray-400 pt-2">
                <p className="text-sm text-gray-900">
                  {formatDate(payment.paymentDate)}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              This is an official receipt. Please keep for your records.
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Generated on {new Date().toLocaleString("en-NG")}
            </p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          .bg-white,
          .bg-white * {
            visibility: visible;
          }
          .bg-white {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            margin: 2cm;
            size: A4;
          }
        }
      `}</style>
    </div>
  );
};
