import React from "react";
import {
  PiggyBankIcon,
  CreditCardIcon,
  BuildingIcon,
  CoinsIcon,
  TrendingUpIcon,
  WalletIcon,
  SmartphoneIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
} from "lucide-react";
import {
  FinancialDashboardData,
  useFinancialFormatting,
} from "@/hooks/useFinancialDashboard";
import { AccountBalancesChart } from "./FinancialCharts";

interface AccountType {
  id: string;
  name: string;
  balance: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  description: string;
  status: "healthy" | "warning" | "critical";
}

interface CurrencyBalance {
  currency: string;
  balance: number;
  accounts: number;
  symbol: string;
}

interface AccountBalancesProps {
  data: FinancialDashboardData;
}

export function AccountBalances({ data }: AccountBalancesProps) {
  const { formatCurrency, formatNumber } = useFinancialFormatting();

  // Account type configurations
  const getAccountConfig = (type: string, balance: number): AccountType => {
    const configs = {
      bank: {
        name: "Bank Accounts",
        icon: <BuildingIcon className="h-5 w-5" />,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        description: "Primary banking accounts",
      },
      cash: {
        name: "Cash on Hand",
        icon: <CoinsIcon className="h-5 w-5" />,
        color: "text-green-600",
        bgColor: "bg-green-50",
        description: "Physical cash available",
      },
      petty_cash: {
        name: "Petty Cash",
        icon: <WalletIcon className="h-5 w-5" />,
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
        description: "Small expenses fund",
      },
      savings: {
        name: "Savings",
        icon: <PiggyBankIcon className="h-5 w-5" />,
        color: "text-purple-600",
        bgColor: "bg-purple-50",
        description: "Long-term savings",
      },
      investment: {
        name: "Investments",
        icon: <TrendingUpIcon className="h-5 w-5" />,
        color: "text-indigo-600",
        bgColor: "bg-indigo-50",
        description: "Investment accounts",
      },
      mobile_money: {
        name: "Mobile Money",
        icon: <SmartphoneIcon className="h-5 w-5" />,
        color: "text-cyan-600",
        bgColor: "bg-cyan-50",
        description: "Mobile payment wallets",
      },
    };

    const config = configs[type as keyof typeof configs] || {
      name: type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      icon: <CreditCardIcon className="h-5 w-5" />,
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      description: "Other account types",
    };

    // Determine status based on balance
    const status: "healthy" | "warning" | "critical" =
      balance < 1000 ? "critical" : balance < 5000 ? "warning" : "healthy";

    return {
      id: type,
      balance,
      status,
      ...config,
    };
  };

  const accountTypes: AccountType[] = Object.entries(data.accounts.byType).map(
    ([type, balance]) => getAccountConfig(type, balance),
  );

  // Currency balances
  const currencyBalances: CurrencyBalance[] = Object.entries(
    data.accounts.byCurrency,
  ).map(([currency, balance]) => ({
    currency,
    balance,
    accounts: Object.keys(data.accounts.byType).length, // Simplified - would need actual account count per currency
    symbol:
      currency === "USD"
        ? "$"
        : currency === "EUR"
          ? "€"
          : currency === "GBP"
            ? "£"
            : currency,
  }));

  const totalBalance = data.accounts.totalBalance;
  const healthyAccounts = accountTypes.filter(
    (acc) => acc.status === "healthy",
  ).length;
  const criticalAccounts = accountTypes.filter(
    (acc) => acc.status === "critical",
  ).length;

  return (
    <div className="space-y-6">
      {/* Account Overview */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <PiggyBankIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Account Balances
              </h3>
              <p className="text-sm text-gray-500">
                {accountTypes.length} accounts • {currencyBalances.length}{" "}
                currencies
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900">
              {formatCurrency(totalBalance)}
            </p>
            <p className="text-sm text-gray-500">Total Balance</p>
          </div>
        </div>

        {/* Account Health Summary */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-green-50 p-3 text-center">
            <div className="mb-1 flex items-center justify-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
              <span className="text-lg font-bold text-green-600">
                {healthyAccounts}
              </span>
            </div>
            <p className="text-sm text-green-700">Healthy Accounts</p>
          </div>

          <div className="rounded-lg bg-yellow-50 p-3 text-center">
            <div className="mb-1 flex items-center justify-center gap-2">
              <AlertTriangleIcon className="h-5 w-5 text-yellow-600" />
              <span className="text-lg font-bold text-yellow-600">
                {accountTypes.filter((acc) => acc.status === "warning").length}
              </span>
            </div>
            <p className="text-sm text-yellow-700">Warning</p>
          </div>

          <div className="rounded-lg bg-red-50 p-3 text-center">
            <div className="mb-1 flex items-center justify-center gap-2">
              <AlertTriangleIcon className="h-5 w-5 text-red-600" />
              <span className="text-lg font-bold text-red-600">
                {criticalAccounts}
              </span>
            </div>
            <p className="text-sm text-red-700">Critical</p>
          </div>
        </div>

        {/* Balance Distribution */}
        <div className="space-y-3">
          {accountTypes.map((account) => {
            const percentage = (account.balance / totalBalance) * 100;

            return (
              <div key={account.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`rounded p-1 ${account.bgColor} ${account.color}`}
                    >
                      {account.icon}
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {account.name}
                    </span>
                    {account.status === "critical" && (
                      <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-600">
                        LOW
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(account.balance)}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>

                <div className="h-2 w-full rounded-full bg-gray-200">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      account.status === "healthy"
                        ? "bg-green-500"
                        : account.status === "warning"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Account Type Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {accountTypes.map((account) => (
          <div
            key={account.id}
            className={`rounded-xl border-2 bg-white p-6 shadow-sm transition-all hover:shadow-md ${
              account.status === "critical"
                ? "border-red-300 ring-2 ring-red-200"
                : account.status === "warning"
                  ? "border-yellow-300 ring-1 ring-yellow-200"
                  : "border-gray-200"
            } `}
          >
            <div className="mb-4 flex items-start justify-between">
              <div
                className={`rounded-lg p-3 ${account.bgColor} ${account.color}`}
              >
                {account.icon}
              </div>
              <div className="flex items-center gap-2">
                {account.status === "healthy" && (
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                )}
                {account.status === "warning" && (
                  <AlertTriangleIcon className="h-5 w-5 text-yellow-500" />
                )}
                {account.status === "critical" && (
                  <AlertTriangleIcon className="h-5 w-5 text-red-500" />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900">{account.name}</h4>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(account.balance)}
              </p>
              <p className="text-sm text-gray-600">{account.description}</p>

              <div
                className={`inline-block rounded-full px-2 py-1 text-sm ${
                  account.status === "healthy"
                    ? "bg-green-100 text-green-800"
                    : account.status === "warning"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                }`}
              >
                {account.status === "healthy"
                  ? "Healthy"
                  : account.status === "warning"
                    ? "Low Balance"
                    : "Critical Level"}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Account Balances Chart */}
        <AccountBalancesChart data={data} />

        {/* Currency Breakdown */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Currency Breakdown
          </h3>

          <div className="space-y-4">
            {currencyBalances.map((currency, index) => {
              const percentage = (currency.balance / totalBalance) * 100;

              return (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg bg-gray-50 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
                      <span className="font-bold">{currency.symbol}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {currency.currency}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatNumber(currency.accounts)} accounts
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(currency.balance, currency.currency)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {currencyBalances.length === 0 && (
            <div className="py-8 text-center">
              <CoinsIcon className="mx-auto mb-2 h-12 w-12 text-gray-400" />
              <p className="text-gray-500">No currency data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Account Actions */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Account Management
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <button className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 transition-colors hover:bg-blue-100">
            <BuildingIcon className="h-5 w-5 text-blue-600" />
            <div className="text-left">
              <p className="font-semibold text-blue-900">Add Account</p>
              <p className="text-sm text-blue-700">Create new account</p>
            </div>
          </button>

          <button className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 transition-colors hover:bg-green-100">
            <TrendingUpIcon className="h-5 w-5 text-green-600" />
            <div className="text-left">
              <p className="font-semibold text-green-900">Transfer Funds</p>
              <p className="text-sm text-green-700">
                Move money between accounts
              </p>
            </div>
          </button>

          {criticalAccounts > 0 && (
            <button className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 transition-colors hover:bg-red-100">
              <AlertTriangleIcon className="h-5 w-5 text-red-600" />
              <div className="text-left">
                <p className="font-semibold text-red-900">Low Balance Alert</p>
                <p className="text-sm text-red-700">
                  {criticalAccounts} accounts need funding
                </p>
              </div>
            </button>
          )}

          <button className="flex items-center gap-3 rounded-lg border border-purple-200 bg-purple-50 p-4 transition-colors hover:bg-purple-100">
            <CreditCardIcon className="h-5 w-5 text-purple-600" />
            <div className="text-left">
              <p className="font-semibold text-purple-900">Account Report</p>
              <p className="text-sm text-purple-700">Generate balance report</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
