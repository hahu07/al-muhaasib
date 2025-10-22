import { useState, useEffect, useCallback } from "react";
import { fixedAssetService } from "@/services/assetService";
import type { SimpleAsset } from "@/types";
import { convertServiceAssetToUI } from "@/utils/assetMapping";

export interface AssetStatistics {
  totalAssets: number;
  activeAssets: number;
  inactiveAssets: number;
  underMaintenance: number;
  disposedAssets: number;
  totalValue: number;
  totalDepreciation: number;
  byCategory: Record<string, { count: number; value: number }>;
  byStatus: Record<string, number>;
  byCondition: Record<string, number>;
  recentAssets: SimpleAsset[];
  warrantyExpiringSoon: SimpleAsset[];
  needsMaintenance: SimpleAsset[];
}

export interface UseRealtimeAssetsReturn {
  assets: SimpleAsset[];
  statistics: AssetStatistics | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const REFRESH_INTERVAL = 120000; // 2 minutes

export function useRealtimeAssets(): UseRealtimeAssetsReturn {
  const [assets, setAssets] = useState<SimpleAsset[]>([]);
  const [statistics, setStatistics] = useState<AssetStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateStatistics = useCallback(
    (assetList: SimpleAsset[]): AssetStatistics => {
      const now = new Date();
      const thirtyDaysFromNow = new Date(
        now.getTime() + 30 * 24 * 60 * 60 * 1000,
      );

      // Count by status
      const activeAssets = assetList.filter(
        (a) => a.status === "active",
      ).length;
      const inactiveAssets = assetList.filter(
        (a) => a.status === "inactive",
      ).length;
      const underMaintenance = assetList.filter(
        (a) => a.status === "under_maintenance",
      ).length;
      const disposedAssets = assetList.filter(
        (a) => a.status === "disposed",
      ).length;

      // Calculate total value and depreciation
      const totalValue = assetList
        .filter((a) => a.status !== "disposed")
        .reduce((sum, a) => sum + (a.currentValue || a.purchasePrice), 0);

      const totalPurchasePrice = assetList
        .filter((a) => a.status !== "disposed")
        .reduce((sum, a) => sum + a.purchasePrice, 0);

      const totalDepreciation = totalPurchasePrice - totalValue;

      // Group by category
      const byCategory: Record<string, { count: number; value: number }> = {};
      assetList.forEach((asset) => {
        if (!byCategory[asset.category]) {
          byCategory[asset.category] = { count: 0, value: 0 };
        }
        byCategory[asset.category].count++;
        byCategory[asset.category].value +=
          asset.currentValue || asset.purchasePrice;
      });

      // Group by status
      const byStatus: Record<string, number> = {};
      assetList.forEach((asset) => {
        byStatus[asset.status] = (byStatus[asset.status] || 0) + 1;
      });

      // Group by condition
      const byCondition: Record<string, number> = {};
      assetList.forEach((asset) => {
        byCondition[asset.condition] = (byCondition[asset.condition] || 0) + 1;
      });

      // Recent assets (last 10)
      const recentAssets = [...assetList]
        .sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, 10);

      // Warranty expiring soon (within 30 days)
      const warrantyExpiringSoon = assetList.filter((asset) => {
        if (!asset.warranty?.endDate) return false;
        const warrantyEndDate = new Date(asset.warranty.endDate);
        return warrantyEndDate > now && warrantyEndDate <= thirtyDaysFromNow;
      });

      // Assets needing maintenance (poor condition or needs_repair)
      const needsMaintenance = assetList.filter(
        (asset) =>
          asset.condition === "poor" || asset.condition === "needs_repair",
      );

      return {
        totalAssets: assetList.length,
        activeAssets,
        inactiveAssets,
        underMaintenance,
        disposedAssets,
        totalValue,
        totalDepreciation,
        byCategory,
        byStatus,
        byCondition,
        recentAssets,
        warrantyExpiringSoon,
        needsMaintenance,
      };
    },
    [],
  );

  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all assets from the service
      const serviceAssets = await fixedAssetService.list();

      // Convert to UI format
      const uiAssets = serviceAssets.map(convertServiceAssetToUI);

      // Update state
      setAssets(uiAssets);

      // Calculate statistics
      const stats = calculateStatistics(uiAssets);
      setStatistics(stats);
    } catch (err) {
      console.error("Error fetching assets:", err);
      setError("Failed to load assets. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [calculateStatistics]);

  // Initial fetch
  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAssets();
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchAssets]);

  return {
    assets,
    statistics,
    loading,
    error,
    refresh: fetchAssets,
  };
}
