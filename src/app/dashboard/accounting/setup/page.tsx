"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertTriangle, Database, ArrowLeft } from "lucide-react";
import { chartOfAccountsService } from "@/services";
import { useRouter } from "next/navigation";

export default function AccountingSetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [accountsExist, setAccountsExist] = useState(false);
  const [accountCount, setAccountCount] = useState(0);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    count?: number;
  } | null>(null);

  useEffect(() => {
    checkExistingAccounts();
  }, []);

  const checkExistingAccounts = async () => {
    try {
      setChecking(true);
      const accounts = await chartOfAccountsService.list();
      setAccountCount(accounts.length);
      setAccountsExist(accounts.length > 0);
    } catch (error) {
      console.error("Error checking accounts:", error);
    } finally {
      setChecking(false);
    }
  };

  const handleInitialize = async () => {
    try {
      setLoading(true);
      setResult(null);

      const createdAccounts =
        await chartOfAccountsService.initializeDefaultAccounts();

      setResult({
        success: true,
        message: `Successfully initialized ${createdAccounts.length} accounts`,
        count: createdAccounts.length,
      });

      // Refresh the account check
      await checkExistingAccounts();
    } catch (error) {
      console.error("Error initializing accounts:", error);
      setResult({
        success: false,
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="flex items-center justify-center p-8">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/dashboard/accounting")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Accounting Dashboard
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">
          Chart of Accounts Setup
        </h1>
        <p className="mt-2 text-gray-600">
          Initialize your chart of accounts for proper financial tracking
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Account Initialization
          </CardTitle>
          <CardDescription>
            Set up the default chart of accounts required for financial
            reporting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Status */}
          <div className="rounded-lg bg-gray-50 p-4">
            <h3 className="mb-2 font-semibold">Current Status</h3>
            <div className="flex items-center gap-2">
              {accountsExist ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="text-green-600">
                    {accountCount} accounts found in your chart of accounts
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <span className="text-orange-600">
                    No accounts found. Please initialize the chart of accounts.
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Info Alert */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> The chart of accounts must be
              initialized before you can:
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Record payments and expenses</li>
                <li>Generate financial reports</li>
                <li>Post journal entries</li>
                <li>Track assets and liabilities</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Initialize Button */}
          <Button
            onClick={handleInitialize}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading
              ? "Initializing..."
              : accountsExist
                ? "Re-initialize / Add Missing Accounts"
                : "Initialize Chart of Accounts"}
          </Button>

          {/* Result Message */}
          {result && (
            <Alert
              className={
                result.success
                  ? "border-green-200 bg-green-50"
                  : "border-red-200 bg-red-50"
              }
            >
              {result.success ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription
                className={result.success ? "text-green-800" : "text-red-800"}
              >
                {result.message}
              </AlertDescription>
            </Alert>
          )}

          {/* What Gets Created */}
          <div className="border-t pt-6">
            <h3 className="mb-4 font-semibold">
              Default Accounts That Will Be Created:
            </h3>
            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
              <div>
                <h4 className="mb-2 font-medium text-gray-700">Assets</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Cash (1110)</li>
                  <li>• Bank Accounts (1120)</li>
                  <li>• Accounts Receivable (1130)</li>
                  <li>• Fixed Assets (1200)</li>
                  <li>• Accumulated Depreciation (1250)</li>
                </ul>
              </div>
              <div>
                <h4 className="mb-2 font-medium text-gray-700">Liabilities</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Accounts Payable (2110)</li>
                  <li>• Salaries Payable (2120)</li>
                  <li>• Tax Payable (2130)</li>
                </ul>
              </div>
              <div>
                <h4 className="mb-2 font-medium text-gray-700">Equity</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Retained Earnings (3100)</li>
                </ul>
              </div>
              <div>
                <h4 className="mb-2 font-medium text-gray-700">Revenue</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Tuition Fees (4100)</li>
                  <li>• Other Fees (4200)</li>
                  <li>• Other Income (4300)</li>
                </ul>
              </div>
              <div className="md:col-span-2">
                <h4 className="mb-2 font-medium text-gray-700">Expenses</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Salaries & Wages (5100)</li>
                  <li>• Utilities (5200)</li>
                  <li>• Maintenance (5300)</li>
                  <li>• Supplies (5400)</li>
                  <li>• Depreciation Expense (5500)</li>
                  <li>• Administrative Expense (5600)</li>
                  <li>• Other Expenses (5900)</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-inside list-decimal space-y-2 text-sm text-gray-600">
            <li>Click &quot;Initialize Chart of Accounts&quot; above</li>
            <li>Wait for the initialization to complete</li>
            <li>Start recording payments, expenses, and other transactions</li>
            <li>
              Financial reports will automatically reflect your transactions
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
