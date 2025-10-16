'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Download,
  RefreshCw,
  Building,
  CreditCard,
  PieChart,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { reportsService, type BalanceSheet } from '@/services/reportsService';

interface BalanceSheetReportProps {
  filters: {
    asOfDate: string;
    format: 'monthly' | 'quarterly' | 'yearly';
  };
  onBack: () => void;
}

const BalanceSheetReport: React.FC<BalanceSheetReportProps> = ({ filters, onBack }) => {
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBalanceSheet();
  }, [filters.asOfDate]);

  const loadBalanceSheet = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportsService.generateBalanceSheet(filters.asOfDate);
      setBalanceSheet(data);
    } catch (err) {
      setError('Failed to load balance sheet');
      console.error('Error loading balance sheet:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    console.log('Exporting Balance Sheet...');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Balance Sheet</h1>
        </div>
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Balance Sheet</h1>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600">{error}</p>
            <Button onClick={loadBalanceSheet} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!balanceSheet) return null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Balance Sheet</h1>
            <p className="text-gray-600">As of {balanceSheet.asOfDate}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadBalanceSheet}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Balance Check */}
      <Card className={`border-2 ${balanceSheet.isBalanced ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {balanceSheet.isBalanced ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <XCircle className="h-6 w-6 text-red-600" />
              )}
              <div>
                <p className="font-semibold">
                  Balance Sheet {balanceSheet.isBalanced ? 'Balanced' : 'Not Balanced'}
                </p>
                <p className="text-sm text-gray-600">
                  Assets: {formatCurrency(balanceSheet.assets.totalAssets)} | 
                  Liabilities + Equity: {formatCurrency(balanceSheet.totalLiabilitiesAndEquity)}
                </p>
              </div>
            </div>
            <Badge variant={balanceSheet.isBalanced ? "default" : "destructive"}>
              {balanceSheet.isBalanced ? 'BALANCED' : 'UNBALANCED'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Assets</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(balanceSheet.assets.totalAssets)}
                </p>
              </div>
              <Building className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Liabilities</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(balanceSheet.liabilities.totalLiabilities)}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Equity</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(balanceSheet.equity.totalEquity)}
                </p>
              </div>
              <PieChart className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Balance Sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets Side */}
        <Card>
          <CardHeader>
            <CardTitle className="text-blue-700">ASSETS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Current Assets */}
              <div>
                <h4 className="font-semibold text-blue-600 mb-3">Current Assets</h4>
                <div className="space-y-2">
                  {balanceSheet.assets.currentAssets.map((asset, index) => (
                    <div key={index} className="flex justify-between items-center py-1 border-b border-gray-100">
                      <div>
                        <span className="text-sm">{asset.accountName}</span>
                        <span className="text-gray-500 text-xs ml-2">({asset.accountCode})</span>
                      </div>
                      <span className="text-sm font-medium">
                        {formatCurrency(asset.amount)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                    <span className="font-semibold text-blue-600">Total Current Assets</span>
                    <span className="font-semibold">
                      {formatCurrency(balanceSheet.assets.currentAssets.reduce((sum, a) => sum + a.amount, 0))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Fixed Assets */}
              <div>
                <h4 className="font-semibold text-blue-600 mb-3">Fixed Assets</h4>
                <div className="space-y-2">
                  {balanceSheet.assets.fixedAssets.map((asset, index) => (
                    <div key={index} className="flex justify-between items-center py-1 border-b border-gray-100">
                      <div>
                        <span className="text-sm">{asset.accountName}</span>
                        <span className="text-gray-500 text-xs ml-2">({asset.accountCode})</span>
                      </div>
                      <span className="text-sm font-medium">
                        {formatCurrency(asset.amount)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                    <span className="font-semibold text-blue-600">Total Fixed Assets</span>
                    <span className="font-semibold">
                      {formatCurrency(balanceSheet.assets.fixedAssets.reduce((sum, a) => sum + a.amount, 0))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Total Assets */}
              <div className="border-t-2 border-blue-800 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-blue-800">TOTAL ASSETS</span>
                  <span className="text-lg font-bold text-blue-800">
                    {formatCurrency(balanceSheet.assets.totalAssets)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liabilities & Equity Side */}
        <Card>
          <CardHeader>
            <CardTitle className="text-red-700">LIABILITIES & EQUITY</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Current Liabilities */}
              <div>
                <h4 className="font-semibold text-red-600 mb-3">Current Liabilities</h4>
                <div className="space-y-2">
                  {balanceSheet.liabilities.currentLiabilities.map((liability, index) => (
                    <div key={index} className="flex justify-between items-center py-1 border-b border-gray-100">
                      <div>
                        <span className="text-sm">{liability.accountName}</span>
                        <span className="text-gray-500 text-xs ml-2">({liability.accountCode})</span>
                      </div>
                      <span className="text-sm font-medium">
                        {formatCurrency(liability.amount)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 border-t border-red-200">
                    <span className="font-semibold text-red-600">Total Current Liabilities</span>
                    <span className="font-semibold">
                      {formatCurrency(balanceSheet.liabilities.currentLiabilities.reduce((sum, l) => sum + l.amount, 0))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Long-term Liabilities */}
              <div>
                <h4 className="font-semibold text-red-600 mb-3">Long-term Liabilities</h4>
                <div className="space-y-2">
                  {balanceSheet.liabilities.longTermLiabilities.map((liability, index) => (
                    <div key={index} className="flex justify-between items-center py-1 border-b border-gray-100">
                      <div>
                        <span className="text-sm">{liability.accountName}</span>
                        <span className="text-gray-500 text-xs ml-2">({liability.accountCode})</span>
                      </div>
                      <span className="text-sm font-medium">
                        {formatCurrency(liability.amount)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 border-t border-red-200">
                    <span className="font-semibold text-red-600">Total Long-term Liabilities</span>
                    <span className="font-semibold">
                      {formatCurrency(balanceSheet.liabilities.longTermLiabilities.reduce((sum, l) => sum + l.amount, 0))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Total Liabilities */}
              <div className="border-t border-red-300 pt-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-red-700">TOTAL LIABILITIES</span>
                  <span className="font-bold text-red-700">
                    {formatCurrency(balanceSheet.liabilities.totalLiabilities)}
                  </span>
                </div>
              </div>

              {/* Equity */}
              <div>
                <h4 className="font-semibold text-green-600 mb-3">Owner&apos;s Equity</h4>
                <div className="space-y-2">
                  {balanceSheet.equity.equity.map((equity, index) => (
                    <div key={index} className="flex justify-between items-center py-1 border-b border-gray-100">
                      <div>
                        <span className="text-sm">{equity.accountName}</span>
                        <span className="text-gray-500 text-xs ml-2">({equity.accountCode})</span>
                      </div>
                      <span className="text-sm font-medium">
                        {formatCurrency(equity.amount)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 border-t border-green-200">
                    <span className="font-semibold text-green-600">Total Equity</span>
                    <span className="font-semibold">
                      {formatCurrency(balanceSheet.equity.totalEquity)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Total Liabilities & Equity */}
              <div className="border-t-2 border-gray-800 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">TOTAL LIABILITIES & EQUITY</span>
                  <span className="text-lg font-bold">
                    {formatCurrency(balanceSheet.totalLiabilitiesAndEquity)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Ratios */}
      <Card>
        <CardHeader>
          <CardTitle>Key Financial Ratios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Debt-to-Equity Ratio</p>
              <p className="text-lg font-semibold">
                {balanceSheet.equity.totalEquity > 0 
                  ? (balanceSheet.liabilities.totalLiabilities / balanceSheet.equity.totalEquity).toFixed(2)
                  : 'N/A'
                }
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Equity Ratio</p>
              <p className="text-lg font-semibold">
                {balanceSheet.assets.totalAssets > 0 
                  ? ((balanceSheet.equity.totalEquity / balanceSheet.assets.totalAssets) * 100).toFixed(1)
                  : '0.0'
                }%
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Asset Composition</p>
              <p className="text-lg font-semibold">
                {balanceSheet.assets.totalAssets > 0 
                  ? ((balanceSheet.assets.currentAssets.reduce((sum, a) => sum + a.amount, 0) / balanceSheet.assets.totalAssets) * 100).toFixed(1)
                  : '0.0'
                }% Current
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Financial Leverage</p>
              <p className="text-lg font-semibold">
                {balanceSheet.equity.totalEquity > 0 
                  ? (balanceSheet.assets.totalAssets / balanceSheet.equity.totalEquity).toFixed(2)
                  : 'N/A'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BalanceSheetReport;