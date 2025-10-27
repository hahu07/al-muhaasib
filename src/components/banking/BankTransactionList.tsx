"use client";

import React from "react";
import { ArrowDownIcon, ArrowUpIcon, CheckCircleIcon, CircleIcon } from "lucide-react";
import { useSchool } from "@/contexts/SchoolContext";
import type { BankTransaction } from "@/types";

interface BankTransactionListProps {
  transactions: BankTransaction[];
  onRefresh?: () => void;
  compact?: boolean;
}

export function BankTransactionList({
  transactions,
}: BankTransactionListProps) {
  const { formatCurrency } = useSchool();

  if (transactions.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500">
        <p>No transactions found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          className="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
        >
          <div className="flex items-center gap-4">
            <div
              className={`rounded-full p-2 ${
                transaction.creditAmount > 0
                  ? "bg-green-100"
                  : "bg-red-100"
              }`}
            >
              {transaction.creditAmount > 0 ? (
                <ArrowDownIcon className="h-5 w-5 text-green-600" />
              ) : (
                <ArrowUpIcon className="h-5 w-5 text-red-600" />
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900">{transaction.description}</p>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>{new Date(transaction.transactionDate).toLocaleDateString()}</span>
                <span>•</span>
                <span className="capitalize">{transaction.transactionType}</span>
                {transaction.reference && (
                  <>
                    <span>•</span>
                    <span>{transaction.reference}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p
                className={`font-bold ${
                  transaction.creditAmount > 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {transaction.creditAmount > 0 ? "+" : "-"}
                {formatCurrency(
                  transaction.creditAmount > 0
                    ? transaction.creditAmount
                    : transaction.debitAmount
                )}
              </p>
              <p className="text-sm text-gray-600">
                Balance: {formatCurrency(transaction.balance)}
              </p>
            </div>
            {transaction.isReconciled ? (
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
            ) : (
              <CircleIcon className="h-5 w-5 text-gray-300" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
