"use client";

import React, { useState, useEffect } from "react";
import {
  BanknoteIcon,
  ArrowRightLeft,
  FileTextIcon,
  RefreshCwIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  PlusCircle,
  Eye,
  EyeOff,
  Power,
  MoreVertical,
} from "lucide-react";
import { bankAccountService, bankTransactionService, interAccountTransferService } from "@/services";
import { useAuth } from "@/contexts/AuthContext";
import { useSchool } from "@/contexts/SchoolContext";
import type { BankAccount, BankTransaction, InterAccountTransfer } from "@/types";
import { BankTransactionList } from "./BankTransactionList";
import { InterAccountTransferForm } from "./InterAccountTransferForm";
import { AddBankAccountForm } from "./AddBankAccountForm";

export function BankAccountsDashboard() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<BankTransaction[]>([]);
  const [pendingTransfers, setPendingTransfers] = useState<InterAccountTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [showAddAccountForm, setShowAddAccountForm] = useState(false);
  const [selectedAccountId] = useState<string | null>(null);
  const [hiddenBalances, setHiddenBalances] = useState<Set<string>>(new Set());
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [hideTotalBalance, setHideTotalBalance] = useState(false);

  const { appUser: _appUser } = useAuth();
  const { formatCurrency } = useSchool();

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowMenu(null);
    if (showMenu) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showMenu]);

  async function loadDashboardData() {
    try {
      setLoading(true);
      const [accountsData, transactionsData, transfersData] = await Promise.all([
        bankAccountService.list(), // Load all accounts (active and inactive)
        bankTransactionService.list(),
        interAccountTransferService.list(),
      ]);

      setAccounts(accountsData);
      
      // Get recent transactions (last 10)
      const sorted = transactionsData
        .sort((a, b) => b.transactionDate.localeCompare(a.transactionDate))
        .slice(0, 10);
      setRecentTransactions(sorted);

      // Get pending transfers
      const pending = transfersData.filter((t) => t.status === "pending");
      setPendingTransfers(pending);
    } catch (error) {
      console.error("Error loading banking dashboard:", error);
    } finally {
      setLoading(false);
    }
  }

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const activeAccountsCount = accounts.filter((a) => a.isActive).length;

  // Calculate today's activity
  const today = new Date().toISOString().split("T")[0];
  const todayTransactions = recentTransactions.filter((t) =>
    t.transactionDate.startsWith(today)
  );
  const todayInflow = todayTransactions.reduce((sum, t) => sum + t.creditAmount, 0);
  const todayOutflow = todayTransactions.reduce((sum, t) => sum + t.debitAmount, 0);

  // Unreconciled count
  const unreconciledCount = recentTransactions.filter((t) => !t.isReconciled).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex h-64 items-center justify-center">
            <div className="flex items-center gap-3">
              <RefreshCwIcon className="h-6 w-6 animate-spin text-blue-600" />
              <span className="text-lg text-gray-600">Loading banking dashboard...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-6 dark:from-gray-900 dark:to-gray-800">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Banking Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Monitor your bank accounts, transactions, and reconciliations
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={loadDashboardData}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <RefreshCwIcon className="h-4 w-4" />
              Refresh
            </button>
            <button
              onClick={() => setShowAddAccountForm(true)}
              className="flex items-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 shadow-sm transition-all hover:bg-blue-100 hover:shadow dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
            >
              <PlusCircle className="h-4 w-4" />
              Add Account
            </button>
            <button
              onClick={() => setShowTransferForm(true)}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:from-blue-700 hover:to-blue-800 hover:shadow-lg"
            >
              <ArrowRightLeft className="h-4 w-4" />
              New Transfer
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg dark:border-gray-700 dark:bg-gray-800">
            <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 transform rounded-full bg-blue-50 opacity-50 dark:bg-blue-900/20"></div>
            <div className="relative">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Total Balance</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setHideTotalBalance(!hideTotalBalance)}
                    className="rounded-lg p-1.5 text-gray-500 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
                    title={hideTotalBalance ? "Show balance" : "Hide balance"}
                  >
                    {hideTotalBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-2.5 shadow-lg">
                    <BanknoteIcon className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {hideTotalBalance ? "••••••••" : formatCurrency(totalBalance)}
              </p>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Across {activeAccountsCount} account{activeAccountsCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg dark:border-gray-700 dark:bg-gray-800">
            <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 transform rounded-full bg-green-50 opacity-50 dark:bg-green-900/20"></div>
            <div className="relative">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Today&apos;s Inflow</p>
                <div className="rounded-xl bg-gradient-to-br from-green-500 to-green-600 p-2.5 shadow-lg">
                  <TrendingUpIcon className="h-5 w-5 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-green-600 dark:text-green-500">
                {formatCurrency(todayInflow)}
              </p>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {todayTransactions.filter(t => t.creditAmount > 0).length} transaction{todayTransactions.filter(t => t.creditAmount > 0).length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg dark:border-gray-700 dark:bg-gray-800">
            <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 transform rounded-full bg-red-50 opacity-50 dark:bg-red-900/20"></div>
            <div className="relative">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Today&apos;s Outflow</p>
                <div className="rounded-xl bg-gradient-to-br from-red-500 to-red-600 p-2.5 shadow-lg">
                  <TrendingDownIcon className="h-5 w-5 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-red-600 dark:text-red-500">
                {formatCurrency(todayOutflow)}
              </p>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {todayTransactions.filter(t => t.debitAmount > 0).length} transaction{todayTransactions.filter(t => t.debitAmount > 0).length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg dark:border-gray-700 dark:bg-gray-800">
            <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 transform rounded-full bg-orange-50 opacity-50 dark:bg-orange-900/20"></div>
            <div className="relative">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Unreconciled</p>
                <div className="rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 p-2.5 shadow-lg">
                  <FileTextIcon className="h-5 w-5 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-500">
                {unreconciledCount}
              </p>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Needs reconciliation
              </p>
            </div>
          </div>
        </div>

        {/* Bank Accounts */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Bank Accounts</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {activeAccountsCount} active {activeAccountsCount === 1 ? "account" : "accounts"}
              </p>
            </div>
          </div>

          {accounts.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 py-16 text-center dark:border-gray-600 dark:bg-gray-900/50">
              <BanknoteIcon className="mx-auto mb-4 h-16 w-16 text-gray-400 dark:text-gray-500" />
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">No Bank Accounts</h3>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">Add bank accounts in the accounting module to get started</p>
              <a
                href="/dashboard/accounting/coa"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                Go to Chart of Accounts
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className={`group flex items-center justify-between rounded-xl border p-5 transition-all ${
                    account.isActive
                      ? "border-gray-200 bg-gradient-to-r from-white to-gray-50/50 hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:from-gray-800 dark:to-gray-800/50 dark:hover:border-blue-600"
                      : "border-gray-300 bg-gray-100 opacity-60 dark:border-gray-600 dark:bg-gray-900"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl shadow-md ${
                      account.isActive
                        ? "bg-gradient-to-br from-blue-500 to-blue-600"
                        : "bg-gray-400 dark:bg-gray-600"
                    }`}>
                      <BanknoteIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{account.accountName}</h3>
                        {!account.isActive && (
                          <span className="rounded-full bg-gray-500 px-2 py-0.5 text-xs font-medium text-white">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {account.bankName} • <span className="font-mono">{account.accountNumber}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {hiddenBalances.has(account.id) ? "••••••" : formatCurrency(account.balance)}
                      </p>
                      <p className="mt-1 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{account.accountType}</p>
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => setShowMenu(showMenu === account.id ? null : account.id)}
                        className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <MoreVertical className="h-5 w-5 text-gray-500" />
                      </button>
                      {showMenu === account.id && (
                        <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                          <button
                            onClick={() => {
                              const newHidden = new Set(hiddenBalances);
                              if (hiddenBalances.has(account.id)) {
                                newHidden.delete(account.id);
                              } else {
                                newHidden.add(account.id);
                              }
                              setHiddenBalances(newHidden);
                              setShowMenu(null);
                            }}
                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                          >
                            {hiddenBalances.has(account.id) ? (
                              <><Eye className="h-4 w-4" /> Show Balance</>
                            ) : (
                              <><EyeOff className="h-4 w-4" /> Hide Balance</>
                            )}
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                await bankAccountService.update(account.id, {
                                  isActive: !account.isActive,
                                });
                                await loadDashboardData();
                                setShowMenu(null);
                              } catch (error) {
                                console.error("Error toggling account status:", error);
                              }
                            }}
                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                          >
                            <Power className="h-4 w-4" />
                            {account.isActive ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Transfers */}
        {pendingTransfers.length > 0 && (
          <div className="rounded-2xl border border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50/50 p-6 shadow-sm dark:border-yellow-700/50 dark:from-yellow-900/20 dark:to-orange-900/10">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500 shadow-md">
                <ArrowRightLeft className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Pending Transfers
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {pendingTransfers.length} transfer{pendingTransfers.length !== 1 ? 's' : ''} awaiting approval
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {pendingTransfers.map((transfer) => (
                <div
                  key={transfer.id}
                  className="flex items-center justify-between rounded-xl border border-yellow-300 bg-white p-4 shadow-sm dark:border-yellow-700/50 dark:bg-gray-800"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {transfer.fromAccountName} <span className="text-gray-400">→</span> {transfer.toAccountName}
                    </p>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{transfer.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatCurrency(transfer.amount)}
                    </p>
                    <span className="mt-1 inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400">
                      Pending Approval
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Transactions</h2>
              {recentTransactions.length > 0 && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Last {recentTransactions.length} transaction{recentTransactions.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            {recentTransactions.length > 0 && (
              <a
                href="#"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                View All →
              </a>
            )}
          </div>

          <BankTransactionList transactions={recentTransactions} />
        </div>
      </div>

      {/* Add Account Form Modal */}
      {showAddAccountForm && (
        <AddBankAccountForm
          onClose={() => setShowAddAccountForm(false)}
          onSuccess={() => {
            setShowAddAccountForm(false);
            loadDashboardData();
          }}
        />
      )}

      {/* Transfer Form Modal */}
      {showTransferForm && (
        <InterAccountTransferForm
          onClose={() => setShowTransferForm(false)}
          onSuccess={() => {
            setShowTransferForm(false);
            loadDashboardData();
          }}
        />
      )}
    </div>
  );
}
