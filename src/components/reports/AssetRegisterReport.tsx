"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Download, 
  RefreshCw, 
  Building, 
  TrendingUp,
  MapPin,
  Calendar,
  DollarSign,
  TrendingDown,
  Package,
  Plus
} from "lucide-react";
import { useSchool } from "@/contexts/SchoolContext";
import { assetService } from "@/services/assetService";
import { reportsService, type AssetRegister } from "@/services/reportsService";
import { createSampleAssets, checkAssetData } from "@/utils/sampleAssetData";

interface AssetRegisterReportProps {
  filters: {
    asOfDate: string;
    format: "monthly" | "quarterly" | "yearly";
  };
  onBack: () => void;
}

const AssetRegisterReport: React.FC<AssetRegisterReportProps> = ({
  filters,
  onBack,
}) => {
  const { formatCurrency } = useSchool();
  const [report, setReport] = useState<AssetRegister | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingData, setCreatingData] = useState(false);

  useEffect(() => {
    const loadReport = async () => {
      try {
        setLoading(true);
        setError(null);
        const assetRegister = await reportsService.generateAssetRegister(
          filters.asOfDate,
        );
        setReport(assetRegister);
      } catch (err) {
        console.error("Error loading asset register:", err);
        setError("Failed to load asset register. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [filters.asOfDate]);

  const getConditionBadgeVariant = (condition: string) => {
    switch (condition.toLowerCase()) {
      case "excellent":
        return "default";
      case "good":
        return "secondary";
      case "fair":
        return "secondary";
      case "poor":
        return "destructive";
      case "needs_repair":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "default";
      case "under-maintenance":
        return "secondary";
      case "disposed":
        return "destructive";
      case "lost":
        return "destructive";
      case "damaged":
        return "destructive";
      default:
        return "outline";
    }
  };

  const handleCreateSampleData = async () => {
    try {
      setCreatingData(true);
      await createSampleAssets();
      // Reload the report after creating sample data
      const assetRegister = await reportsService.generateAssetRegister(
        filters.asOfDate,
      );
      setReport(assetRegister);
      setError(null);
    } catch (err) {
      console.error("Error creating sample data:", err);
      setError("Failed to create sample data. Please try again.");
    } finally {
      setCreatingData(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Asset Register</h1>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">Loading asset register...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-6">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Asset Register</h1>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="mb-4 text-red-600">
              {error || "Failed to load report"}
            </p>
            {!error && (
              <Button
                onClick={handleCreateSampleData}
                disabled={creatingData}
                className="mt-4"
              >
                <Plus className="mr-2 h-4 w-4" />
                {creatingData
                  ? "Creating Sample Assets..."
                  : "Create Sample Assets"}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // If report has no assets, show empty state
  if (report.assetCount === 0) {
    return (
      <div className="p-6">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Asset Register</h1>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <Package className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 text-lg font-semibold">No Assets Found</h3>
            <p className="mb-4 text-gray-600">
              There are no assets in the system yet.
            </p>
            <Button onClick={handleCreateSampleData} disabled={creatingData}>
              <Plus className="mr-2 h-4 w-4" />
              {creatingData
                ? "Creating Sample Assets..."
                : "Create Sample Assets"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Asset Register</h1>
            <p className="text-sm text-gray-600">
              As of {new Date(report.asOfDate).toLocaleDateString()}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => window.print()}>
          Print Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Assets</p>
                <p className="text-xl font-bold">{report.assetCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Purchase Cost</p>
                <p className="text-xl font-bold">
                  {formatCurrency(report.totalPurchaseCost)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Depreciation</p>
                <p className="text-xl font-bold">
                  {formatCurrency(report.totalAccumulatedDepreciation)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Book Value</p>
                <p className="text-xl font-bold">
                  {formatCurrency(report.totalBookValue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Asset Details</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-3 text-left font-medium">Asset Code</th>
                  <th className="p-3 text-left font-medium">Asset Name</th>
                  <th className="p-3 text-left font-medium">Category</th>
                  <th className="p-3 text-left font-medium">Purchase Date</th>
                  <th className="p-3 text-right font-medium">Purchase Cost</th>
                  <th className="p-3 text-right font-medium">Depreciation</th>
                  <th className="p-3 text-right font-medium">Book Value</th>
                  <th className="p-3 text-left font-medium">Location</th>
                  <th className="p-3 text-left font-medium">Condition</th>
                  <th className="p-3 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {report.assets.map((asset, index) => (
                  <tr
                    key={asset.assetTag}
                    className={index % 2 === 0 ? "bg-gray-50/50" : ""}
                  >
                    <td className="p-3 font-medium">{asset.assetTag}</td>
                    <td className="p-3">
                      <div>
                        <p className="font-medium">{asset.assetName}</p>
                        <p className="text-xs text-gray-500">
                          {asset.depreciationMethod} - {asset.usefulLife}y
                        </p>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline">{asset.category}</Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Calendar className="h-3 w-3" />
                        {new Date(asset.purchaseDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-3 text-right font-medium">
                      {formatCurrency(asset.purchaseCost)}
                    </td>
                    <td className="p-3 text-right text-orange-600">
                      {formatCurrency(asset.accumulatedDepreciation)}
                    </td>
                    <td className="p-3 text-right font-bold">
                      {formatCurrency(asset.bookValue)}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1 text-gray-600">
                        <MapPin className="h-3 w-3" />
                        {asset.location || "N/A"}
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge
                        variant={getConditionBadgeVariant(asset.condition)}
                      >
                        {asset.condition}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge variant={getStatusBadgeVariant(asset.status)}>
                        {asset.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssetRegisterReport;
