"use client";

import React, { useState, useEffect } from "react";
import { CheckCircleIcon, AlertCircleIcon, RefreshCwIcon } from "lucide-react";
import { bankTransactionService, bankAccountService } from "@/services";
import { useSchool } from "@/contexts/SchoolContext";
import { useAuth } from "@/contexts/AuthContext";
import type { BankTransaction, BankAccount } from "@/types";

export function BankReconciliationUI() {
  const { formatCurrency } = useSchool();
  const { appUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [selectedTxns, setSelectedTxns] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadBankAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      loadTransactions();
    }
  }, [selectedAccount]);

  async function loadBankAccounts() {
    try {
      const accounts = await bankAccountService.getActiveAccounts();
      setBankAccounts(accounts);
      if (accounts.length > 0 && !selectedAccount) {
        setSelectedAccount(accounts[0].id);
      }
    } catch (error) {
      console.error("Error loading bank accounts:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadTransactions() {
    try {
      setLoading(true);
      const allTransactions = await bankTransactionService.getByBankAccount(selectedAccount);
      setTransactions(allTransactions);
    } catch (error) {
      console.error("Error loading transactions:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleReconcile() {
    if (!appUser || selectedTxns.size === 0) return;

    try {
      setLoading(true);
      // Mark selected transactions as reconciled
      for (const txnId of selectedTxns) {
        await bankTransactionService.markReconciled(txnId, appUser.id);
      }
      setSelectedTxns(new Set());
      await loadTransactions();
    } catch (error) {
      console.error("Error reconciling transactions:", error);
    } finally {
      setLoading(false);
    }
  }

  function toggleTransaction(id: string) {
    const newSelected = new Set(selectedTxns);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedTxns(newSelected);
  }

  const unreconciledTxns = transactions.filter(t => !t.isReconciled);
  const reconciledTxns = transactions.filter(t => t.isReconciled);

  if (loading && transactions.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCwIcon className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Bank Reconciliation</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Match and verify bank transactions
          </p>
        </div>
        <button
          onClick={loadTransactions}
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <RefreshCwIcon className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Bank Account Selector */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Bank Account
        </label>
        <select
          value={selectedAccount}
          onChange={(e) => setSelectedAccount(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        >
          {bankAccounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.bankName} - {account.accountName} ({account.accountNumber})
            </option>
          ))}
        </select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Transactions</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{transactions.length}</p>
        </div>
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-6 dark:border-orange-700 dark:bg-orange-900/20">
          <p className="text-sm text-orange-600 dark:text-orange-400">Unreconciled</p>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{unreconciledTxns.length}</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-6 dark:border-green-700 dark:bg-green-900/20">
          <p className="text-sm text-green-600 dark:text-green-400">Reconciled</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{reconciledTxns.length}</p>
        </div>
      </div>

      {/* Unreconciled Transactions */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Unreconciled Transactions ({unreconciledTxns.length})
          </h3>
          {selectedTxns.size > 0 && (
            <button
              onClick={handleReconcile}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:bg-gray-400"
            >
              <CheckCircleIcon className="h-4 w-4" />
              Reconcile Selected ({selectedTxns.size})
            </button>
          )}
        </div>

        {unreconciledTxns.length === 0 ? (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">
            <CheckCircleIcon className="mx-auto mb-2 h-12 w-12 text-green-500" />
            <p>All transactions are reconciled!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {unreconciledTxns.map((txn) => (
              <div
                key={txn.id}
                onClick={() => toggleTransaction(txn.id)}
                className={`cursor-pointer rounded-lg border p-4 transition-all ${
                  selectedTxns.has(txn.id)
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">{txn.description}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(txn.transactionDate).toLocaleDateString()} {txn.reference && `• ${txn.reference}`}
                    </p>
                  </div>
                  <div className="text-right">
                    {txn.creditAmount > 0 ? (
                      <p className="font-bold text-green-600">
                        +{formatCurrency(txn.creditAmount)}
                      </p>
                    ) : (
                      <p className="font-bold text-red-600">
                        -{formatCurrency(txn.debitAmount)}
                      </p>
                    )}
                    <p className="text-sm text-gray-500">Bal: {formatCurrency(txn.balance)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recently Reconciled */}
      {reconciledTxns.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Recently Reconciled ({reconciledTxns.slice(0, 10).length})
          </h3>
          <div className="space-y-2">
            {reconciledTxns.slice(0, 10).map((txn) => (
              <div
                key={txn.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50"
              >
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white">{txn.description}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(txn.transactionDate).toLocaleDateString()}
                  </p>
                </div>
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
