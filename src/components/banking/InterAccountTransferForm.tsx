"use client";

import React, { useState, useEffect } from "react";
import { X, ArrowRightLeft, AlertCircleIcon } from "lucide-react";
import { bankAccountService, interAccountTransferService } from "@/services";
import { useAuth } from "@/contexts/AuthContext";
import { useSchool } from "@/contexts/SchoolContext";
import type { BankAccount } from "@/types";

interface InterAccountTransferFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function InterAccountTransferForm({
  onClose,
  onSuccess,
}: InterAccountTransferFormProps) {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [purpose, setPurpose] = useState("");
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { appUser } = useAuth();
  const { formatCurrency } = useSchool();

  useEffect(() => {
    loadAccounts();
  }, []);

  async function loadAccounts() {
    try {
      const data = await bankAccountService.getActiveAccounts();
      setAccounts(data);
    } catch (err) {
      console.error("Error loading accounts:", err);
    }
  }

  const fromAccount = accounts.find((a) => a.id === fromAccountId);
  const toAccount = accounts.find((a) => a.id === toAccountId);
  const transferAmount = parseFloat(amount) || 0;

  const canSubmit =
    fromAccountId &&
    toAccountId &&
    transferAmount > 0 &&
    description &&
    fromAccount &&
    fromAccount.balance >= transferAmount;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !appUser) return;

    setLoading(true);
    setError("");

    try {
      await interAccountTransferService.createTransfer({
        fromAccountId,
        toAccountId,
        amount: transferAmount,
        transferDate: new Date().toISOString().split("T")[0],
        description,
        purpose: purpose || undefined,
        requiresApproval,
        createdBy: appUser.id,
      });

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create transfer");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-100 p-2">
              <ArrowRightLeft className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Inter-Account Transfer</h2>
              <p className="text-sm text-gray-600">Transfer funds between bank accounts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition-colors hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4">
              <AlertCircleIcon className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                From Account *
              </label>
              <select
                value={fromAccountId}
                onChange={(e) => setFromAccountId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
                required
              >
                <option value="">Select account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.accountName} ({formatCurrency(account.balance)})
                  </option>
                ))}
              </select>
              {fromAccount && (
                <p className="mt-1 text-sm text-gray-600">
                  Available: {formatCurrency(fromAccount.balance)}
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                To Account *
              </label>
              <select
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
                required
              >
                <option value="">Select account</option>
                {accounts
                  .filter((a) => a.id !== fromAccountId)
                  .map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.accountName}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Amount *
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
              placeholder="0.00"
              step="0.01"
              min="0"
              required
            />
            {fromAccount && transferAmount > fromAccount.balance && (
              <p className="mt-1 text-sm text-red-600">
                Insufficient balance
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Description *
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
              placeholder="e.g., Monthly allocation"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Purpose (Optional)
            </label>
            <textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
              placeholder="Additional details about the transfer"
              rows={3}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="requiresApproval"
              checked={requiresApproval}
              onChange={(e) => setRequiresApproval(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="requiresApproval" className="text-sm text-gray-700">
              Requires approval before execution
            </label>
          </div>

          <div className="flex gap-3 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit || loading}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Creating..." : requiresApproval ? "Submit for Approval" : "Transfer Now"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
