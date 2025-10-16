import React from 'react';
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
} from 'lucide-react';
import { FinancialDashboardData, useFinancialFormatting } from '@/hooks/useFinancialDashboard';
import { AccountBalancesChart } from './FinancialCharts';

interface AccountType {
  id: string;
  name: string;
  balance: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  description: string;
  status: 'healthy' | 'warning' | 'critical';
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
        name: 'Bank Accounts',
        icon: <BuildingIcon className="w-5 h-5" />,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        description: 'Primary banking accounts',
      },
      cash: {
        name: 'Cash on Hand',
        icon: <CoinsIcon className="w-5 h-5" />,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        description: 'Physical cash available',
      },
      petty_cash: {
        name: 'Petty Cash',
        icon: <WalletIcon className="w-5 h-5" />,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        description: 'Small expenses fund',
      },
      savings: {
        name: 'Savings',
        icon: <PiggyBankIcon className="w-5 h-5" />,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        description: 'Long-term savings',
      },
      investment: {
        name: 'Investments',
        icon: <TrendingUpIcon className="w-5 h-5" />,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50',
        description: 'Investment accounts',
      },
      mobile_money: {
        name: 'Mobile Money',
        icon: <SmartphoneIcon className="w-5 h-5" />,
        color: 'text-cyan-600',
        bgColor: 'bg-cyan-50',
        description: 'Mobile payment wallets',
      },
    };

    const config = configs[type as keyof typeof configs] || {
      name: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      icon: <CreditCardIcon className="w-5 h-5" />,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      description: 'Other account types',
    };

    // Determine status based on balance
    const status: 'healthy' | 'warning' | 'critical' = 
      balance < 1000 ? 'critical' :
      balance < 5000 ? 'warning' :
      'healthy';

    return {
      id: type,
      balance,
      status,
      ...config,
    };
  };

  const accountTypes: AccountType[] = Object.entries(data.accounts.byType).map(([type, balance]) =>
    getAccountConfig(type, balance)
  );

  // Currency balances
  const currencyBalances: CurrencyBalance[] = Object.entries(data.accounts.byCurrency).map(([currency, balance]) => ({
    currency,
    balance,
    accounts: Object.keys(data.accounts.byType).length, // Simplified - would need actual account count per currency
    symbol: currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency,
  }));

  const totalBalance = data.accounts.totalBalance;
  const healthyAccounts = accountTypes.filter(acc => acc.status === 'healthy').length;
  const criticalAccounts = accountTypes.filter(acc => acc.status === 'critical').length;

  return (
    <div className="space-y-6">
      {/* Account Overview */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <PiggyBankIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Account Balances</h3>
              <p className="text-sm text-gray-500">
                {accountTypes.length} accounts • {currencyBalances.length} currencies
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalBalance)}</p>
            <p className="text-sm text-gray-500">Total Balance</p>
          </div>
        </div>

        {/* Account Health Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-1">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
              <span className="text-lg font-bold text-green-600">{healthyAccounts}</span>
            </div>
            <p className="text-sm text-green-700">Healthy Accounts</p>
          </div>
          
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-1">
              <AlertTriangleIcon className="w-5 h-5 text-yellow-600" />
              <span className="text-lg font-bold text-yellow-600">
                {accountTypes.filter(acc => acc.status === 'warning').length}
              </span>
            </div>
            <p className="text-sm text-yellow-700">Warning</p>
          </div>
          
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-1">
              <AlertTriangleIcon className="w-5 h-5 text-red-600" />
              <span className="text-lg font-bold text-red-600">{criticalAccounts}</span>
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
                    <div className={`p-1 rounded ${account.bgColor} ${account.color}`}>
                      {account.icon}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{account.name}</span>
                    {account.status === 'critical' && (
                      <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full font-semibold">
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
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      account.status === 'healthy' ? 'bg-green-500' :
                      account.status === 'warning' ? 'bg-yellow-500' :
                      'bg-red-500'
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accountTypes.map((account) => (
          <div
            key={account.id}
            className={`
              bg-white rounded-xl border-2 p-6 shadow-sm hover:shadow-md transition-all
              ${account.status === 'critical' ? 'ring-2 ring-red-200 border-red-300' : 
                account.status === 'warning' ? 'ring-1 ring-yellow-200 border-yellow-300' : 
                'border-gray-200'}
            `}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg ${account.bgColor} ${account.color}`}>
                {account.icon}
              </div>
              <div className="flex items-center gap-2">
                {account.status === 'healthy' && (
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                )}
                {account.status === 'warning' && (
                  <AlertTriangleIcon className="w-5 h-5 text-yellow-500" />
                )}
                {account.status === 'critical' && (
                  <AlertTriangleIcon className="w-5 h-5 text-red-500" />
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900">{account.name}</h4>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(account.balance)}
              </p>
              <p className="text-sm text-gray-600">{account.description}</p>
              
              <div className={`text-sm px-2 py-1 rounded-full inline-block ${
                account.status === 'healthy' ? 'bg-green-100 text-green-800' :
                account.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {account.status === 'healthy' ? 'Healthy' :
                 account.status === 'warning' ? 'Low Balance' :
                 'Critical Level'}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Balances Chart */}
        <AccountBalancesChart data={data} />

        {/* Currency Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Currency Breakdown</h3>
          
          <div className="space-y-4">
            {currencyBalances.map((currency, index) => {
              const percentage = (currency.balance / totalBalance) * 100;
              
              return (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                      <span className="font-bold">{currency.symbol}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{currency.currency}</p>
                      <p className="text-sm text-gray-600">{formatNumber(currency.accounts)} accounts</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(currency.balance, currency.currency)}
                    </p>
                    <p className="text-sm text-gray-500">{percentage.toFixed(1)}%</p>
                  </div>
                </div>
              );
            })}
          </div>
          
          {currencyBalances.length === 0 && (
            <div className="text-center py-8">
              <CoinsIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No currency data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Account Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Management</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200">
            <BuildingIcon className="w-5 h-5 text-blue-600" />
            <div className="text-left">
              <p className="font-semibold text-blue-900">Add Account</p>
              <p className="text-sm text-blue-700">Create new account</p>
            </div>
          </button>
          
          <button className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200">
            <TrendingUpIcon className="w-5 h-5 text-green-600" />
            <div className="text-left">
              <p className="font-semibold text-green-900">Transfer Funds</p>
              <p className="text-sm text-green-700">Move money between accounts</p>
            </div>
          </button>
          
          {criticalAccounts > 0 && (
            <button className="flex items-center gap-3 p-4 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200">
              <AlertTriangleIcon className="w-5 h-5 text-red-600" />
              <div className="text-left">
                <p className="font-semibold text-red-900">Low Balance Alert</p>
                <p className="text-sm text-red-700">{criticalAccounts} accounts need funding</p>
              </div>
            </button>
          )}
          
          <button className="flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200">
            <CreditCardIcon className="w-5 h-5 text-purple-600" />
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