'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import AssetRegistrationForm from './AssetRegistrationForm';
import AssetList from './AssetList';
import AssetDetailsModal from './AssetDetailsModal';
import AssetRegisterReport from '../reports/AssetRegisterReport';
import DepreciationScheduleReport from '../reports/DepreciationScheduleReport';
import IssuesReport from './IssuesReport';
import SummaryReport from './SummaryReport';
import type { SimpleAsset } from '@/types';
import { useRealtimeAssets } from '@/hooks/useRealtimeAssets';
import {
  Package,
  Plus,
  BarChart3,
  FileText,
  Settings,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Eye,
  RefreshCw
} from 'lucide-react';

const AssetManagement = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<SimpleAsset | null>(null);
  const [editingAsset, setEditingAsset] = useState<SimpleAsset | null>(null);
  const { assets, statistics, loading, error, refresh } = useRealtimeAssets();

  const handleAssetRegistered = () => {
    setShowRegistrationModal(false);
    setEditingAsset(null);
    refresh(); // Refresh real-time data
  };

  const handleEditAsset = (asset: SimpleAsset) => {
    setEditingAsset(asset);
    setShowRegistrationModal(true);
  };

  const handleViewAsset = (asset: SimpleAsset) => {
    setSelectedAsset(asset);
    setShowDetailsModal(true);
  };

  const handleNavigateToReport = (reportType: string) => {
    setActiveReport(reportType);
  };

  const handleBackFromReport = () => {
    setActiveReport(null);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'register', label: 'Register Asset', icon: Plus },
    { id: 'list', label: 'Asset List', icon: Package },
    { id: 'reports', label: 'Reports', icon: FileText },
  ];

  // If viewing a specific report, render it
  if (activeReport) {
    const currentDate = new Date().toISOString().split('T')[0];
    const startOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
    
    const reportFilters = {
      asOfDate: currentDate,
      startDate: startOfYear,
      endDate: currentDate,
      format: 'monthly' as const
    };

    switch (activeReport) {
      case 'asset-register':
        return (
          <AssetRegisterReport 
            filters={reportFilters} 
            onBack={handleBackFromReport} 
          />
        );
      case 'depreciation-schedule':
        return (
          <DepreciationScheduleReport 
            filters={reportFilters} 
            onBack={handleBackFromReport} 
          />
        );
      case 'issues-report':
        return <IssuesReport onBack={handleBackFromReport} />;
      case 'summary-report':
        return <SummaryReport onBack={handleBackFromReport} />;
      default:
        return (
          <div className="p-6">
            <Button onClick={handleBackFromReport} className="mb-4">
              ← Back to Reports
            </Button>
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Report Coming Soon</h2>
              <p className="text-gray-600">This report is not yet implemented.</p>
            </div>
          </div>
        );
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Asset Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track and manage your school&apos;s fixed assets
          </p>
        </div>
        <Button 
          onClick={() => setShowRegistrationModal(true)}
          size="lg"
          className="flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Register New Asset
        </Button>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {activeTab === 'overview' && (
          <OverviewTab 
            statistics={statistics} 
            loading={loading} 
            error={error}
            onRefresh={refresh}
            onViewAsset={handleViewAsset}
          />
        )}
        {activeTab === 'register' && (
          <div className="max-w-4xl">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Register New Asset
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AssetRegistrationForm
                  onSuccess={handleAssetRegistered}
                  onCancel={() => setActiveTab('overview')}
                />
              </CardContent>
            </Card>
          </div>
        )}
        {activeTab === 'list' && (
          <AssetList
            onEditAsset={handleEditAsset}
            onViewAsset={handleViewAsset}
            refreshTrigger={0}
            preloadedAssets={assets}
          />
        )}
        {activeTab === 'reports' && <ReportsTab onNavigateToReport={handleNavigateToReport} />}
      </div>

      {/* Registration Modal */}
      <Dialog open={showRegistrationModal} onOpenChange={() => {
        setShowRegistrationModal(false);
        setEditingAsset(null);
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              {editingAsset ? 'Edit Asset' : 'Register New Asset'}
            </DialogTitle>
          </DialogHeader>
          <AssetRegistrationForm
            asset={editingAsset || undefined}
            onSuccess={handleAssetRegistered}
            onCancel={() => {
              setShowRegistrationModal(false);
              setEditingAsset(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Asset Details Modal */}
      <AssetDetailsModal
        asset={selectedAsset}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedAsset(null);
        }}
        onEdit={(asset) => {
          setShowDetailsModal(false);
          setSelectedAsset(null);
          handleEditAsset(asset);
        }}
      />
    </div>
  );
};

// Overview Tab Component
interface OverviewTabProps {
  statistics: ReturnType<typeof useRealtimeAssets>['statistics'];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onViewAsset: (asset: SimpleAsset) => void;
}

const OverviewTab = ({ statistics, loading, error, onRefresh, onViewAsset }: OverviewTabProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && !statistics) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading asset data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">Error Loading Assets</h3>
        <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
        <Button onClick={onRefresh} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (!statistics) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Loading Indicator */}
      {loading && (
        <div className="flex items-center justify-end text-sm text-gray-600 dark:text-gray-400">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          Refreshing...
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Assets
                </p>
                <p className="text-2xl font-bold">{statistics.totalAssets}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Active Assets
                </p>
                <p className="text-2xl font-bold text-green-600">{statistics.activeAssets}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Under Maintenance
                </p>
                <p className="text-2xl font-bold text-yellow-600">{statistics.underMaintenance}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Value
                </p>
                <p className="text-2xl font-bold">{formatCurrency(statistics.totalValue)}</p>
                {statistics.totalDepreciation > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Depreciation: {formatCurrency(statistics.totalDepreciation)}
                  </p>
                )}
              </div>
              <DollarSign className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {(statistics.warrantyExpiringSoon.length > 0 || statistics.needsMaintenance.length > 0) && (
        <div className="space-y-4">
          {statistics.warrantyExpiringSoon.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                    Warranty Expiring Soon ({statistics.warrantyExpiringSoon.length})
                  </h4>
                  <div className="space-y-2">
                    {statistics.warrantyExpiringSoon.slice(0, 3).map(asset => (
                      <div 
                        key={asset.id}
                        className="flex items-center justify-between bg-white dark:bg-gray-800 rounded p-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                        onClick={() => onViewAsset(asset)}
                      >
                        <div>
                          <p className="font-medium text-sm">{asset.name}</p>
                          <p className="text-xs text-gray-500">
                            Expires: {asset.warranty?.endDate ? formatDate(asset.warranty.endDate) : 'N/A'}
                          </p>
                        </div>
                        <Eye className="w-4 h-4 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {statistics.needsMaintenance.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                    Assets Needing Maintenance ({statistics.needsMaintenance.length})
                  </h4>
                  <div className="space-y-2">
                    {statistics.needsMaintenance.slice(0, 3).map(asset => (
                      <div 
                        key={asset.id}
                        className="flex items-center justify-between bg-white dark:bg-gray-800 rounded p-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                        onClick={() => onViewAsset(asset)}
                      >
                        <div>
                          <p className="font-medium text-sm">{asset.name}</p>
                          <p className="text-xs text-gray-500">
                            Condition: {asset.condition.replace('_', ' ').toUpperCase()}
                          </p>
                        </div>
                        <Eye className="w-4 h-4 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent Registrations</span>
              {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statistics.recentAssets.length > 0 ? (
                statistics.recentAssets.slice(0, 5).map((asset) => (
                  <div 
                    key={asset.id} 
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => onViewAsset(asset)}
                  >
                    <div className="flex items-center gap-3">
                      <Package className="w-8 h-8 text-blue-500" />
                      <div>
                        <p className="font-medium">{asset.name}</p>
                        <p className="text-sm text-gray-500">{asset.assetNumber}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {asset.createdAt ? formatDate(asset.createdAt) : 'N/A'}
                      </p>
                      <p className="text-sm font-medium">{formatCurrency(asset.purchasePrice)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No assets registered yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assets by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.keys(statistics.byCategory).length > 0 ? (
                Object.entries(statistics.byCategory)
                  .sort((a, b) => b[1].count - a[1].count)
                  .slice(0, 5)
                  .map(([category, data]) => {
                    const percentage = statistics.totalAssets > 0 
                      ? (data.count / statistics.totalAssets) * 100 
                      : 0;
                    
                    const categoryLabels: Record<string, string> = {
                      'electronics': 'Electronics & IT',
                      'furniture': 'Furniture & Fixtures',
                      'equipment': 'Equipment & Machinery',
                      'vehicles': 'Vehicles',
                      'laboratory': 'Laboratory',
                      'sports': 'Sports',
                      'books': 'Books',
                      'buildings': 'Buildings',
                      'land': 'Land',
                      'other': 'Others'
                    };

                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{categoryLabels[category] || category}</span>
                          <div className="text-right">
                            <span className="font-medium">{data.count} assets</span>
                            <span className="text-gray-500 ml-2">({formatCurrency(data.value)})</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Reports Tab Component
interface ReportsTabProps {
  onNavigateToReport: (reportType: string) => void;
}

const ReportsTab = ({ onNavigateToReport }: ReportsTabProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Asset Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-32 flex-col gap-3"
              onClick={() => onNavigateToReport('asset-register')}
            >
              <FileText className="w-8 h-8" />
              <div className="text-center">
                <p className="font-medium">Asset Register</p>
                <p className="text-sm text-gray-500">Complete asset list</p>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-32 flex-col gap-3"
              onClick={() => onNavigateToReport('depreciation-schedule')}
            >
              <TrendingUp className="w-8 h-8" />
              <div className="text-center">
                <p className="font-medium">Depreciation Report</p>
                <p className="text-sm text-gray-500">Asset value analysis</p>
              </div>
            </Button>
            
            <Button variant="outline" className="h-32 flex-col gap-3 opacity-50" disabled>
              <Settings className="w-8 h-8" />
              <div className="text-center">
                <p className="font-medium">Maintenance Report</p>
                <p className="text-sm text-gray-500">Coming soon</p>
              </div>
            </Button>
            
            <Button variant="outline" className="h-32 flex-col gap-3 opacity-50" disabled>
              <DollarSign className="w-8 h-8" />
              <div className="text-center">
                <p className="font-medium">Valuation Report</p>
                <p className="text-sm text-gray-500">Coming soon</p>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-32 flex-col gap-3"
              onClick={() => onNavigateToReport('issues-report')}
            >
              <AlertTriangle className="w-8 h-8" />
              <div className="text-center">
                <p className="font-medium">Issues Report</p>
                <p className="text-sm text-gray-500">Assets needing attention</p>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-32 flex-col gap-3"
              onClick={() => onNavigateToReport('summary-report')}
            >
              <BarChart3 className="w-8 h-8" />
              <div className="text-center">
                <p className="font-medium">Summary Report</p>
                <p className="text-sm text-gray-500">Executive summary</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custom Report Builder</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Custom Reports Coming Soon</h3>
            <p className="text-gray-500">
              Build custom reports with filters and export options will be available in the next update.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssetManagement;