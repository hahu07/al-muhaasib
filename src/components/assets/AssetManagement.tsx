"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AssetRegistrationForm from "./AssetRegistrationForm";
import AssetList from "./AssetList";
import AssetDetailsModal from "./AssetDetailsModal";
import AssetRegisterReport from "../reports/AssetRegisterReport";
import DepreciationScheduleReport from "../reports/DepreciationScheduleReport";
import IssuesReport from "./IssuesReport";
import SummaryReport from "./SummaryReport";
import type { SimpleAsset } from "@/types";
import { useRealtimeAssets } from "@/hooks/useRealtimeAssets";
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
  RefreshCw,
} from "lucide-react";

const AssetManagement = () => {
  const [activeTab, setActiveTab] = useState("overview");
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
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "register", label: "Register Asset", icon: Plus },
    { id: "list", label: "Asset List", icon: Package },
    { id: "reports", label: "Reports", icon: FileText },
  ];

  // If viewing a specific report, render it
  if (activeReport) {
    const currentDate = new Date().toISOString().split("T")[0];
    const startOfYear = new Date(new Date().getFullYear(), 0, 1)
      .toISOString()
      .split("T")[0];

    const reportFilters = {
      asOfDate: currentDate,
      startDate: startOfYear,
      endDate: currentDate,
      format: "monthly" as const,
    };

    switch (activeReport) {
      case "asset-register":
        return (
          <AssetRegisterReport
            filters={reportFilters}
            onBack={handleBackFromReport}
          />
        );
      case "depreciation-schedule":
        return (
          <DepreciationScheduleReport
            filters={reportFilters}
            onBack={handleBackFromReport}
          />
        );
      case "issues-report":
        return <IssuesReport onBack={handleBackFromReport} />;
      case "summary-report":
        return <SummaryReport onBack={handleBackFromReport} />;
      default:
        return (
          <div className="p-6">
            <Button onClick={handleBackFromReport} className="mb-4">
              ← Back to Reports
            </Button>
            <div className="text-center">
              <h2 className="mb-2 text-xl font-semibold">Report Coming Soon</h2>
              <p className="text-gray-600">
                This report is not yet implemented.
              </p>
            </div>
          </div>
        );
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Asset Management
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Track and manage your school&apos;s fixed assets
          </p>
        </div>
        <Button
          onClick={() => setShowRegistrationModal(true)}
          size="lg"
          className="flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
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
                className={`flex items-center gap-2 border-b-2 px-1 py-2 text-sm font-medium whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                } `}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {activeTab === "overview" && (
          <OverviewTab
            statistics={statistics}
            loading={loading}
            error={error}
            onRefresh={refresh}
            onViewAsset={handleViewAsset}
          />
        )}
        {activeTab === "register" && (
          <div className="max-w-4xl">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Register New Asset
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AssetRegistrationForm
                  onSuccess={handleAssetRegistered}
                  onCancel={() => setActiveTab("overview")}
                />
              </CardContent>
            </Card>
          </div>
        )}
        {activeTab === "list" && (
          <AssetList
            onEditAsset={handleEditAsset}
            onViewAsset={handleViewAsset}
            refreshTrigger={0}
            preloadedAssets={assets}
          />
        )}
        {activeTab === "reports" && (
          <ReportsTab onNavigateToReport={handleNavigateToReport} />
        )}
      </div>

      {/* Registration Modal */}
      <Dialog
        open={showRegistrationModal}
        onOpenChange={() => {
          setShowRegistrationModal(false);
          setEditingAsset(null);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {editingAsset ? "Edit Asset" : "Register New Asset"}
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
  statistics: ReturnType<typeof useRealtimeAssets>["statistics"];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onViewAsset: (asset: SimpleAsset) => void;
}

const OverviewTab = ({
  statistics,
  loading,
  error,
  onRefresh,
  onViewAsset,
}: OverviewTabProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading && !statistics) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading asset data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-900/20">
        <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-600" />
        <h3 className="mb-2 text-lg font-semibold text-red-900 dark:text-red-100">
          Error Loading Assets
        </h3>
        <p className="mb-4 text-red-700 dark:text-red-300">{error}</p>
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
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-blue-600"></div>
          Refreshing...
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Assets
                </p>
                <p className="text-2xl font-bold">{statistics.totalAssets}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
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
                <p className="text-2xl font-bold text-green-600">
                  {statistics.activeAssets}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
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
                <p className="text-2xl font-bold text-yellow-600">
                  {statistics.underMaintenance}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
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
                <p className="text-2xl font-bold">
                  {formatCurrency(statistics.totalValue)}
                </p>
                {statistics.totalDepreciation > 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    Depreciation: {formatCurrency(statistics.totalDepreciation)}
                  </p>
                )}
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {(statistics.warrantyExpiringSoon.length > 0 ||
        statistics.needsMaintenance.length > 0) && (
        <div className="space-y-4">
          {statistics.warrantyExpiringSoon.length > 0 && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <div className="flex-1">
                  <h4 className="mb-2 font-semibold text-yellow-900 dark:text-yellow-100">
                    Warranty Expiring Soon (
                    {statistics.warrantyExpiringSoon.length})
                  </h4>
                  <div className="space-y-2">
                    {statistics.warrantyExpiringSoon
                      .slice(0, 3)
                      .map((asset) => (
                        <div
                          key={asset.id}
                          className="flex cursor-pointer items-center justify-between rounded bg-white p-2 hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
                          onClick={() => onViewAsset(asset)}
                        >
                          <div>
                            <p className="text-sm font-medium">{asset.name}</p>
                            <p className="text-xs text-gray-500">
                              Expires:{" "}
                              {asset.warranty?.endDate
                                ? formatDate(asset.warranty.endDate)
                                : "N/A"}
                            </p>
                          </div>
                          <Eye className="h-4 w-4 text-gray-400" />
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {statistics.needsMaintenance.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600 dark:text-red-400" />
                <div className="flex-1">
                  <h4 className="mb-2 font-semibold text-red-900 dark:text-red-100">
                    Assets Needing Maintenance (
                    {statistics.needsMaintenance.length})
                  </h4>
                  <div className="space-y-2">
                    {statistics.needsMaintenance.slice(0, 3).map((asset) => (
                      <div
                        key={asset.id}
                        className="flex cursor-pointer items-center justify-between rounded bg-white p-2 hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
                        onClick={() => onViewAsset(asset)}
                      >
                        <div>
                          <p className="text-sm font-medium">{asset.name}</p>
                          <p className="text-xs text-gray-500">
                            Condition:{" "}
                            {asset.condition.replace("_", " ").toUpperCase()}
                          </p>
                        </div>
                        <Eye className="h-4 w-4 text-gray-400" />
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
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent Registrations</span>
              {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statistics.recentAssets.length > 0 ? (
                statistics.recentAssets.slice(0, 5).map((asset) => (
                  <div
                    key={asset.id}
                    className="flex cursor-pointer items-center justify-between rounded-lg bg-gray-50 p-3 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
                    onClick={() => onViewAsset(asset)}
                  >
                    <div className="flex items-center gap-3">
                      <Package className="h-8 w-8 text-blue-500" />
                      <div>
                        <p className="font-medium">{asset.name}</p>
                        <p className="text-sm text-gray-500">
                          {asset.assetNumber}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {asset.createdAt ? formatDate(asset.createdAt) : "N/A"}
                      </p>
                      <p className="text-sm font-medium">
                        {formatCurrency(asset.purchasePrice)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-gray-500">
                  <Package className="mx-auto mb-2 h-12 w-12 opacity-50" />
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
                    const percentage =
                      statistics.totalAssets > 0
                        ? (data.count / statistics.totalAssets) * 100
                        : 0;

                    const categoryLabels: Record<string, string> = {
                      electronics: "Electronics & IT",
                      furniture: "Furniture & Fixtures",
                      equipment: "Equipment & Machinery",
                      vehicles: "Vehicles",
                      laboratory: "Laboratory",
                      sports: "Sports",
                      books: "Books",
                      buildings: "Buildings",
                      land: "Land",
                      other: "Others",
                    };

                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{categoryLabels[category] || category}</span>
                          <div className="text-right">
                            <span className="font-medium">
                              {data.count} assets
                            </span>
                            <span className="ml-2 text-gray-500">
                              ({formatCurrency(data.value)})
                            </span>
                          </div>
                        </div>
                        <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                          <div
                            className="h-2 rounded-full bg-blue-600 transition-all"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div className="py-8 text-center text-gray-500">
                  <BarChart3 className="mx-auto mb-2 h-12 w-12 opacity-50" />
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
            <FileText className="h-5 w-5" />
            Asset Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Button
              variant="outline"
              className="h-32 flex-col gap-3"
              onClick={() => onNavigateToReport("asset-register")}
            >
              <FileText className="h-8 w-8" />
              <div className="text-center">
                <p className="font-medium">Asset Register</p>
                <p className="text-sm text-gray-500">Complete asset list</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-32 flex-col gap-3"
              onClick={() => onNavigateToReport("depreciation-schedule")}
            >
              <TrendingUp className="h-8 w-8" />
              <div className="text-center">
                <p className="font-medium">Depreciation Report</p>
                <p className="text-sm text-gray-500">Asset value analysis</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-32 flex-col gap-3 opacity-50"
              disabled
            >
              <Settings className="h-8 w-8" />
              <div className="text-center">
                <p className="font-medium">Maintenance Report</p>
                <p className="text-sm text-gray-500">Coming soon</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-32 flex-col gap-3 opacity-50"
              disabled
            >
              <DollarSign className="h-8 w-8" />
              <div className="text-center">
                <p className="font-medium">Valuation Report</p>
                <p className="text-sm text-gray-500">Coming soon</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-32 flex-col gap-3"
              onClick={() => onNavigateToReport("issues-report")}
            >
              <AlertTriangle className="h-8 w-8" />
              <div className="text-center">
                <p className="font-medium">Issues Report</p>
                <p className="text-sm text-gray-500">
                  Assets needing attention
                </p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-32 flex-col gap-3"
              onClick={() => onNavigateToReport("summary-report")}
            >
              <BarChart3 className="h-8 w-8" />
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
          <div className="py-8 text-center">
            <Settings className="mx-auto mb-4 h-16 w-16 text-gray-400" />
            <h3 className="mb-2 text-lg font-medium">
              Custom Reports Coming Soon
            </h3>
            <p className="text-gray-500">
              Build custom reports with filters and export options will be
              available in the next update.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssetManagement;
