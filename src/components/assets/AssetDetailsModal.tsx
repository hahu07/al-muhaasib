"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SimpleAsset } from "@/types";
import {
  Calendar,
  DollarSign,
  MapPin,
  Building,
  Package,
  User,
  FileText,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Trash2,
  Edit,
  Printer,
} from "lucide-react";

interface AssetDetailsModalProps {
  asset: SimpleAsset | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (asset: SimpleAsset) => void;
}

export default function AssetDetailsModal({
  asset,
  isOpen,
  onClose,
  onEdit,
}: AssetDetailsModalProps) {
  if (!asset) return null;

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
      month: "long",
      day: "numeric",
    });
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

  const assetCategories = {
    furniture: "Furniture & Fixtures",
    electronics: "Electronics & IT Equipment",
    vehicles: "Vehicles & Transportation",
    equipment: "Equipment & Machinery",
    buildings: "Buildings & Infrastructure",
    land: "Land & Property",
    books: "Books & Educational Materials",
    sports: "Sports & Recreation",
    laboratory: "Laboratory Equipment",
    other: "Other Assets",
  };

  const isWarrantyActive =
    asset.warranty &&
    asset.warranty.endDate &&
    new Date(asset.warranty.endDate) > new Date();

  const isWarrantyExpiring =
    asset.warranty &&
    asset.warranty.endDate &&
    new Date(asset.warranty.endDate) > new Date() &&
    new Date(asset.warranty.endDate) <=
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const handlePrintAsset = () => {
    // Create a simple print-friendly view
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Asset Details - ${asset.name}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .section { margin-bottom: 20px; }
              .section h3 { border-bottom: 1px solid #ccc; padding-bottom: 5px; }
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
              .info-item { margin-bottom: 10px; }
              .label { font-weight: bold; color: #555; }
              .value { margin-left: 10px; }
              @media print { body { margin: 0; } }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Asset Details</h1>
              <p>Generated on ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div class="section">
              <h3>Basic Information</h3>
              <div class="info-grid">
                <div class="info-item">
                  <span class="label">Asset Number:</span>
                  <span class="value">${asset.assetNumber}</span>
                </div>
                <div class="info-item">
                  <span class="label">Name:</span>
                  <span class="value">${asset.name}</span>
                </div>
                <div class="info-item">
                  <span class="label">Category:</span>
                  <span class="value">${assetCategories[asset.category] || asset.category}</span>
                </div>
                <div class="info-item">
                  <span class="label">Status:</span>
                  <span class="value">${asset.status.replace("_", " ").toUpperCase()}</span>
                </div>
                <div class="info-item">
                  <span class="label">Condition:</span>
                  <span class="value">${asset.condition.replace("_", " ").toUpperCase()}</span>
                </div>
                <div class="info-item">
                  <span class="label">Serial Number:</span>
                  <span class="value">${asset.serialNumber || "N/A"}</span>
                </div>
              </div>
              <div class="info-item">
                <span class="label">Description:</span>
                <span class="value">${asset.description}</span>
              </div>
            </div>

            <div class="section">
              <h3>Financial Information</h3>
              <div class="info-grid">
                <div class="info-item">
                  <span class="label">Purchase Price:</span>
                  <span class="value">${formatCurrency(asset.purchasePrice)}</span>
                </div>
                <div class="info-item">
                  <span class="label">Current Value:</span>
                  <span class="value">${formatCurrency(asset.currentValue || asset.purchasePrice)}</span>
                </div>
                <div class="info-item">
                  <span class="label">Purchase Date:</span>
                  <span class="value">${formatDate(asset.purchaseDate)}</span>
                </div>
                <div class="info-item">
                  <span class="label">Vendor:</span>
                  <span class="value">${asset.vendor}</span>
                </div>
              </div>
            </div>

            <div class="section">
              <h3>Location & Department</h3>
              <div class="info-grid">
                <div class="info-item">
                  <span class="label">Location:</span>
                  <span class="value">${asset.location}</span>
                </div>
                <div class="info-item">
                  <span class="label">Department:</span>
                  <span class="value">${asset.department}</span>
                </div>
              </div>
            </div>

            ${
              asset.warranty
                ? `
            <div class="section">
              <h3>Warranty Information</h3>
              <div class="info-grid">
                <div class="info-item">
                  <span class="label">Provider:</span>
                  <span class="value">${asset.warranty.provider}</span>
                </div>
                <div class="info-item">
                  <span class="label">Start Date:</span>
                  <span class="value">${asset.warranty.startDate ? formatDate(asset.warranty.startDate) : "N/A"}</span>
                </div>
                <div class="info-item">
                  <span class="label">End Date:</span>
                  <span class="value">${asset.warranty.endDate ? formatDate(asset.warranty.endDate) : "N/A"}</span>
                </div>
                <div class="info-item">
                  <span class="label">Terms:</span>
                  <span class="value">${asset.warranty.terms || "N/A"}</span>
                </div>
              </div>
            </div>
            `
                : ""
            }

            ${
              asset.notes
                ? `
            <div class="section">
              <h3>Additional Notes</h3>
              <p>${asset.notes}</p>
            </div>
            `
                : ""
            }
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Package className="h-6 w-6" />
            Asset Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header with Status and Actions */}
          <div className="flex flex-col gap-4 rounded-lg bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:bg-gray-800">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {asset.name}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {asset.assetNumber}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(asset.status)}
              {getConditionBadge(asset.condition)}
            </div>
          </div>

          {/* Basic Information */}
          <div className="rounded-lg border bg-white p-6 dark:bg-gray-800">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <FileText className="h-5 w-5" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Category
                  </p>
                  <p className="text-lg">
                    {assetCategories[asset.category] || asset.category}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Serial Number
                  </p>
                  <p className="text-lg">
                    {asset.serialNumber || "Not specified"}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Description
                  </p>
                  <p className="text-gray-900 dark:text-gray-100">
                    {asset.description}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="rounded-lg border bg-white p-6 dark:bg-gray-800">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <DollarSign className="h-5 w-5" />
              Financial Information
            </h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Purchase Price
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(asset.purchasePrice)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Current Value
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(asset.currentValue || asset.purchasePrice)}
                </p>
              </div>
              <div>
                <p className="flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-400">
                  <Calendar className="h-4 w-4" />
                  Purchase Date
                </p>
                <p className="text-lg">{formatDate(asset.purchaseDate)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Vendor
                </p>
                <p className="text-lg">{asset.vendor}</p>
              </div>
            </div>

            {/* Depreciation info if current value is different from purchase price */}
            {asset.currentValue &&
              asset.currentValue !== asset.purchasePrice && (
                <div className="mt-4 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Depreciation:</strong>{" "}
                    {formatCurrency(asset.purchasePrice - asset.currentValue)}(
                    {(
                      ((asset.purchasePrice - asset.currentValue) /
                        asset.purchasePrice) *
                      100
                    ).toFixed(1)}
                    %)
                  </p>
                </div>
              )}
          </div>

          {/* Location & Department */}
          <div className="rounded-lg border bg-white p-6 dark:bg-gray-800">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <MapPin className="h-5 w-5" />
              Location & Department
            </h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <p className="flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-400">
                  <MapPin className="h-4 w-4" />
                  Location
                </p>
                <p className="text-lg">{asset.location}</p>
              </div>
              <div>
                <p className="flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-400">
                  <Building className="h-4 w-4" />
                  Department
                </p>
                <p className="text-lg">{asset.department}</p>
              </div>
            </div>
          </div>

          {/* Warranty Information */}
          {asset.warranty && (
            <div className="rounded-lg border bg-white p-6 dark:bg-gray-800">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <ShieldCheck className="h-5 w-5" />
                Warranty Information
                {isWarrantyActive && (
                  <Badge variant="default" className="ml-2">
                    Active
                  </Badge>
                )}
                {isWarrantyExpiring && (
                  <Badge variant="destructive" className="ml-2">
                    Expiring Soon
                  </Badge>
                )}
              </h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Provider
                    </p>
                    <p className="text-lg">
                      {asset.warranty.provider || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Terms
                    </p>
                    <p className="text-gray-900 dark:text-gray-100">
                      {asset.warranty.terms || "Not specified"}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Start Date
                    </p>
                    <p className="text-lg">
                      {asset.warranty.startDate
                        ? formatDate(asset.warranty.startDate)
                        : "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      End Date
                    </p>
                    <p className="text-lg">
                      {asset.warranty.endDate
                        ? formatDate(asset.warranty.endDate)
                        : "Not specified"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Additional Notes */}
          {asset.notes && (
            <div className="rounded-lg border bg-white p-6 dark:bg-gray-800">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <FileText className="h-5 w-5" />
                Additional Notes
              </h3>
              <p className="whitespace-pre-wrap text-gray-900 dark:text-gray-100">
                {asset.notes}
              </p>
            </div>
          )}

          {/* Record Information */}
          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
            <div className="grid grid-cols-1 gap-4 text-sm text-gray-600 md:grid-cols-3 dark:text-gray-400">
              <div>
                <p className="font-medium">Recorded By</p>
                <p className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {asset.recordedBy}
                </p>
              </div>
              <div>
                <p className="font-medium">Created</p>
                <p>{asset.createdAt ? formatDate(asset.createdAt) : "N/A"}</p>
              </div>
              <div>
                <p className="font-medium">Last Updated</p>
                <p>{asset.updatedAt ? formatDate(asset.updatedAt) : "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 border-t pt-4">
            <Button onClick={() => onEdit(asset)} className="flex-1">
              <Edit className="mr-2 h-4 w-4" />
              Edit Asset
            </Button>
            <Button variant="outline" onClick={handlePrintAsset}>
              <Printer className="mr-2 h-4 w-4" />
              Print Details
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
