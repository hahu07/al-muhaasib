"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Building2, Link2 } from "lucide-react";
import { bankAccountService, chartOfAccountsService } from "@/services/accountingService";
import type { ChartOfAccounts } from "@/types";

interface AddBankAccountFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AddBankAccountForm({ onClose, onSuccess }: AddBankAccountFormProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [glAccounts, setGlAccounts] = useState<ChartOfAccounts[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [formData, setFormData] = useState({
    bankName: "",
    accountName: "",
    accountNumber: "",
    accountType: "current" as "current" | "savings",
    balance: 0,
    glAccountId: "",
  });

  // Load GL accounts (bank/cash accounts only)
  useEffect(() => {
    async function loadGLAccounts() {
      try {
        const accounts = await chartOfAccountsService.getActiveAccounts();
        // Filter for asset accounts (bank/cash accounts are typically 1100-1199)
        const bankAccounts = accounts.filter(
          (acc) => acc.accountType === "asset" && 
          (acc.accountCode.startsWith("11") || acc.accountName.toLowerCase().includes("bank") || acc.accountName.toLowerCase().includes("cash"))
        );
        setGlAccounts(bankAccounts);
      } catch (err) {
        console.error("Failed to load GL accounts:", err);
      } finally {
        setLoadingAccounts(false);
      }
    }
    loadGLAccounts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      // Validation
      if (!formData.bankName.trim()) {
        throw new Error("Bank name is required");
      }
      if (!formData.accountName.trim()) {
        throw new Error("Account name is required");
      }
      if (!formData.accountNumber.trim()) {
        throw new Error("Account number is required");
      }
      if (formData.balance < 0) {
        throw new Error("Opening balance cannot be negative");
      }

      // Get GL account details if selected
      let glAccountData = {};
      if (formData.glAccountId) {
        const selectedGLAccount = glAccounts.find((acc) => acc.id === formData.glAccountId);
        if (selectedGLAccount) {
          glAccountData = {
            glAccountId: selectedGLAccount.id,
            glAccountCode: selectedGLAccount.accountCode,
            glAccountName: selectedGLAccount.accountName,
          };
        }
      }

      // Create bank account
      await bankAccountService.create({
        bankName: formData.bankName.trim(),
        accountName: formData.accountName.trim(),
        accountNumber: formData.accountNumber.trim(),
        accountType: formData.accountType,
        balance: formData.balance,
        ...glAccountData,
        isActive: true,
      });

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create bank account");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
              <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Add Bank Account
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Register a new bank account for tracking
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
              <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Bank Name */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Bank Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                placeholder="e.g., Guaranty Trust Bank"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            {/* Account Name */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Account Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.accountName}
                onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                placeholder="e.g., School Current Account"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            {/* Account Number */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Account Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                placeholder="e.g., 0123456789"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 font-mono text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            {/* Account Type */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Account Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.accountType}
                onChange={(e) => setFormData({ ...formData, accountType: e.target.value as "current" | "savings" })}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="current">Current Account</option>
                <option value="savings">Savings Account</option>
              </select>
            </div>

            {/* GL Account Link */}
            <div className="md:col-span-2">
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Link2 className="h-4 w-4" />
                Link to General Ledger Account (Recommended)
              </label>
              <select
                value={formData.glAccountId}
                onChange={(e) => setFormData({ ...formData, glAccountId: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                disabled={loadingAccounts}
              >
                <option value="">-- No GL Account Link (Not Recommended) --</option>
                {glAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.accountCode} - {account.accountName}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                {loadingAccounts ? (
                  "Loading GL accounts..."
                ) : glAccounts.length === 0 ? (
                  "⚠️ No GL accounts found. Please create bank accounts in Chart of Accounts first."
                ) : (
                  "✅ Linking to GL enables automatic journal entry posting and reconciliation"
                )}
              </p>
            </div>

            {/* Opening Balance */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Opening Balance (₦)
              </label>
              <input
                type="number"
                value={formData.balance}
                onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                Enter the current balance if this is an existing account, or leave as 0 for a new account
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-gray-200 pt-6 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:from-blue-700 hover:to-blue-800 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
