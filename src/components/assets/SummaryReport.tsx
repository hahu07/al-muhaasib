"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Package,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
} from "lucide-react";
import { useRealtimeAssets } from "@/hooks/useRealtimeAssets";

interface SummaryReportProps {
  onBack: () => void;
}

const SummaryReport: React.FC<SummaryReportProps> = ({ onBack }) => {
  const { assets, statistics, loading, error } = useRealtimeAssets();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number, total: number) => {
    if (total === 0) return "0%";
    return `${((value / total) * 100).toFixed(1)}%`;
  };

  const getCategoryDisplayName = (category: string) => {
    const categoryLabels: Record<string, string> = {
      electronics: "Electronics & IT",
      furniture: "Furniture & Fixtures",
      equipment: "Equipment & Machinery",
      vehicles: "Vehicles",
      laboratory: "Laboratory",
      sports: "Sports Equipment",
      books: "Books & Library",
      buildings: "Buildings",
      land: "Land & Property",
      other: "Others",
    };
    return categoryLabels[category] || category;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Asset Summary Report</h1>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">Loading asset summary...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Asset Summary Report</h1>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="p-6">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Asset Summary Report</h1>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">No asset data available.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const deprecationRate =
    statistics.totalValue > 0
      ? (statistics.totalDepreciation / statistics.totalValue) * 100
      : 0;

  const healthScore =
    statistics.totalAssets > 0
      ? ((statistics.activeAssets + statistics.underMaintenance * 0.5) /
          statistics.totalAssets) *
        100
      : 100;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Asset Summary Report</h1>
            <p className="text-sm text-gray-600">
              Executive overview of asset portfolio
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => window.print()}>
          Print Report
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Assets
                </p>
                <p className="text-3xl font-bold">{statistics.totalAssets}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {statistics.activeAssets} active
                </p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-3xl font-bold">
                  {formatCurrency(statistics.totalValue)}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Current portfolio value
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Depreciation
                </p>
                <p className="text-3xl font-bold">
                  {formatCurrency(statistics.totalDepreciation)}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {deprecationRate.toFixed(1)}% of total value
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Health Score
                </p>
                <p className="text-3xl font-bold">{healthScore.toFixed(0)}%</p>
                <p className="mt-1 text-xs text-gray-500">
                  Asset portfolio health
                </p>
              </div>
              {healthScore >= 80 ? (
                <CheckCircle className="h-8 w-8 text-green-500" />
              ) : healthScore >= 60 ? (
                <Clock className="h-8 w-8 text-yellow-500" />
              ) : (
                <AlertTriangle className="h-8 w-8 text-red-500" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Asset Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Asset Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(statistics.byStatus).map(([status, count]) => {
                const percentage = (count / statistics.totalAssets) * 100;
                let statusLabel = status
                  .replace("_", " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase());
                let badgeVariant:
                  | "default"
                  | "secondary"
                  | "destructive"
                  | "outline" = "outline";
                let barColor = "bg-gray-400";

                switch (status) {
                  case "active":
                    badgeVariant = "default";
                    barColor = "bg-green-500";
                    break;
                  case "under_maintenance":
                    badgeVariant = "secondary";
                    barColor = "bg-yellow-500";
                    statusLabel = "Under Maintenance";
                    break;
                  case "disposed":
                    badgeVariant = "destructive";
                    barColor = "bg-red-500";
                    break;
                  case "inactive":
                    badgeVariant = "outline";
                    barColor = "bg-gray-400";
                    break;
                }

                return (
                  <div key={status} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={badgeVariant}>{statusLabel}</Badge>
                        <span className="text-sm font-medium">
                          {count} assets
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-200">
                      <div
                        className={`${barColor} h-2 rounded-full transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top Categories by Value */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Top Categories by Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(statistics.byCategory)
                .sort((a, b) => b[1].value - a[1].value)
                .slice(0, 5)
                .map(([category, data]) => {
                  const percentage = (data.value / statistics.totalValue) * 100;

                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {getCategoryDisplayName(category)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {data.count} assets
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {formatCurrency(data.value)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {percentage.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-200">
                        <div
                          className="h-2 rounded-full bg-blue-500 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Alerts */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Recent Acquisitions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5" />
              Recent Acquisitions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statistics.recentAssets.length > 0 ? (
                statistics.recentAssets.slice(0, 5).map((asset) => (
                  <div
                    key={asset.id}
                    className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Package className="h-6 w-6 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium">{asset.name}</p>
                        <p className="text-xs text-gray-500">
                          {asset.assetNumber}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {formatCurrency(asset.purchasePrice)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {asset.createdAt &&
                          new Date(asset.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-gray-500">
                  <Package className="mx-auto mb-2 h-12 w-12 opacity-50" />
                  <p>No recent acquisitions</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Attention Required */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Attention Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Assets needing maintenance */}
              {statistics.needsMaintenance.length > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="font-medium text-red-900">
                      {statistics.needsMaintenance.length} assets need
                      maintenance
                    </span>
                  </div>
                  <div className="space-y-1">
                    {statistics.needsMaintenance.slice(0, 3).map((asset) => (
                      <p key={asset.id} className="text-sm text-red-700">
                        • {asset.name} ({asset.condition})
                      </p>
                    ))}
                    {statistics.needsMaintenance.length > 3 && (
                      <p className="text-sm font-medium text-red-600">
                        +{statistics.needsMaintenance.length - 3} more...
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Warranty expiring */}
              {statistics.warrantyExpiringSoon.length > 0 && (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium text-yellow-900">
                      {statistics.warrantyExpiringSoon.length} warranties
                      expiring soon
                    </span>
                  </div>
                  <div className="space-y-1">
                    {statistics.warrantyExpiringSoon
                      .slice(0, 3)
                      .map((asset) => (
                        <p key={asset.id} className="text-sm text-yellow-700">
                          • {asset.name} - expires{" "}
                          {asset.warranty?.endDate &&
                            new Date(
                              asset.warranty.endDate,
                            ).toLocaleDateString()}
                        </p>
                      ))}
                    {statistics.warrantyExpiringSoon.length > 3 && (
                      <p className="text-sm font-medium text-yellow-600">
                        +{statistics.warrantyExpiringSoon.length - 3} more...
                      </p>
                    )}
                  </div>
                </div>
              )}

              {statistics.needsMaintenance.length === 0 &&
                statistics.warrantyExpiringSoon.length === 0 && (
                  <div className="py-8 text-center text-gray-500">
                    <CheckCircle className="mx-auto mb-2 h-12 w-12 text-green-500" />
                    <p className="font-medium text-green-600">
                      All assets in good condition
                    </p>
                  </div>
                )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Executive Summary */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Executive Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <p className="mb-4 text-gray-700">
              The school&apos;s asset portfolio consists of{" "}
              <strong>{statistics.totalAssets} assets</strong> with a total
              value of <strong>{formatCurrency(statistics.totalValue)}</strong>.
              The portfolio maintains a health score of{" "}
              <strong>{healthScore.toFixed(0)}%</strong>, with{" "}
              <strong>
                {statistics.activeAssets} assets (
                {formatPercentage(
                  statistics.activeAssets,
                  statistics.totalAssets,
                )}
                )
              </strong>{" "}
              in active use.
            </p>

            <p className="mb-4 text-gray-700">
              Depreciation accounts for{" "}
              <strong>{formatCurrency(statistics.totalDepreciation)}</strong> or{" "}
              <strong>{deprecationRate.toFixed(1)}%</strong> of the total asset
              value, indicating{" "}
              {deprecationRate < 20
                ? "a relatively new"
                : deprecationRate < 40
                  ? "a moderately aged"
                  : "an aging"}{" "}
              asset base.
            </p>

            {statistics.needsMaintenance.length > 0 ||
            statistics.warrantyExpiringSoon.length > 0 ? (
              <p className="text-gray-700">
                <strong>Immediate attention required:</strong>{" "}
                {statistics.needsMaintenance.length} assets need maintenance and{" "}
                {statistics.warrantyExpiringSoon.length} warranties are expiring
                soon. Addressing these issues promptly will help maintain asset
                performance and value.
              </p>
            ) : (
              <p className="text-green-700">
                <strong>Portfolio Status:</strong> All assets are in good
                condition with no immediate maintenance requirements or warranty
                concerns.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SummaryReport;
