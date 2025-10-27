"use client";

/**
 * BRANDING PROVIDER
 *
 * Dynamically applies school branding colors to CSS custom properties.
 * This allows the entire app to reflect the school's chosen color scheme.
 */

import { useEffect } from "react";
import { useSchool } from "@/contexts/SchoolContext";

export function BrandingProvider() {
  const { config } = useSchool();

  useEffect(() => {
    if (!config?.branding) return;

    const root = document.documentElement;
    const { primaryColor, secondaryColor, accentColor } = config.branding;

    // Set CSS custom properties for branding colors
    if (primaryColor) {
      root.style.setProperty("--color-brand-primary", primaryColor);
      // Convert hex to RGB for use with opacity
      const rgb = hexToRgb(primaryColor);
      if (rgb) {
        root.style.setProperty(
          "--color-brand-primary-rgb",
          `${rgb.r}, ${rgb.g}, ${rgb.b}`,
        );
      }
    }

    if (secondaryColor) {
      root.style.setProperty("--color-brand-secondary", secondaryColor);
      const rgb = hexToRgb(secondaryColor);
      if (rgb) {
        root.style.setProperty(
          "--color-brand-secondary-rgb",
          `${rgb.r}, ${rgb.g}, ${rgb.b}`,
        );
      }
    }

    if (accentColor) {
      root.style.setProperty("--color-brand-accent", accentColor);
      const rgb = hexToRgb(accentColor);
      if (rgb) {
        root.style.setProperty(
          "--color-brand-accent-rgb",
          `${rgb.r}, ${rgb.g}, ${rgb.b}`,
        );
      }
    }

    // Cleanup function
    return () => {
      root.style.removeProperty("--color-brand-primary");
      root.style.removeProperty("--color-brand-primary-rgb");
      root.style.removeProperty("--color-brand-secondary");
      root.style.removeProperty("--color-brand-secondary-rgb");
      root.style.removeProperty("--color-brand-accent");
      root.style.removeProperty("--color-brand-accent-rgb");
    };
  }, [config?.branding]);

  return null; // This component doesn't render anything
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Remove # if present
  hex = hex.replace(/^#/, "");

  // Parse hex
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }

  const bigint = parseInt(hex, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}
