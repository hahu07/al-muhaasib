"use client";

/**
 * COLOR VARIANT A/B TESTING
 *
 * Allows testing different brand color schemes side-by-side:
 * - Create and manage color variants
 * - Compare variants visually
 * - Save/load variants to localStorage
 * - Apply winning variant
 */

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FlaskConical,
  Plus,
  Copy,
  Trash2,
  Check,
  Download,
  Upload,
} from "lucide-react";

interface ColorVariant {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  createdAt: string;
}

interface ColorVariantTestingProps {
  currentPrimary: string;
  currentSecondary: string;
  currentAccent: string;
  onApplyVariant: (variant: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
  }) => void;
}

const STORAGE_KEY = "branding_color_variants";

export function ColorVariantTesting({
  currentPrimary,
  currentSecondary,
  currentAccent,
  onApplyVariant,
}: ColorVariantTestingProps) {
  const [variants, setVariants] = useState<ColorVariant[]>([]);
  const [newVariantName, setNewVariantName] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Load variants from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setVariants(JSON.parse(saved));
      } catch (err) {
        console.error("Failed to load variants:", err);
      }
    }
  }, []);

  // Save variants to localStorage
  const saveVariants = (newVariants: ColorVariant[]) => {
    setVariants(newVariants);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newVariants));
  };

  // Create new variant from current colors
  const handleCreateVariant = () => {
    if (!newVariantName.trim()) return;

    const newVariant: ColorVariant = {
      id: `variant-${Date.now()}`,
      name: newVariantName,
      primaryColor: currentPrimary,
      secondaryColor: currentSecondary,
      accentColor: currentAccent,
      createdAt: new Date().toISOString(),
    };

    saveVariants([...variants, newVariant]);
    setNewVariantName("");
    setShowForm(false);
  };

  // Delete variant
  const handleDeleteVariant = (id: string) => {
    saveVariants(variants.filter((v) => v.id !== id));
  };

  // Apply variant to current settings
  const handleApplyVariant = (variant: ColorVariant) => {
    onApplyVariant({
      primaryColor: variant.primaryColor,
      secondaryColor: variant.secondaryColor,
      accentColor: variant.accentColor,
    });
  };

  // Duplicate variant
  const handleDuplicateVariant = (variant: ColorVariant) => {
    const duplicated: ColorVariant = {
      ...variant,
      id: `variant-${Date.now()}`,
      name: `${variant.name} (Copy)`,
      createdAt: new Date().toISOString(),
    };
    saveVariants([...variants, duplicated]);
  };

  // Export variants as JSON
  const handleExport = () => {
    const dataStr = JSON.stringify(variants, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `color-variants-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import variants from JSON
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          saveVariants([...variants, ...imported]);
        }
      } catch (err) {
        console.error("Failed to import variants:", err);
        alert("Invalid JSON file");
      }
    };
    reader.readAsText(file);
  };

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold">A/B Testing</h3>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById("import-variants")?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <input
            id="import-variants"
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={variants.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Save Current
          </Button>
        </div>
      </div>

      {/* Create Variant Form */}
      {showForm && (
        <div className="mb-4 rounded-lg border bg-gray-50 p-4">
          <Label htmlFor="variantName">Variant Name</Label>
          <div className="mt-2 flex gap-2">
            <Input
              id="variantName"
              value={newVariantName}
              onChange={(e) => setNewVariantName(e.target.value)}
              placeholder="e.g., Blue Theme"
              onKeyDown={(e) => e.key === "Enter" && handleCreateVariant()}
            />
            <Button onClick={handleCreateVariant}>Save</Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Variants Grid */}
      {variants.length === 0 ? (
        <div className="py-12 text-center text-gray-500">
          <FlaskConical className="mx-auto mb-3 h-12 w-12 text-gray-400" />
          <p className="text-sm">No color variants saved yet</p>
          <p className="mt-1 text-xs">
            Create variants to A/B test different color schemes
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {variants.map((variant) => (
            <Card key={variant.id} className="p-4">
              {/* Color Preview */}
              <div className="mb-3 flex gap-2">
                <div
                  className="h-12 flex-1 rounded"
                  style={{ backgroundColor: variant.primaryColor }}
                  title="Primary"
                />
                <div
                  className="h-12 flex-1 rounded"
                  style={{ backgroundColor: variant.secondaryColor }}
                  title="Secondary"
                />
                <div
                  className="h-12 flex-1 rounded"
                  style={{ backgroundColor: variant.accentColor }}
                  title="Accent"
                />
              </div>

              {/* Variant Info */}
              <h4 className="mb-1 font-medium">{variant.name}</h4>
              <p className="mb-3 text-xs text-gray-500">
                {new Date(variant.createdAt).toLocaleDateString()}
              </p>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleApplyVariant(variant)}
                >
                  <Check className="mr-1 h-3 w-3" />
                  Apply
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDuplicateVariant(variant)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteVariant(variant.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
}
