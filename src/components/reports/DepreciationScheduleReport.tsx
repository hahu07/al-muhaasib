'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, DollarSign, TrendingDown, Calculator, Package } from 'lucide-react';
import { reportsService, type DepreciationSchedule } from '@/services/reportsService';

interface DepreciationScheduleReportProps {
  filters: {
    startDate: string;
    endDate: string;
    format: 'monthly' | 'quarterly' | 'yearly';
  };
  onBack: () => void;
}

const DepreciationScheduleReport: React.FC<DepreciationScheduleReportProps> = ({ filters, onBack }) => {
  const [report, setReport] = useState<DepreciationSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadReport = async () => {
      try {
        setLoading(true);
        setError(null);
        const depreciationSchedule = await reportsService.generateDepreciationSchedule(
          filters.startDate,
          filters.endDate
        );
        setReport(depreciationSchedule);
      } catch (err) {
        console.error('Error loading depreciation schedule:', err);
        setError('Failed to load depreciation schedule. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [filters.startDate, filters.endDate]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getDepreciationMethodBadge = (method: string) => {
    switch (method.toLowerCase()) {
      case 'straight-line': return 'default';
      case 'declining-balance': return 'secondary';
      case 'units-of-production': return 'secondary';
      case 'none': return 'outline';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Depreciation Schedule</h1>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">Loading depreciation schedule...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Depreciation Schedule</h1>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600">{error || 'Failed to load report'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Depreciation Schedule</h1>
            <p className="text-sm text-gray-600">
              {new Date(report.startDate).toLocaleDateString()} - {new Date(report.endDate).toLocaleDateString()}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => window.print()}>
          Print Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Depreciable Assets</p>
                <p className="text-xl font-bold">{report.assets.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Monthly Depreciation</p>
                <p className="text-xl font-bold">{formatCurrency(report.totalMonthlyDepreciation)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Total Depreciation</p>
                <p className="text-xl font-bold">{formatCurrency(report.totalAccumulatedDepreciation)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Total Book Value</p>
                <p className="text-xl font-bold">{formatCurrency(report.totalBookValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Depreciation Schedule Table */}
      <Card>
        <CardHeader>
          <CardTitle>Depreciation Details</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-medium">Asset Code</th>
                  <th className="text-left p-3 font-medium">Asset Name</th>
                  <th className="text-left p-3 font-medium">Purchase Date</th>
                  <th className="text-right p-3 font-medium">Purchase Cost</th>
                  <th className="text-left p-3 font-medium">Method</th>
                  <th className="text-center p-3 font-medium">Life (Years)</th>
                  <th className="text-right p-3 font-medium">Monthly Dep.</th>
                  <th className="text-right p-3 font-medium">Period Dep.</th>
                  <th className="text-right p-3 font-medium">YTD Dep.</th>
                  <th className="text-right p-3 font-medium">Total Dep.</th>
                  <th className="text-right p-3 font-medium">Book Value</th>
                </tr>
              </thead>
              <tbody>
                {report.assets.map((asset, index) => (
                  <tr key={asset.assetTag} className={index % 2 === 0 ? 'bg-gray-50/50' : ''}>
                    <td className="p-3 font-medium">{asset.assetTag}</td>
                    <td className="p-3">
                      <p className="font-medium">{asset.assetName}</p>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Calendar className="h-3 w-3" />
                        {new Date(asset.purchaseDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-3 text-right font-medium">{formatCurrency(asset.purchaseCost)}</td>
                    <td className="p-3">
                      <Badge variant={getDepreciationMethodBadge(asset.depreciationMethod)}>
                        {asset.depreciationMethod}
                      </Badge>
                    </td>
                    <td className="p-3 text-center">{asset.usefulLife}</td>
                    <td className="p-3 text-right">{formatCurrency(asset.monthlyDepreciation)}</td>
                    <td className="p-3 text-right font-medium text-orange-600">
                      {formatCurrency(asset.depreciationThisMonth)}
                    </td>
                    <td className="p-3 text-right text-blue-600">
                      {formatCurrency(asset.depreciationYTD)}
                    </td>
                    <td className="p-3 text-right text-red-600">
                      {formatCurrency(asset.accumulatedDepreciation)}
                    </td>
                    <td className="p-3 text-right font-bold">
                      {formatCurrency(asset.bookValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 bg-gray-100 font-medium">
                  <td className="p-3 font-bold" colSpan={6}>Totals</td>
                  <td className="p-3 text-right font-bold">{formatCurrency(report.totalMonthlyDepreciation)}</td>
                  <td className="p-3 text-right font-bold text-orange-600">
                    {formatCurrency(report.assets.reduce((sum, a) => sum + a.depreciationThisMonth, 0))}
                  </td>
                  <td className="p-3 text-right font-bold text-blue-600">
                    {formatCurrency(report.assets.reduce((sum, a) => sum + a.depreciationYTD, 0))}
                  </td>
                  <td className="p-3 text-right font-bold text-red-600">
                    {formatCurrency(report.totalAccumulatedDepreciation)}
                  </td>
                  <td className="p-3 text-right font-bold">{formatCurrency(report.totalBookValue)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DepreciationScheduleReport;