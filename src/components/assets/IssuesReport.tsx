'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, AlertTriangle, Calendar, MapPin, Wrench, Clock } from 'lucide-react';
import { useRealtimeAssets } from '@/hooks/useRealtimeAssets';
import type { SimpleAsset } from '@/types';

interface IssuesReportProps {
  onBack: () => void;
}

const IssuesReport: React.FC<IssuesReportProps> = ({ onBack }) => {
  const { assets, loading, error } = useRealtimeAssets();
  const [issueAssets, setIssueAssets] = useState<{
    maintenanceRequired: SimpleAsset[];
    warrantyExpiring: SimpleAsset[];
    underMaintenance: SimpleAsset[];
    poorCondition: SimpleAsset[];
  }>({
    maintenanceRequired: [],
    warrantyExpiring: [],
    underMaintenance: [],
    poorCondition: []
  });

  useEffect(() => {
    if (!assets || assets.length === 0) return;

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const maintenanceRequired = assets.filter(
      asset => asset.condition === 'needs_repair'
    );

    const warrantyExpiring = assets.filter(asset => {
      if (!asset.warranty?.endDate) return false;
      const warrantyEndDate = new Date(asset.warranty.endDate);
      return warrantyEndDate > now && warrantyEndDate <= thirtyDaysFromNow;
    });

    const underMaintenance = assets.filter(
      asset => asset.status === 'under_maintenance'
    );

    const poorCondition = assets.filter(
      asset => asset.condition === 'poor'
    );

    setIssueAssets({
      maintenanceRequired,
      warrantyExpiring,
      underMaintenance,
      poorCondition
    });
  }, [assets]);

  const getConditionBadgeVariant = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'excellent': return 'default';
      case 'good': return 'secondary';
      case 'fair': return 'secondary';
      case 'poor': return 'destructive';
      case 'needs_repair': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'default';
      case 'under_maintenance': return 'secondary';
      case 'disposed': return 'destructive';
      case 'inactive': return 'outline';
      default: return 'outline';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const totalIssues = issueAssets.maintenanceRequired.length + 
                     issueAssets.warrantyExpiring.length + 
                     issueAssets.underMaintenance.length + 
                     issueAssets.poorCondition.length;

  const totalValue = Object.values(issueAssets)
    .flat()
    .reduce((sum, asset) => sum + (asset.currentValue || asset.purchasePrice), 0);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Asset Issues Report</h1>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">Loading asset issues...</p>
          </CardContent>
        </Card>
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
          <h1 className="text-2xl font-bold">Asset Issues Report</h1>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600">{error}</p>
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
            <h1 className="text-2xl font-bold">Asset Issues Report</h1>
            <p className="text-sm text-gray-600">Assets requiring attention</p>
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
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Total Issues</p>
                <p className="text-xl font-bold">{totalIssues}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Need Repair</p>
                <p className="text-xl font-bold">{issueAssets.maintenanceRequired.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Warranty Expiring</p>
                <p className="text-xl font-bold">{issueAssets.warrantyExpiring.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-xl font-bold">{formatCurrency(totalValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Issues Sections */}
      <div className="space-y-6">
        {/* Assets Needing Repair */}
        {issueAssets.maintenanceRequired.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-red-600" />
                Assets Requiring Immediate Repair ({issueAssets.maintenanceRequired.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 font-medium">Asset</th>
                      <th className="text-left p-3 font-medium">Location</th>
                      <th className="text-left p-3 font-medium">Condition</th>
                      <th className="text-right p-3 font-medium">Value</th>
                      <th className="text-center p-3 font-medium">Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issueAssets.maintenanceRequired.map((asset, index) => (
                      <tr key={asset.id} className={index % 2 === 0 ? 'bg-gray-50/50' : ''}>
                        <td className="p-3">
                          <div>
                            <p className="font-medium">{asset.name}</p>
                            <p className="text-xs text-gray-500">{asset.assetNumber}</p>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1 text-gray-600">
                            <MapPin className="h-3 w-3" />
                            {asset.location || 'N/A'}
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant={getConditionBadgeVariant(asset.condition)}>
                            {asset.condition.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="p-3 text-right font-medium">
                          {formatCurrency(asset.currentValue || asset.purchasePrice)}
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant="destructive">HIGH</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Poor Condition Assets */}
        {issueAssets.poorCondition.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Assets in Poor Condition ({issueAssets.poorCondition.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 font-medium">Asset</th>
                      <th className="text-left p-3 font-medium">Location</th>
                      <th className="text-left p-3 font-medium">Age</th>
                      <th className="text-right p-3 font-medium">Value</th>
                      <th className="text-center p-3 font-medium">Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issueAssets.poorCondition.map((asset, index) => (
                      <tr key={asset.id} className={index % 2 === 0 ? 'bg-gray-50/50' : ''}>
                        <td className="p-3">
                          <div>
                            <p className="font-medium">{asset.name}</p>
                            <p className="text-xs text-gray-500">{asset.assetNumber}</p>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1 text-gray-600">
                            <MapPin className="h-3 w-3" />
                            {asset.location || 'N/A'}
                          </div>
                        </td>
                        <td className="p-3">
                          {asset.createdAt && (
                            <div className="flex items-center gap-1 text-gray-600">
                              <Calendar className="h-3 w-3" />
                              {Math.floor((new Date().getTime() - new Date(asset.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 365))} years
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-right font-medium">
                          {formatCurrency(asset.currentValue || asset.purchasePrice)}
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant="secondary">MEDIUM</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Warranty Expiring Soon */}
        {issueAssets.warrantyExpiring.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                Warranty Expiring Soon ({issueAssets.warrantyExpiring.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 font-medium">Asset</th>
                      <th className="text-left p-3 font-medium">Warranty Provider</th>
                      <th className="text-left p-3 font-medium">Expires</th>
                      <th className="text-right p-3 font-medium">Value</th>
                      <th className="text-center p-3 font-medium">Days Left</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issueAssets.warrantyExpiring.map((asset, index) => {
                      const daysLeft = asset.warranty?.endDate 
                        ? Math.ceil((new Date(asset.warranty.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                        : 0;
                      
                      return (
                        <tr key={asset.id} className={index % 2 === 0 ? 'bg-gray-50/50' : ''}>
                          <td className="p-3">
                            <div>
                              <p className="font-medium">{asset.name}</p>
                              <p className="text-xs text-gray-500">{asset.assetNumber}</p>
                            </div>
                          </td>
                          <td className="p-3">{asset.warranty?.provider || 'N/A'}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-1 text-gray-600">
                              <Calendar className="h-3 w-3" />
                              {asset.warranty?.endDate ? formatDate(asset.warranty.endDate) : 'N/A'}
                            </div>
                          </td>
                          <td className="p-3 text-right font-medium">
                            {formatCurrency(asset.currentValue || asset.purchasePrice)}
                          </td>
                          <td className="p-3 text-center">
                            <Badge variant={daysLeft <= 7 ? 'destructive' : 'secondary'}>
                              {daysLeft} days
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Currently Under Maintenance */}
        {issueAssets.underMaintenance.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-blue-600" />
                Currently Under Maintenance ({issueAssets.underMaintenance.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 font-medium">Asset</th>
                      <th className="text-left p-3 font-medium">Location</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-right p-3 font-medium">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issueAssets.underMaintenance.map((asset, index) => (
                      <tr key={asset.id} className={index % 2 === 0 ? 'bg-gray-50/50' : ''}>
                        <td className="p-3">
                          <div>
                            <p className="font-medium">{asset.name}</p>
                            <p className="text-xs text-gray-500">{asset.assetNumber}</p>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1 text-gray-600">
                            <MapPin className="h-3 w-3" />
                            {asset.location || 'N/A'}
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant={getStatusBadgeVariant(asset.status)}>
                            {asset.status.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="p-3 text-right font-medium">
                          {formatCurrency(asset.currentValue || asset.purchasePrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {totalIssues === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-green-700">No Issues Found</h3>
              <p className="text-gray-600">All assets are in good condition and properly maintained.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default IssuesReport;