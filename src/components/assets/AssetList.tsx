"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { fixedAssetService } from "@/services";
import type { SimpleAsset } from "@/types";
import { convertServiceAssetToUI } from "@/utils/assetMapping";
import { createSampleAssets } from "@/utils/sampleAssetData";
import {
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Package,
  Calendar,
  MapPin,
  DollarSign,
  Building,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";

interface AssetListProps {
  onEditAsset: (asset: SimpleAsset) => void;
  onViewAsset: (asset: SimpleAsset) => void;
  refreshTrigger?: number;
  preloadedAssets?: SimpleAsset[];
}

const assetCategories = [
  { value: "all", label: "All Categories" },
  { value: "furniture", label: "Furniture & Fixtures" },
  { value: "electronics", label: "Electronics & IT Equipment" },
  { value: "vehicles", label: "Vehicles & Transportation" },
  { value: "equipment", label: "Equipment & Machinery" },
  { value: "buildings", label: "Buildings & Infrastructure" },
  { value: "land", label: "Land & Property" },
  { value: "books", label: "Books & Educational Materials" },
  { value: "sports", label: "Sports & Recreation" },
  { value: "laboratory", label: "Laboratory Equipment" },
  { value: "other", label: "Other Assets" },
];

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "disposed", label: "Disposed" },
  { value: "under_maintenance", label: "Under Maintenance" },
];

const conditionOptions = [
  { value: "all", label: "All Conditions" },
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
  { value: "needs_repair", label: "Needs Repair" },
];

export default function AssetList({
  onEditAsset,
  onViewAsset,
  refreshTrigger,
  preloadedAssets,
}: AssetListProps) {
  const { toast } = useToast();
  const [assets, setAssets] = useState<SimpleAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedCondition, setSelectedCondition] = useState("all");
  const [creatingData, setCreatingData] = useState(false);

  const loadAssets = useCallback(async () => {
    // If preloaded assets are provided, use them
    if (preloadedAssets) {
      setAssets(preloadedAssets);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const serviceAssets = await fixedAssetService.list();
      const uiAssets = serviceAssets.map(convertServiceAssetToUI);
      setAssets(uiAssets);
    } catch (error) {
      console.error("Error loading assets:", error);
      toast({
        title: "Error",
        description: "Failed to load assets. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, preloadedAssets]);

  useEffect(() => {
    loadAssets();
  }, [refreshTrigger, loadAssets, preloadedAssets]);

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.assetNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || asset.category === selectedCategory;
    const matchesStatus =
      selectedStatus === "all" || asset.status === selectedStatus;
    const matchesCondition =
      selectedCondition === "all" || asset.condition === selectedCondition;

    return (
      matchesSearch && matchesCategory && matchesStatus && matchesCondition
    );
  });

  // Debug logging
  console.log("AssetList Debug:", {
    totalAssets: assets.length,
    filteredAssets: filteredAssets.length,
    loading,
    preloadedAssets: preloadedAssets?.length || 0,
  });

  const handleDeleteAsset = async (assetId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this asset? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      await fixedAssetService.delete(assetId);
      toast({
        title: "Asset Deleted",
        description: "The asset has been deleted successfully.",
      });
      loadAssets(); // Refresh the list
    } catch (error) {
      console.error("Error deleting asset:", error);
      toast({
        title: "Error",
        description: "Failed to delete asset. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (
    asset: SimpleAsset,
    newStatus: SimpleAsset["status"],
  ) => {
    try {
      // Map UI status to service layer status if needed
      const serviceStatus =
        newStatus === "under_maintenance" ? "under-maintenance" : newStatus;

      await fixedAssetService.update(asset.id, { status: serviceStatus });
      toast({
        title: "Status Updated",
        description: `Asset status changed to ${newStatus.replace("_", " ")}`,
      });
      loadAssets(); // Refresh the list
    } catch (error) {
      console.error("Error updating asset status:", error);
      toast({
        title: "Error",
        description: "Failed to update asset status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCreateSampleData = async () => {
    try {
      setCreatingData(true);
      await createSampleAssets();
      toast({
        title: "Sample Data Created",
        description: "8 sample assets have been created successfully.",
      });
      loadAssets(); // Refresh the list
    } catch (error) {
      console.error("Error creating sample data:", error);
      toast({
        title: "Error",
        description: "Failed to create sample data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreatingData(false);
    }
  };

  const getStatusBadge = (status: SimpleAsset["status"]) => {
    const statusConfig = {
      active: {
        variant: "default" as const,
        icon: CheckCircle,
        color: "bg-green-100 text-green-800",
      },
      inactive: {
        variant: "secondary" as const,
        icon: XCircle,
        color: "bg-gray-100 text-gray-800",
      },
      disposed: {
        variant: "destructive" as const,
        icon: Trash2,
        color: "bg-red-100 text-red-800",
      },
      under_maintenance: {
        variant: "outline" as const,
        icon: AlertTriangle,
        color: "bg-yellow-100 text-yellow-800",
      },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  const getConditionBadge = (condition: SimpleAsset["condition"]) => {
    const conditionConfig = {
      excellent: "bg-green-100 text-green-800",
      good: "bg-blue-100 text-blue-800",
      fair: "bg-yellow-100 text-yellow-800",
      poor: "bg-orange-100 text-orange-800",
      needs_repair: "bg-red-100 text-red-800",
    };

    return (
      <Badge variant="outline" className={conditionConfig[condition]}>
        {condition.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="mr-2 h-6 w-6 animate-spin" />
        Loading assets...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="rounded-lg border bg-white p-4 dark:bg-gray-800">
        <div className="flex flex-col items-start gap-4 lg:flex-row lg:items-center">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
              <Input
                placeholder="Search assets by name, number, vendor, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {assets.length === 0 && (
            <Button
              onClick={handleCreateSampleData}
              disabled={creatingData}
              className="bg-blue-600 text-white hover:bg-blue-700"
              size="sm"
            >
              {creatingData ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />{" "}
                  Creating...
                </>
              ) : (
                <>+ Create Sample Assets</>
              )}
            </Button>
          )}

          <div className="flex flex-wrap gap-2">
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {assetCategories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedCondition}
              onValueChange={setSelectedCondition}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {conditionOptions.map((condition) => (
                  <SelectItem key={condition.value} value={condition.value}>
                    {condition.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Asset Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-white p-4 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Assets
              </p>
              <p className="text-2xl font-bold">{assets.length}</p>
            </div>
            <Package className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Active Assets
              </p>
              <p className="text-2xl font-bold text-green-600">
                {assets.filter((a) => a.status === "active").length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Under Maintenance
              </p>
              <p className="text-2xl font-bold text-yellow-600">
                {assets.filter((a) => a.status === "under_maintenance").length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Value
              </p>
              <p className="text-2xl font-bold">
                {formatCurrency(
                  assets.reduce(
                    (sum, asset) =>
                      sum + (asset.currentValue || asset.purchasePrice),
                    0,
                  ),
                )}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Assets Table */}
      <div className="overflow-hidden rounded-lg border bg-white dark:bg-gray-800">
        <div className="border-b p-4">
          <h3 className="text-lg font-semibold">
            Assets ({filteredAssets.length} of {assets.length})
          </h3>
        </div>

        {filteredAssets.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">
              No assets found
            </h3>
            <p className="mb-4 text-gray-500">
              {searchTerm ||
              selectedCategory !== "all" ||
              selectedStatus !== "all" ||
              selectedCondition !== "all"
                ? "Try adjusting your search criteria or filters"
                : "Register your first asset to get started"}
            </p>
            {assets.length === 0 &&
              !searchTerm &&
              selectedCategory === "all" &&
              selectedStatus === "all" &&
              selectedCondition === "all" && (
                <Button
                  onClick={handleCreateSampleData}
                  disabled={creatingData}
                  className="mt-2"
                >
                  {creatingData ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />{" "}
                      Creating Sample Assets...
                    </>
                  ) : (
                    <>+ Create Sample Assets</>
                  )}
                </Button>
              )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                    Asset Details
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                    Category & Condition
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                    Location & Department
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                    Financial Info
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                {filteredAssets.map((asset) => (
                  <tr
                    key={asset.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-4 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {asset.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {asset.assetNumber}
                        </div>
                        <div className="text-xs text-gray-400">
                          {asset.vendor}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {assetCategories.find(
                            (c) => c.value === asset.category,
                          )?.label || asset.category}
                        </div>
                        {getConditionBadge(asset.condition)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        <div className="mb-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {asset.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {asset.department}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {formatCurrency(
                            asset.currentValue || asset.purchasePrice,
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-gray-500">
                          <Calendar className="h-3 w-3" />
                          {formatDate(asset.purchaseDate)}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {getStatusBadge(asset.status)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 border border-gray-300 p-0 hover:bg-gray-100"
                            title="Asset Actions"
                            onClick={() =>
                              console.log(
                                "Actions button clicked for asset:",
                                asset.name,
                              )
                            }
                          >
                            <MoreHorizontal className="h-4 w-4 text-white" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="border border-gray-300 shadow-lg dark:border-gray-600 dark:bg-gray-800"
                        >
                          <DropdownMenuItem onClick={() => onViewAsset(asset)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEditAsset(asset)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Asset
                          </DropdownMenuItem>
                          {asset.status === "active" ? (
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(asset, "inactive")
                              }
                              className="text-yellow-600"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Deactivate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(asset, "active")
                              }
                              className="text-green-600"
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Activate
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(asset, "under_maintenance")
                            }
                            className="text-orange-600"
                          >
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            Mark for Maintenance
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteAsset(asset.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Asset
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
