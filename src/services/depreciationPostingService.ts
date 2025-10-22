/**
 * Depreciation Posting Service
 * Handles monthly/annual depreciation calculation and posting
 */

import { fixedAssetService, depreciationService } from "./index";
import { autoPostingService } from "./autoPostingService";
import type { FixedAsset } from "@/types";

export class DepreciationPostingService {
  /**
   * Calculate and post depreciation for all active assets for a given month
   */
  async postMonthlyDepreciation(
    year: string,
    month: string,
    postedBy: string,
  ): Promise<{
    totalDepreciation: number;
    assetsProcessed: number;
    entriesCreated: number;
    errors: { assetCode: string; error: string }[];
  }> {
    const activeAssets = await fixedAssetService.getActiveAssets();
    let totalDepreciation = 0;
    let assetsProcessed = 0;
    let entriesCreated = 0;
    const errors: { assetCode: string; error: string }[] = [];

    for (const asset of activeAssets) {
      try {
        // Skip assets with no depreciation method
        if (asset.depreciationMethod === "none" || !asset.depreciationRate) {
          continue;
        }

        // Calculate monthly depreciation
        const monthlyDepreciation = this.calculateMonthlyDepreciation(asset);

        if (monthlyDepreciation <= 0) {
          continue;
        }

        // Check if already fully depreciated
        if (
          asset.accumulatedDepreciation >=
          asset.purchasePrice - asset.residualValue
        ) {
          continue;
        }

        // Don't exceed residual value
        const maxDepreciation =
          asset.purchasePrice -
          asset.residualValue -
          asset.accumulatedDepreciation;
        const actualDepreciation = Math.min(
          monthlyDepreciation,
          maxDepreciation,
        );

        if (actualDepreciation <= 0) {
          continue;
        }

        // Update asset's accumulated depreciation and current value
        await fixedAssetService.updateDepreciation(
          asset.id,
          actualDepreciation,
        );

        // Create depreciation entry record
        await depreciationService.createDepreciationEntry({
          assetId: asset.id,
          assetName: asset.assetName,
          assetCode: asset.assetCode,
          year,
          month,
          openingValue: asset.currentValue,
          depreciationAmount: actualDepreciation,
          calculatedBy: postedBy,
        });

        // Post journal entry for depreciation
        await autoPostingService.postDepreciation(
          asset.assetName,
          asset.assetCode,
          actualDepreciation,
          {
            description: `Monthly depreciation - ${month}/${year}`,
            reference: `DEP-${year}-${month}-${asset.assetCode}`,
            transactionDate: `${year}-${month}-01`,
            createdBy: postedBy,
            autoPost: true,
          },
        );

        totalDepreciation += actualDepreciation;
        assetsProcessed++;
        entriesCreated++;
      } catch (error) {
        errors.push({
          assetCode: asset.assetCode,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      totalDepreciation,
      assetsProcessed,
      entriesCreated,
      errors,
    };
  }

  /**
   * Calculate monthly depreciation for an asset
   */
  private calculateMonthlyDepreciation(asset: FixedAsset): number {
    if (asset.depreciationMethod === "straight-line") {
      // Use depreciation rate if available
      if (asset.depreciationRate) {
        const annualDepreciation =
          asset.purchasePrice * (asset.depreciationRate / 100);
        return annualDepreciation / 12;
      }

      // Fallback to useful life calculation
      if (asset.usefulLifeYears && asset.usefulLifeYears > 0) {
        const depreciableAmount = asset.purchasePrice - asset.residualValue;
        const annualDepreciation = depreciableAmount / asset.usefulLifeYears;
        return annualDepreciation / 12;
      }
    }

    return 0;
  }

  /**
   * Calculate annual depreciation for reporting
   */
  async calculateAnnualDepreciation(year: string): Promise<{
    totalAnnualDepreciation: number;
    byAsset: Array<{
      assetCode: string;
      assetName: string;
      category: string;
      annualDepreciation: number;
    }>;
  }> {
    const activeAssets = await fixedAssetService.getActiveAssets();
    let totalAnnualDepreciation = 0;
    const byAsset = [];

    for (const asset of activeAssets) {
      if (asset.depreciationMethod === "none" || !asset.depreciationRate) {
        continue;
      }

      const monthlyDepreciation = this.calculateMonthlyDepreciation(asset);
      const annualDepreciation = monthlyDepreciation * 12;

      if (annualDepreciation > 0) {
        totalAnnualDepreciation += annualDepreciation;
        byAsset.push({
          assetCode: asset.assetCode,
          assetName: asset.assetName,
          category: asset.category,
          annualDepreciation,
        });
      }
    }

    return {
      totalAnnualDepreciation,
      byAsset,
    };
  }

  /**
   * Get depreciation summary for a period
   */
  async getDepreciationSummary(
    startDate: string,
    endDate: string,
  ): Promise<{
    totalDepreciation: number;
    entriesCount: number;
    affectedAssets: number;
  }> {
    const entries = await depreciationService.list();

    const filteredEntries = entries.filter((entry) => {
      const entryDate = `${entry.year}-${entry.month?.padStart(2, "0") || "01"}-01`;
      return entryDate >= startDate && entryDate <= endDate;
    });

    const totalDepreciation = filteredEntries.reduce(
      (sum, entry) => sum + entry.depreciationAmount,
      0,
    );

    const uniqueAssets = new Set(filteredEntries.map((entry) => entry.assetId));

    return {
      totalDepreciation,
      entriesCount: filteredEntries.length,
      affectedAssets: uniqueAssets.size,
    };
  }
}

// Export singleton instance
export const depreciationPostingService = new DepreciationPostingService();
