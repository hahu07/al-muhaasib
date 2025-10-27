"use client";

import { useState } from "react";
import { useBankingModule } from "@/hooks/useBankingModule";
import { BankAccountsDashboard } from "@/components/banking/BankAccountsDashboard";
import { BankReconciliationUI } from "@/components/banking/BankReconciliationUI";
import { BankStatementImport } from "@/components/banking/BankStatementImport";
import { CashFlowDashboard } from "@/components/banking/CashFlowDashboard";
import { AlertTriangleIcon, LockIcon, HomeIcon, CheckCircleIcon, UploadIcon, TrendingUpIcon } from "lucide-react";
import Link from "next/link";

type TabType = "dashboard" | "reconciliation" | "import" | "cashflow";

export default function BankingPage() {
  const { isBankingEnabled } = useBankingModule();
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");

  if (!isBankingEnabled) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-8 text-center">
            <LockIcon className="mx-auto mb-4 h-12 w-12 text-yellow-600" />
            <h1 className="mb-2 text-2xl font-bold text-gray-900">
              Banking Module Not Enabled
            </h1>
            <p className="mb-6 text-gray-600">
              The banking module is currently disabled for your school. To
              enable advanced banking features including transaction tracking,
              reconciliation, and cash flow management, please enable it in your
              school settings.
            </p>
            <Link
              href="/dashboard/settings"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700"
            >
              <AlertTriangleIcon className="h-5 w-5" />
              Go to Settings
            </Link>
          </div>

          <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Banking Module Features
            </h2>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>
                  <strong>Bank Transaction Tracking</strong> - Record and
                  manage all bank transactions with detailed categorization
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>
                  <strong>Bank Reconciliation</strong> - Match bank statements
                  with your records automatically
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>
                  <strong>Inter-Account Transfers</strong> - Transfer funds
                  between school accounts with approval workflows
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>
                  <strong>Cash Flow Projections</strong> - Forecast cash
                  positions and liquidity status
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>
                  <strong>Statement Import</strong> - Bulk import transactions
                  from CSV files
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "dashboard" as TabType, label: "Dashboard", icon: HomeIcon },
    { id: "reconciliation" as TabType, label: "Reconciliation", icon: CheckCircleIcon },
    { id: "import" as TabType, label: "Import Statement", icon: UploadIcon },
    { id: "cashflow" as TabType, label: "Cash Flow", icon: TrendingUpIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Tabs Navigation */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 border-b-2 px-1 pb-4 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                    : "border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                <tab.icon className="h-5 w-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === "dashboard" && <BankAccountsDashboard />}
          {activeTab === "reconciliation" && <BankReconciliationUI />}
          {activeTab === "import" && <BankStatementImport />}
          {activeTab === "cashflow" && <CashFlowDashboard />}
        </div>
      </div>
    </div>
  );
}
