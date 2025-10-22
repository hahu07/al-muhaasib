import type { FixedAsset, SimpleAsset, AssetCategory } from "@/types";

// Helper function to safely convert various date formats to ISO string
function convertToISOString(dateValue: unknown): string {
  if (!dateValue) {
    return new Date().toISOString();
  }

  if (dateValue instanceof Date) {
    return dateValue.toISOString();
  }

  if (typeof dateValue === "string") {
    const parsedDate = new Date(dateValue);
    return isNaN(parsedDate.getTime())
      ? new Date().toISOString()
      : parsedDate.toISOString();
  }

  if (typeof dateValue === "number") {
    const parsedDate = new Date(dateValue);
    return isNaN(parsedDate.getTime())
      ? new Date().toISOString()
      : parsedDate.toISOString();
  }

  if (typeof dateValue === "bigint") {
    const ms = Number(dateValue / BigInt(1_000_000));
    const parsedDate = new Date(ms);
    return isNaN(parsedDate.getTime())
      ? new Date().toISOString()
      : parsedDate.toISOString();
  }

  // For any other data type, return current timestamp
  return new Date().toISOString();
}

// Map from service AssetCategory to UI category
export function mapServiceCategoryToUI(
  category: AssetCategory,
): SimpleAsset["category"] {
  const mappings: Record<AssetCategory, SimpleAsset["category"]> = {
    computer_equipment: "electronics",
    laboratory_equipment: "laboratory",
    sports_equipment: "sports",
    classroom_furniture: "furniture",
    office_furniture: "furniture",
    library_books: "books",
    school_buses: "vehicles",
    cars: "vehicles",
    motorcycles: "vehicles",
    buildings: "buildings",
    building_improvements: "buildings",
    land: "land",
    fixtures: "furniture",
    kitchen_equipment: "equipment",
    office_equipment: "equipment",
    audio_visual_equipment: "electronics",
    generator: "equipment",
    air_conditioning: "equipment",
    software: "electronics",
    other: "other",
  };

  return mappings[category] || "other";
}

// Map from UI category to service AssetCategory
export function mapUICategoryToService(
  category: SimpleAsset["category"],
): AssetCategory {
  const mappings: Record<SimpleAsset["category"], AssetCategory> = {
    electronics: "computer_equipment",
    laboratory: "laboratory_equipment",
    sports: "sports_equipment",
    furniture: "classroom_furniture",
    books: "library_books",
    vehicles: "school_buses",
    buildings: "buildings",
    land: "land",
    equipment: "office_equipment",
    other: "other",
  };

  return mappings[category] || "other";
}

// Map from service status to UI status
export function mapServiceStatusToUI(
  status: FixedAsset["status"],
): SimpleAsset["status"] {
  const mappings: Record<FixedAsset["status"], SimpleAsset["status"]> = {
    active: "active",
    "under-maintenance": "under_maintenance",
    disposed: "disposed",
    lost: "inactive",
    damaged: "inactive",
  };

  return mappings[status] || "inactive";
}

// Map from UI status to service status
export function mapUIStatusToService(
  status: SimpleAsset["status"],
): FixedAsset["status"] {
  const mappings: Record<SimpleAsset["status"], FixedAsset["status"]> = {
    active: "active",
    under_maintenance: "under-maintenance",
    disposed: "disposed",
    inactive: "lost",
  };

  return mappings[status] || "active";
}

// Convert service FixedAsset to UI SimpleAsset
export function convertServiceAssetToUI(asset: FixedAsset): SimpleAsset {
  return {
    id: asset.id,
    assetNumber: asset.assetCode,
    name: asset.assetName,
    category: mapServiceCategoryToUI(asset.category),
    description: asset.description || "",
    purchaseDate: asset.purchaseDate,
    purchasePrice: Number(asset.purchasePrice) || 0,
    currentValue: Number(asset.currentValue) || undefined,
    vendor: asset.vendor || "",
    location: asset.location || "",
    department: "", // Service doesn't have department field, would need to be added
    condition: asset.condition || "good",
    serialNumber: asset.serialNumber || "",
    warranty: asset.warranty
      ? {
          startDate: asset.warranty.startDate,
          endDate: asset.warranty.endDate,
          provider: asset.warranty.warrantyProvider || "",
          terms: asset.warranty.coverageDetails || "",
        }
      : undefined,
    notes: asset.notes || "",
    status: mapServiceStatusToUI(asset.status),
    recordedBy: asset.createdBy || "",
    createdAt: convertToISOString(asset.createdAt),
    updatedAt: convertToISOString(asset.updatedAt),
  };
}

// Convert UI SimpleAsset to service FixedAsset creation data
export function convertUIAssetToServiceCreation(
  asset: Omit<SimpleAsset, "id" | "createdAt" | "updatedAt">,
  depreciationRate?: number,
  usefulLifeYears?: number,
): Omit<
  FixedAsset,
  | "id"
  | "createdAt"
  | "updatedAt"
  | "assetCode"
  | "currentValue"
  | "accumulatedDepreciation"
> {
  const defaultUsefulLife = usefulLifeYears || 10;
  const defaultDepreciationRate = depreciationRate || 10;

  return {
    assetName: asset.name,
    category: mapUICategoryToService(asset.category),
    description: asset.description,
    specifications: asset.serialNumber ? `Serial: ${asset.serialNumber}` : "",
    purchaseDate: asset.purchaseDate,
    purchasePrice: asset.purchasePrice,
    vendor: asset.vendor,
    location: asset.location,
    condition: asset.condition,
    serialNumber: asset.serialNumber || "",
    warranty: asset.warranty
      ? {
          startDate: asset.warranty.startDate,
          endDate: asset.warranty.endDate,
          warrantyPeriodMonths:
            asset.warranty.endDate && asset.warranty.startDate
              ? Math.floor(
                  (new Date(asset.warranty.endDate).getTime() -
                    new Date(asset.warranty.startDate).getTime()) /
                    (1000 * 60 * 60 * 24 * 30),
                )
              : 0,
          warrantyProvider: asset.warranty.provider,
          coverageDetails: asset.warranty.terms,
        }
      : undefined,
    notes: asset.notes,
    status: mapUIStatusToService(asset.status),
    createdBy: asset.recordedBy,
    depreciationMethod: "straight-line" as const,
    depreciationRate: defaultDepreciationRate,
    usefulLifeYears: defaultUsefulLife,
    residualValue: asset.purchasePrice * 0.1,
  };
}
