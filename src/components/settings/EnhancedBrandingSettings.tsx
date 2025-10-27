"use client";

/**
 * ENHANCED BRANDING SETTINGS
 *
 * Advanced branding configuration with:
 * - Auto-generate color schemes
 * - Contrast checking
 * - Color palette preview
 * - Dark mode variants
 */

import React, { useState, useEffect } from "react";
import { useSchool } from "@/contexts/SchoolContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Palette,
  Wand2,
  AlertCircle,
  CheckCircle,
  Eye,
  RefreshCw,
} from "lucide-react";
import {
  generateBrandColorScheme,
  checkContrast,
  generatePalette,
  getDarkModeVariant,
  getReadableTextColor,
} from "@/utils/colorUtils";
import { LogoUpload } from "./LogoUpload";
import { ColorVariantTesting } from "./ColorVariantTesting";

export function EnhancedBrandingSettings() {
  const { config, updateConfig } = useSchool();
  const [primaryColor, setPrimaryColor] = useState(
    config?.branding?.primaryColor || "#4F46E5",
  );
  const [secondaryColor, setSecondaryColor] = useState(
    config?.branding?.secondaryColor || "#7C3AED",
  );
  const [accentColor, setAccentColor] = useState(
    config?.branding?.accentColor || "#EC4899",
  );
  const [logo, setLogo] = useState(config?.branding?.logo || "");
  const [logoStorageKey, setLogoStorageKey] = useState(
    config?.branding?.logoStorageKey || "",
  );
  const [saving, setSaving] = useState(false);
  const [showPalette, setShowPalette] = useState(false);

  // Generate color palette for preview
  const palette = generatePalette(primaryColor);
  const darkModeVariant = getDarkModeVariant(primaryColor);

  // Check contrast ratios
  const primaryOnWhite = checkContrast(primaryColor, "#FFFFFF");
  const primaryOnBlack = checkContrast(primaryColor, "#000000");

  // Real-time preview updates
  useEffect(() => {
    // Update CSS variables for live preview
    document.documentElement.style.setProperty("--preview-primary", primaryColor);
    document.documentElement.style.setProperty(
      "--preview-secondary",
      secondaryColor,
    );
    document.documentElement.style.setProperty("--preview-accent", accentColor);
  }, [primaryColor, secondaryColor, accentColor]);

  const handleAutoGenerate = () => {
    const scheme = generateBrandColorScheme(primaryColor);
    setSecondaryColor(scheme.secondary);
    setAccentColor(scheme.accent);
  };

  const handleLogoChange = (logoUrl: string, storageKey?: string) => {
    setLogo(logoUrl);
    if (storageKey) {
      setLogoStorageKey(storageKey);
    }
  };

  const handleApplyVariant = (variant: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
  }) => {
    setPrimaryColor(variant.primaryColor);
    setSecondaryColor(variant.secondaryColor);
    setAccentColor(variant.accentColor);
  };

  const handleSave = async () => {
    if (!config) return;

    try {
      setSaving(true);
      await updateConfig({
        branding: {
          ...config.branding,
          primaryColor,
          secondaryColor,
          accentColor,
          logo,
          logoStorageKey,
        },
      });
      alert("Branding settings saved successfully!");
    } catch (error) {
      console.error("Error saving branding:", error);
      alert("Failed to save branding settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Color Inputs */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Brand Colors</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAutoGenerate}
            className="flex items-center gap-2"
          >
            <Wand2 className="h-4 w-4" />
            Auto-Generate
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Primary Color */}
          <div>
            <Label htmlFor="primaryColor">Primary Color</Label>
            <div className="mt-2 flex gap-2">
              <input
                type="color"
                id="primaryColor"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-10 w-20 cursor-pointer rounded border"
              />
              <Input
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                placeholder="#4F46E5"
                className="flex-1"
              />
            </div>
            {/* Contrast indicator */}
            <div className="mt-2 space-y-1">
              <ContrastIndicator
                label="On White"
                contrast={primaryOnWhite}
                color={primaryColor}
                bg="#FFFFFF"
              />
              <ContrastIndicator
                label="On Black"
                contrast={primaryOnBlack}
                color={primaryColor}
                bg="#000000"
              />
            </div>
          </div>

          {/* Secondary Color */}
          <div>
            <Label htmlFor="secondaryColor">Secondary Color</Label>
            <div className="mt-2 flex gap-2">
              <input
                type="color"
                id="secondaryColor"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="h-10 w-20 cursor-pointer rounded border"
              />
              <Input
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                placeholder="#7C3AED"
                className="flex-1"
              />
            </div>
          </div>

          {/* Accent Color */}
          <div>
            <Label htmlFor="accentColor">Accent Color</Label>
            <div className="mt-2 flex gap-2">
              <input
                type="color"
                id="accentColor"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="h-10 w-20 cursor-pointer rounded border"
              />
              <Input
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                placeholder="#EC4899"
                className="flex-1"
              />
            </div>
          </div>
        </div>

        {/* Logo Upload */}
        <div className="mt-6">
          <LogoUpload
            currentLogo={logo}
            currentStorageKey={logoStorageKey}
            onLogoChange={handleLogoChange}
            disabled={saving}
          />
        </div>
      </Card>

      {/* Color Palette Preview */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Color Palette</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPalette(!showPalette)}
          >
            <Eye className="mr-2 h-4 w-4" />
            {showPalette ? "Hide" : "Show"} Palette
          </Button>
        </div>

        {showPalette && (
          <div className="space-y-4">
            {/* Primary palette */}
            <div>
              <p className="mb-2 text-sm font-medium text-gray-600">
                Primary Color Shades
              </p>
              <div className="flex gap-1">
                {Object.entries(palette).map(([shade, color]) => (
                  <div key={shade} className="flex-1">
                    <div
                      className="h-16 rounded"
                      style={{ backgroundColor: color }}
                      title={`${shade}: ${color}`}
                    />
                    <p className="mt-1 text-center text-xs text-gray-600">
                      {shade}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Dark mode variant */}
            <div>
              <p className="mb-2 text-sm font-medium text-gray-600">
                Dark Mode Variant
              </p>
              <div className="flex gap-4">
                <div>
                  <div
                    className="h-16 w-32 rounded border"
                    style={{ backgroundColor: primaryColor }}
                  />
                  <p className="mt-1 text-center text-xs text-gray-600">
                    Light Mode
                  </p>
                </div>
                <div>
                  <div
                    className="h-16 w-32 rounded border"
                    style={{ backgroundColor: darkModeVariant }}
                  />
                  <p className="mt-1 text-center text-xs text-gray-600">
                    Dark Mode
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Live Preview */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">Live Preview</h3>
        <div className="space-y-4">
          {/* Navbar preview with logo */}
          <div
            className="flex items-center justify-between rounded-lg p-4"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="flex items-center gap-3">
              {logo && (
                <img
                  src={logo}
                  alt="Logo"
                  className="h-10 w-10 rounded bg-white object-contain p-1"
                />
              )}
              <span className="font-bold text-white">
                {config?.schoolName || "School Name"}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                className="rounded px-3 py-1 text-sm font-medium text-white hover:bg-white/20"
                style={{ backgroundColor: secondaryColor }}
              >
                Dashboard
              </button>
              <button
                className="rounded px-3 py-1 text-sm font-medium text-white"
                style={{ backgroundColor: accentColor }}
              >
                Reports
              </button>
            </div>
          </div>

          {/* Button previews */}
          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-lg px-4 py-2 font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: primaryColor }}
            >
              Primary Button
            </button>
            <button
              className="rounded-lg px-4 py-2 font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: secondaryColor }}
            >
              Secondary Button
            </button>
            <button
              className="rounded-lg px-4 py-2 font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: accentColor }}
            >
              Accent Button
            </button>
          </div>

          {/* Card preview */}
          <div
            className="rounded-lg border-2 p-4"
            style={{
              borderColor: primaryColor,
              backgroundColor: `${primaryColor}10`,
            }}
          >
            <h4
              className="mb-2 font-semibold"
              style={{ color: primaryColor }}
            >
              Branded Card Header
            </h4>
            <p className="text-sm text-gray-600">
              This is how cards with your brand colors will appear throughout
              the application.
            </p>
          </div>
        </div>
      </Card>

      {/* A/B Testing */}
      <ColorVariantTesting
        currentPrimary={primaryColor}
        currentSecondary={secondaryColor}
        currentAccent={accentColor}
        onApplyVariant={handleApplyVariant}
      />

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Palette className="mr-2 h-4 w-4" />
              Save Branding
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

/**
 * Contrast Indicator Component
 */
function ContrastIndicator({
  label,
  contrast,
  color,
  bg,
}: {
  label: string;
  contrast: ReturnType<typeof checkContrast>;
  color: string;
  bg: string;
}) {
  const textColor = getReadableTextColor(bg);

  return (
    <div className="flex items-center gap-2 text-xs">
      <div
        className="flex h-6 w-12 items-center justify-center rounded text-xs font-bold"
        style={{ backgroundColor: bg, color: color }}
      >
        Aa
      </div>
      <span className="text-gray-600">{label}:</span>
      {contrast.AA ? (
        <span className="flex items-center gap-1 text-green-600">
          <CheckCircle className="h-3 w-3" />
          {contrast.rating}
        </span>
      ) : (
        <span className="flex items-center gap-1 text-red-600">
          <AlertCircle className="h-3 w-3" />
          Poor
        </span>
      )}
      <span className="text-gray-400">{contrast.ratio}:1</span>
    </div>
  );
}
