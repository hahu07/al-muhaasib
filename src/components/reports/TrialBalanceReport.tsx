"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Download, Loader2, AlertCircle } from "lucide-react";
import { reportsService } from "@/services/reportsService";
import type { TrialBalance, TrialBalanceLine } from "@/services/reportsService";
import { useSchool } from "@/contexts/SchoolContext";

interface TrialBalanceReportProps {
  filters: {
    asOfDate: string;
    format: "monthly" | "quarterly" | "yearly";
  };
  onBack: () => void;
}

const TrialBalanceReport: React.FC<TrialBalanceReportProps> = ({
  filters,
  onBack,
}) => {
  const { formatCurrency } = useSchool();
  const [trialBalance, setTrialBalance] = useState<TrialBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [asOfDate, setAsOfDate] = useState(
    filters.asOfDate || new Date().toISOString().split("T")[0],
  );

  const loadTrialBalance = async (date: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportsService.generateTrialBalance(date);
      setTrialBalance(data);
    } catch (err) {
      console.error("Error loading trial balance:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load trial balance",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrialBalance(asOfDate);
  }, [asOfDate]);

  const handleExport = () => {
    if (!trialBalance) return;

    // Generate CSV
    const headers = ["Account Code", "Account Name", "Debit", "Credit", "Balance"];
    const rows = trialBalance.accounts.map((acc) => [
      acc.accountCode,
      acc.accountName,
      acc.debit.toFixed(2),
      acc.credit.toFixed(2),
      acc.balance.toFixed(2),
    ]);
    rows.push([
      "",
      "Total",
      trialBalance.totalDebit.toFixed(2),
      trialBalance.totalCredit.toFixed(2),
      "",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trial-balance-${asOfDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getAccountTypeColor = (accountType: string) => {
    switch (accountType) {
      case "asset":
        return "text-green-700";
      case "liability":
        return "text-red-700";
      case "equity":
        return "text-blue-700";
      case "revenue":
        return "text-purple-700";
      case "expense":
        return "text-orange-700";
      default:
        return "text-gray-700";
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Trial Balance</h1>
            <p className="text-sm text-gray-600">
              Verification of account balances
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">As of Date:</label>
            <Input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="w-40"
            />
          </div>
          <Button onClick={handleExport} disabled={!trialBalance || loading}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-2 p-6 text-red-700">
            <AlertCircle className="h-5 w-5" />
            {error}
          </CardContent>
        </Card>
      )}

      {!loading && !error && trialBalance && (
        <>
          {/* Balance Status Card */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Balance Status</h3>
                  <p className="text-sm text-gray-600">
                    As of {new Date(asOfDate).toLocaleDateString("en-NG")}
                  </p>
                </div>
                <div
                  className={`rounded-full px-4 py-2 font-semibold ${
                    trialBalance.isBalanced
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {trialBalance.isBalanced ? "✓ Balanced" : "✗ Unbalanced"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trial Balance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Account Balances</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b-2 border-gray-300">
                    <tr className="bg-gray-50">
                      <th className="p-3 text-left font-semibold">Code</th>
                      <th className="p-3 text-left font-semibold">Account Name</th>
                      <th className="p-3 text-left font-semibold">Type</th>
                      <th className="p-3 text-right font-semibold">Debit</th>
                      <th className="p-3 text-right font-semibold">Credit</th>
                      <th className="p-3 text-right font-semibold">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trialBalance.accounts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-500">
                          No account balances found for this period
                        </td>
                      </tr>
                    ) : (
                      trialBalance.accounts.map((account) => (
                        <tr
                          key={account.accountCode}
                          className="border-b border-gray-200 hover:bg-gray-50"
                        >
                          <td className="p-3 font-mono text-sm">
                            {account.accountCode}
                          </td>
                          <td className="p-3">{account.accountName}</td>
                          <td className="p-3">
                            <span
                              className={`text-sm font-medium capitalize ${
                                getAccountTypeColor(account.accountType)
                              }`}
                            >
                              {account.accountType}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono">
                            {account.debit > 0
                              ? formatCurrency(account.debit)
                              : "-"}
                          </td>
                          <td className="p-3 text-right font-mono">
                            {account.credit > 0
                              ? formatCurrency(account.credit)
                              : "-"}
                          </td>
                          <td
                            className={`p-3 text-right font-mono font-semibold ${
                              account.balance >= 0
                                ? "text-green-700"
                                : "text-red-700"
                            }`}
                          >
                            {formatCurrency(Math.abs(account.balance))}
                            {account.balance < 0 && " (Cr)"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot className="border-t-2 border-gray-300 bg-gray-50">
                    <tr className="font-bold">
                      <td className="p-3" colSpan={3}>
                        TOTAL
                      </td>
                      <td className="p-3 text-right font-mono text-green-700">
                        {formatCurrency(trialBalance.totalDebit)}
                      </td>
                      <td className="p-3 text-right font-mono text-red-700">
                        {formatCurrency(trialBalance.totalCredit)}
                      </td>
                      <td className="p-3 text-right font-mono">
                        {formatCurrency(
                          Math.abs(
                            trialBalance.totalDebit - trialBalance.totalCredit,
                          ),
                        )}
                      </td>
                    </tr>
                    {!trialBalance.isBalanced && (
                      <tr className="bg-red-50">
                        <td className="p-3 text-red-700" colSpan={6}>
                          <AlertCircle className="mr-2 inline h-4 w-4" />
                          Warning: Debits and credits do not match. Please review
                          journal entries.
                        </td>
                      </tr>
                    )}
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-600">Total Debits</p>
                <p className="text-2xl font-bold text-green-700">
                  {formatCurrency(trialBalance.totalDebit)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-600">Total Credits</p>
                <p className="text-2xl font-bold text-red-700">
                  {formatCurrency(trialBalance.totalCredit)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-600">Difference</p>
                <p
                  className={`text-2xl font-bold ${
                    trialBalance.isBalanced ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {formatCurrency(
                    Math.abs(trialBalance.totalDebit - trialBalance.totalCredit),
                  )}
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default TrialBalanceReport;
