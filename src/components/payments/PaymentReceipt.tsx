"use client";

import React from "react";
import { PrinterIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSchool } from "@/contexts/SchoolContext";
import type { Payment } from "@/types";

interface PaymentReceiptProps {
  payment: Payment;
  receiptNumber: string;
  onClose?: () => void;
}

export const PaymentReceipt: React.FC<PaymentReceiptProps> = ({
  payment,
  receiptNumber,
  onClose,
}) => {
  const { config, formatCurrency: formatCurrencyFromContext } = useSchool();

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      config?.locale || "en-NG",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      },
    );
  };

  const formatCurrency = (amount: number) => {
    return formatCurrencyFromContext(amount);
  };

  // Get school information from config - no fallbacks, show real data only
  const schoolName = config?.schoolName || "";
  const schoolAddress = config?.address && config?.city && config?.state
    ? `${config.address}, ${config.city}, ${config.state}`
    : "";
  const schoolPhone = config?.phone || "";
  const schoolEmail = config?.email || "";
  const schoolLogo = config?.branding?.logo;
  const schoolMotto = config?.motto || "";

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
      <div className="rounded-lg border-2 border-gray-300 bg-white p-8 shadow-sm print:border-0 print:shadow-none">
        {/* Header */}
        <div className="mb-8 border-b-2 border-gray-200 pb-6 text-center">
          {/* Logo */}
          <div className="mb-4">
            {schoolLogo ? (
              <img
                src={schoolLogo}
                alt={schoolName}
                className="mx-auto h-20 w-20 object-contain"
              />
            ) : (
              <div className="mx-auto mb-2 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg">
                <span className="text-3xl font-bold text-white">
                  {schoolName.charAt(0) || "₦"}
                </span>
              </div>
            )}
          </div>
          
          {/* School Name */}
          <h1 className="mb-2 text-3xl font-bold uppercase tracking-wide text-gray-900">
            {schoolName || "School Name"}
          </h1>
          
          {/* Motto */}
          {schoolMotto && (
            <p className="mb-3 text-sm italic text-gray-600">&ldquo;{schoolMotto}&rdquo;</p>
          )}
          
          {/* Contact Info */}
          <div className="space-y-1 text-sm text-gray-600">
            {schoolAddress && <p>{schoolAddress}</p>}
            <div className="flex items-center justify-center gap-3">
              {schoolPhone && (
                <span className="flex items-center gap-1">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {schoolPhone}
                </span>
              )}
              {schoolEmail && (
                <span className="flex items-center gap-1">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {schoolEmail}
                </span>
              )}
            </div>
          </div>
          
          {/* Receipt Title */}
          <div className="mt-6">
            <div className="mx-auto inline-block rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3">
              <h2 className="text-xl font-bold uppercase tracking-wider text-white">
                PAYMENT RECEIPT
              </h2>
            </div>
            <p className="mt-3 text-sm font-medium text-gray-700">
              Receipt No: <span className="font-mono font-bold text-blue-600">{receiptNumber}</span>
            </p>
          </div>
        </div>

        {/* Student & Payment Info */}
        <div className="mb-8 grid grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-700">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Student Information
            </h3>
            <div className="space-y-3">
              <div>
                <span className="text-xs font-medium uppercase text-gray-500">Name</span>
                <p className="mt-1 text-base font-semibold text-gray-900">
                  {payment.studentName}
                </p>
              </div>
              <div>
                <span className="text-xs font-medium uppercase text-gray-500">Class</span>
                <p className="mt-1 text-base font-semibold text-gray-900">{payment.className}</p>
              </div>
              {payment.paidBy && (
                <div>
                  <span className="text-xs font-medium uppercase text-gray-500">Paid By</span>
                  <p className="mt-1 text-base font-semibold text-gray-900">{payment.paidBy}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-700">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Payment Details
            </h3>
            <div className="space-y-3">
              <div>
                <span className="text-xs font-medium uppercase text-gray-500">Date</span>
                <p className="mt-1 text-base font-semibold text-gray-900">
                  {formatDate(payment.paymentDate)}
                </p>
              </div>
              <div>
                <span className="text-xs font-medium uppercase text-gray-500">Payment Method</span>
                <p className="mt-1 text-base font-semibold capitalize text-gray-900">
                  {payment.paymentMethod.replace("_", " ")}
                </p>
              </div>
              <div>
                <span className="text-xs font-medium uppercase text-gray-500">Reference</span>
                <p className="mt-1 font-mono text-sm font-semibold text-gray-900">{payment.reference}</p>
              </div>
              {payment.transactionId && (
                <div>
                  <span className="text-xs font-medium uppercase text-gray-500">Transaction ID</span>
                  <p className="mt-1 font-mono text-xs font-medium text-gray-900">
                    {payment.transactionId}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fee Breakdown */}
        <div className="mb-8">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-700">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            Payment Breakdown
          </h3>
          <div className="overflow-hidden rounded-lg border-2 border-gray-300">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-blue-600 to-purple-600">
                  <th className="py-3 px-4 text-left text-sm font-bold uppercase tracking-wide text-white">
                    Fee Category
                  </th>
                  <th className="py-3 px-4 text-right text-sm font-bold uppercase tracking-wide text-white">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {payment.feeAllocations.map((allocation, index) => (
                  <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900">
                      {allocation.categoryName}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-gray-900">
                      {formatCurrency(allocation.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100">
                  <td className="py-4 px-4 text-lg font-bold uppercase text-gray-900">
                    Total Amount Paid
                  </td>
                  <td className="py-4 px-4 text-right text-xl font-bold text-green-600">
                    {formatCurrency(payment.amount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Notes */}
        {payment.notes && (
          <div className="mb-8 rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase text-blue-900">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Notes
            </h3>
            <p className="text-sm italic text-blue-800">{payment.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 border-t-2 border-gray-300 pt-6">
          <div className="mb-8 grid grid-cols-2 gap-8">
            <div className="rounded-lg border border-gray-300 bg-gray-50 p-4">
              <p className="mb-4 text-xs font-medium uppercase text-gray-500">Received By</p>
              <div className="h-16 border-b-2 border-dashed border-gray-400"></div>
              <p className="mt-2 text-sm text-gray-700">Authorized Signature</p>
            </div>
            <div className="rounded-lg border border-gray-300 bg-gray-50 p-4">
              <p className="mb-4 text-xs font-medium uppercase text-gray-500">Official Stamp</p>
              <div className="h-16 border-2 border-dashed border-gray-400 rounded-lg"></div>
              <p className="mt-2 text-center text-sm text-gray-700">School Stamp</p>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 p-6 text-center">
            <div className="mb-2 flex items-center justify-center gap-2">
              <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-sm font-bold text-gray-700">
                This is an official payment receipt
              </p>
            </div>
            <p className="text-xs text-gray-600">
              Please keep this receipt for your records and future reference
            </p>
            <div className="mt-4 border-t border-gray-300 pt-3">
              <p className="text-xs text-gray-500">
                Generated on {new Date().toLocaleString(config?.locale || "en-NG", {
                  dateStyle: "full",
                  timeStyle: "short",
                })}
              </p>
              {config?.website && (
                <p className="mt-1 text-xs text-blue-600">
                  {config.website}
                </p>
              )}
            </div>
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
