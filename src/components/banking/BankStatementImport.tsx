"use client";

import React, { useState } from "react";
import { UploadIcon, CheckCircleIcon, AlertCircleIcon, FileIcon } from "lucide-react";
import { bankTransactionService, bankAccountService } from "@/services";
import { useAuth } from "@/contexts/AuthContext";
import type { BankAccount } from "@/types";

export function BankStatementImport() {
  const { appUser } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ imported: number; errors: string[] } | null>(null);

  React.useEffect(() => {
    loadBankAccounts();
  }, []);

  async function loadBankAccounts() {
    try {
      const accounts = await bankAccountService.getActiveAccounts();
      setBankAccounts(accounts);
    } catch (err) {
      console.error("Error loading bank accounts:", err);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
      setError(null);
    } else {
      setError("Please select a valid CSV file");
    }
  }

  async function handleImport() {
    if (!file || !selectedAccount || !appUser) {
      setError("Please select a bank account and CSV file");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Read CSV file
      const text = await file.text();
      const lines = text.split("\n").filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error("CSV file must contain headers and at least one data row");
      }

      // Parse CSV (simple parsing - assumes comma-separated)
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
      const data = lines.slice(1).map(line => {
        const values = line.split(",");
        const row: Record<string, string> = {};
        headers.forEach((header, i) => {
          row[header] = values[i]?.trim() || "";
        });
        return row;
      });

      // Import transactions
      const result = await bankTransactionService.importFromCSV(
        selectedAccount,
        data,
        appUser.id
      );

      setSuccess(result);
      setFile(null);
    } catch (err) {
      console.error("Error importing statement:", err);
      setError(err instanceof Error ? err.message : "Failed to import statement");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center gap-3 mb-6">
          <UploadIcon className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Import Bank Statement</h2>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-400">
            <AlertCircleIcon className="h-5 w-5" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
            <div className="flex items-center gap-2 text-green-800 dark:text-green-400 mb-2">
              <CheckCircleIcon className="h-5 w-5" />
              <p className="font-semibold">Import completed!</p>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300">
              Imported {success.imported} transactions
            </p>
            {success.errors.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium text-red-600 dark:text-red-400">
                  {success.errors.length} errors:
                </p>
                <ul className="text-xs text-red-600 dark:text-red-400 ml-4 mt-1">
                  {success.errors.slice(0, 5).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                  {success.errors.length > 5 && <li>... and {success.errors.length - 5} more</li>}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="space-y-4">
          {/* Bank Account Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bank Account *
            </label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select bank account</option>
              {bankAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.bankName} - {account.accountName} ({account.accountNumber})
                </option>
              ))}
            </select>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              CSV File *
            </label>
            <div className="flex items-center gap-4">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-4 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700">
                <FileIcon className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {file ? file.name : "Choose CSV file"}
                </span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Expected columns: date, description, debit, credit, balance
            </p>
          </div>

          <button
            onClick={handleImport}
            disabled={!file || !selectedAccount || loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? "Importing..." : "Import Transactions"}
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">CSV Format Requirements</h3>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li>• First row must contain column headers</li>
          <li>• Required columns: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">date</code>, <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">description</code>, <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">debit</code>, <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">credit</code>, <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">balance</code></li>
          <li>• Optional columns: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">reference</code>, <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">valueDate</code></li>
          <li>• Date format: YYYY-MM-DD or DD/MM/YYYY</li>
          <li>• Amount fields: Numbers without currency symbols</li>
        </ul>
      </div>
    </div>
  );
}
