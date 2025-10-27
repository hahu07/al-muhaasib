import { BaseDataService, COLLECTIONS } from "./dataService";
import type {
  FixedAsset,
  CapitalExpenditure,
  DepreciationEntry,
  AssetMaintenance,
  AssetDisposal,
  AssetValuation,
} from "@/types";
import { nanoid } from "nanoid";
import { autoPostingService } from "./autoPostingService";

export class FixedAssetService extends BaseDataService<FixedAsset> {
  constructor() {
    super(COLLECTIONS.FIXED_ASSETS);
  }

  /**
   * Create a new fixed asset
   */
  async createAsset(
    data: Omit<
      FixedAsset,
      | "id"
      | "createdAt"
      | "updatedAt"
      | "assetCode"
      | "currentValue"
      | "accumulatedDepreciation"
    >,
  ): Promise<FixedAsset> {
    const assetCode = `AST-${new Date().getFullYear()}-${nanoid(6).toUpperCase()}`;

    const asset = await this.create({
      ...data,
      assetCode,
      currentValue: data.purchasePrice,
      accumulatedDepreciation: 0,
    });

    // Auto-post journal entry for asset purchase
    try {
      await autoPostingService.postAssetPurchase(
        data.assetName as string,
        assetCode,
        data.category as string, // Asset type (category)
        data.purchasePrice as number,
        "bank_transfer", // Default to bank transfer for assets
        (data.vendor as string | undefined) || "Vendor",
        {
          description: `Purchase of ${data.assetName} - ${data.category}`,
          reference: assetCode,
          transactionDate: data.purchaseDate as string,
          createdBy: data.createdBy as string,
          autoPost: true,
        },
      );
    } catch (error) {
      console.error("Failed to auto-post asset purchase journal entry:", error);
      // Don't fail the asset creation if journal entry fails
    }

    return asset;
  }

  /**
   * Get assets by category
   */
  async getByCategory(category: FixedAsset["category"]): Promise<FixedAsset[]> {
    const assets = await this.list();
    return assets.filter((a) => a.category === category);
  }

  /**
   * Get assets by status
   */
  async getByStatus(status: FixedAsset["status"]): Promise<FixedAsset[]> {
    const assets = await this.list();
    return assets.filter((a) => a.status === status);
  }

  /**
   * Get active assets
   */
  async getActiveAssets(): Promise<FixedAsset[]> {
    return this.getByStatus("active");
  }

  /**
   * Get assets by location
   */
  async getByLocation(location: string): Promise<FixedAsset[]> {
    const assets = await this.list();
    return assets.filter(
      (a) => a.location === location && a.status === "active",
    );
  }

  /**
   * Update asset depreciation
   */
  async updateDepreciation(
    assetId: string,
    depreciationAmount: number,
  ): Promise<FixedAsset> {
    const asset = await this.getById(assetId);
    if (!asset) {
      throw new Error("Asset not found");
    }

    const newAccumulatedDepreciation =
      asset.accumulatedDepreciation + depreciationAmount;
    const newCurrentValue = Math.max(
      asset.purchasePrice - newAccumulatedDepreciation,
      asset.residualValue,
    );

    return this.update(assetId, {
      accumulatedDepreciation: newAccumulatedDepreciation,
      currentValue: newCurrentValue,
    });
  }

  /**
   * Calculate straight-line depreciation
   */
  calculateStraightLineDepreciation(asset: FixedAsset): number {
    if (
      asset.depreciationMethod !== "straight-line" ||
      asset.usefulLifeYears === 0
    ) {
      return 0;
    }

    const depreciableAmount = asset.purchasePrice - asset.residualValue;
    return depreciableAmount / asset.usefulLifeYears;
  }

  /**
   * Get asset summary
   */
  async getAssetSummary(): Promise<{
    totalAssets: number;
    totalPurchasePrice: number;
    totalCurrentValue: number;
    totalDepreciation: number;
    byCategory: Record<string, { count: number; value: number }>;
    byStatus: Record<string, number>;
  }> {
    const assets = await this.list();

    const totalPurchasePrice = assets.reduce(
      (sum, a) => sum + a.purchasePrice,
      0,
    );
    const totalCurrentValue = assets.reduce(
      (sum, a) => sum + a.currentValue,
      0,
    );
    const totalDepreciation = assets.reduce(
      (sum, a) => sum + a.accumulatedDepreciation,
      0,
    );

    // By category
    const byCategory: Record<string, { count: number; value: number }> = {};
    assets.forEach((a) => {
      if (!byCategory[a.category]) {
        byCategory[a.category] = { count: 0, value: 0 };
      }
      byCategory[a.category].count++;
      byCategory[a.category].value += a.currentValue;
    });

    // By status
    const byStatus: Record<string, number> = {};
    assets.forEach((a) => {
      byStatus[a.status] = (byStatus[a.status] || 0) + 1;
    });

    return {
      totalAssets: assets.length,
      totalPurchasePrice,
      totalCurrentValue,
      totalDepreciation,
      byCategory,
      byStatus,
    };
  }
}

export class CapitalExpenditureService extends BaseDataService<CapitalExpenditure> {
  constructor() {
    super(COLLECTIONS.CAPITAL_EXPENDITURES);
  }

  /**
   * Create a new capital expenditure project
   */
  async createCapEx(
    data: Omit<
      CapitalExpenditure,
      "id" | "createdAt" | "updatedAt" | "variance" | "totalPaid" | "balance"
    >,
  ): Promise<CapitalExpenditure> {
    return this.create({
      ...data,
      variance: 0,
      totalPaid: 0,
      balance: data.budgetedAmount,
    });
  }

  /**
   * Get projects by status
   */
  async getByStatus(
    status: CapitalExpenditure["status"],
  ): Promise<CapitalExpenditure[]> {
    const projects = await this.list();
    return projects.filter((p) => p.status === status);
  }

  /**
   * Approve a capital expenditure
   */
  async approveCapEx(
    capExId: string,
    approvedBy: string,
  ): Promise<CapitalExpenditure> {
    return this.update(capExId, {
      status: "approved",
      approvedBy,
      approvalDate: new Date().toISOString(),
    });
  }

  /**
   * Record payment for capital expenditure
   */
  async recordPayment(
    capExId: string,
    amount: number,
  ): Promise<CapitalExpenditure> {
    const capEx = await this.getById(capExId);
    if (!capEx) {
      throw new Error("Capital expenditure not found");
    }

    const newTotalPaid = capEx.totalPaid + amount;
    const newBalance = capEx.budgetedAmount - newTotalPaid;
    const newActualAmount = capEx.actualAmount + amount;
    const newVariance = newActualAmount - capEx.budgetedAmount;

    let paymentStatus: CapitalExpenditure["paymentStatus"] = "partial";
    if (newBalance <= 0) {
      paymentStatus = "completed";
    } else if (newTotalPaid === 0) {
      paymentStatus = "pending";
    }

    return this.update(capExId, {
      totalPaid: newTotalPaid,
      balance: newBalance,
      actualAmount: newActualAmount,
      variance: newVariance,
      paymentStatus,
    });
  }

  /**
   * Get CapEx summary
   */
  async getCapExSummary(): Promise<{
    totalProjects: number;
    totalBudgeted: number;
    totalActual: number;
    totalVariance: number;
    byStatus: Record<string, number>;
  }> {
    const projects = await this.list();

    const totalBudgeted = projects.reduce(
      (sum, p) => sum + p.budgetedAmount,
      0,
    );
    const totalActual = projects.reduce((sum, p) => sum + p.actualAmount, 0);
    const totalVariance = totalActual - totalBudgeted;

    const byStatus: Record<string, number> = {};
    projects.forEach((p) => {
      byStatus[p.status] = (byStatus[p.status] || 0) + 1;
    });

    return {
      totalProjects: projects.length,
      totalBudgeted,
      totalActual,
      totalVariance,
      byStatus,
    };
  }
}

export class DepreciationService extends BaseDataService<DepreciationEntry> {
  constructor() {
    super(COLLECTIONS.DEPRECIATION_ENTRIES);
  }

  /**
   * Create depreciation entry
   */
  async createDepreciationEntry(data: {
    assetId: string;
    assetName: string;
    assetCode: string;
    year: string;
    month?: string;
    depreciationAmount: number;
    openingValue: number;
    calculatedBy: string;
  }): Promise<DepreciationEntry> {
    const closingValue = data.openingValue - data.depreciationAmount;

    // Get existing depreciation for this asset
    const existing = await this.getByAssetId(data.assetId);
    const accumulatedDepreciation =
      existing.reduce((sum, e) => sum + e.depreciationAmount, 0) +
      data.depreciationAmount;

    return this.create({
      ...data,
      closingValue,
      accumulatedDepreciation,
      status: "calculated",
      calculatedAt: new Date(),
    });
  }

  /**
   * Get depreciation entries by asset
   */
  async getByAssetId(assetId: string): Promise<DepreciationEntry[]> {
    const entries = await this.list();
    return entries.filter((e) => e.assetId === assetId);
  }

  /**
   * Get depreciation entries by period
   */
  async getByPeriod(
    year: string,
    month?: string,
  ): Promise<DepreciationEntry[]> {
    const entries = await this.list();
    return entries.filter(
      (e) => e.year === year && (!month || e.month === month),
    );
  }

  /**
   * Post depreciation entry
   */
  async postDepreciation(
    entryId: string,
    journalEntryId: string,
  ): Promise<DepreciationEntry> {
    return this.update(entryId, {
      status: "posted",
      journalEntryId,
      postedAt: new Date(),
    });
  }
}

export class AssetMaintenanceService extends BaseDataService<AssetMaintenance> {
  constructor() {
    super(COLLECTIONS.ASSET_MAINTENANCE);
  }

  /**
   * Schedule maintenance
   */
  async scheduleMaintenance(
    data: Omit<AssetMaintenance, "id" | "createdAt" | "updatedAt" | "status">,
  ): Promise<AssetMaintenance> {
    return this.create({
      ...data,
      status: "scheduled",
    });
  }

  /**
   * Get maintenance by asset
   */
  async getByAssetId(assetId: string): Promise<AssetMaintenance[]> {
    const maintenance = await this.list();
    return maintenance.filter((m) => m.assetId === assetId);
  }

  /**
   * Get maintenance by status
   */
  async getByStatus(
    status: AssetMaintenance["status"],
  ): Promise<AssetMaintenance[]> {
    const maintenance = await this.list();
    return maintenance.filter((m) => m.status === status);
  }

  /**
   * Complete maintenance
   */
  async completeMaintenance(
    maintenanceId: string,
    completionDate: string,
    nextMaintenanceDate?: string,
  ): Promise<AssetMaintenance> {
    return this.update(maintenanceId, {
      status: "completed",
      completionDate,
      nextMaintenanceDate,
    });
  }
}

export class AssetDisposalService extends BaseDataService<AssetDisposal> {
  constructor() {
    super(COLLECTIONS.ASSET_DISPOSALS);
  }

  /**
   * Create disposal record
   */
  async createDisposal(
    data: Omit<
      AssetDisposal,
      "id" | "createdAt" | "updatedAt" | "gainOrLoss" | "status"
    >,
  ): Promise<AssetDisposal> {
    const gainOrLoss = Number(data.disposalAmount) - Number(data.bookValue);

    return this.create({
      ...data,
      gainOrLoss,
      status: "pending",
    });
  }

  /**
   * Approve disposal
   */
  async approveDisposal(
    disposalId: string,
    approvedBy: string,
  ): Promise<AssetDisposal> {
    return this.update(disposalId, {
      status: "approved",
      approvedBy,
      approvalDate: new Date().toISOString(),
    });
  }

  /**
   * Complete disposal
   */
  async completeDisposal(
    disposalId: string,
    journalEntryId?: string,
  ): Promise<AssetDisposal> {
    return this.update(disposalId, {
      status: "completed",
      journalEntryId,
    });
  }

  /**
   * Get disposals by asset
   */
  async getByAssetId(assetId: string): Promise<AssetDisposal[]> {
    const disposals = await this.list();
    return disposals.filter((d) => d.assetId === assetId);
  }
}

export class AssetValuationService extends BaseDataService<AssetValuation> {
  constructor() {
    super(COLLECTIONS.ASSET_VALUATIONS);
  }

  /**
   * Create valuation
   */
  async createValuation(
    data: Omit<
      AssetValuation,
      "id" | "createdAt" | "updatedAt" | "revaluationAmount" | "status"
    >,
  ): Promise<AssetValuation> {
    const revaluationAmount =
      Number(data.newValue) - Number(data.previousValue);

    return this.create({
      ...data,
      revaluationAmount,
      status: "pending",
    });
  }

  /**
   * Approve valuation
   */
  async approveValuation(
    valuationId: string,
    approvedBy: string,
  ): Promise<AssetValuation> {
    return this.update(valuationId, {
      status: "approved",
      approvedBy,
    });
  }

  /**
   * Post valuation
   */
  async postValuation(
    valuationId: string,
    journalEntryId: string,
  ): Promise<AssetValuation> {
    return this.update(valuationId, {
      status: "posted",
      journalEntryId,
    });
  }

  /**
   * Get valuations by asset
   */
  async getByAssetId(assetId: string): Promise<AssetValuation[]> {
    const valuations = await this.list();
    return valuations.filter((v) => v.assetId === assetId);
  }
}

// Export singleton instances
export const fixedAssetService = new FixedAssetService();
export const capitalExpenditureService = new CapitalExpenditureService();
export const depreciationService = new DepreciationService();
export const assetMaintenanceService = new AssetMaintenanceService();
export const assetDisposalService = new AssetDisposalService();
export const assetValuationService = new AssetValuationService();

// Combined asset service for reports
class CombinedAssetService {
  fixedAssetService = fixedAssetService;
  capitalExpenditureService = capitalExpenditureService;
  depreciationService = depreciationService;
  assetMaintenanceService = assetMaintenanceService;
  assetDisposalService = assetDisposalService;
  assetValuationService = assetValuationService;
}

export const assetService = new CombinedAssetService();
