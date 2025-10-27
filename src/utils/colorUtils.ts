/**
 * COLOR UTILITIES
 *
 * Comprehensive color manipulation and analysis utilities for branding.
 * Includes color generation, contrast checking, and accessibility validation.
 */

// ============================================
// COLOR CONVERSION FUNCTIONS
// ============================================

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): RGB {
  hex = hex.replace(/^#/, "");

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

/**
 * Convert RGB to hex
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = Math.round(x).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
}

/**
 * Convert RGB to HSL
 */
export function rgbToHsl(r: number, g: number, b: number): HSL {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Convert HSL to RGB
 */
export function hslToRgb(h: number, s: number, l: number): RGB {
  h /= 360;
  s /= 100;
  l /= 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

// ============================================
// ACCESSIBILITY & CONTRAST
// ============================================

/**
 * Calculate relative luminance (WCAG formula)
 */
export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors (WCAG formula)
 */
export function getContrastRatio(color1: RGB, color2: RGB): number {
  const lum1 = getLuminance(color1.r, color1.g, color1.b);
  const lum2 = getLuminance(color2.r, color2.g, color2.b);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if color combination meets WCAG AA/AAA standards
 */
export function checkContrast(
  foreground: string,
  background: string,
): {
  ratio: number;
  AA: boolean;
  AALarge: boolean;
  AAA: boolean;
  AAALarge: boolean;
  rating: "fail" | "AA" | "AAA";
} {
  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);
  const ratio = getContrastRatio(fg, bg);

  return {
    ratio: Math.round(ratio * 100) / 100,
    AA: ratio >= 4.5,
    AALarge: ratio >= 3,
    AAA: ratio >= 7,
    AAALarge: ratio >= 4.5,
    rating: ratio >= 7 ? "AAA" : ratio >= 4.5 ? "AA" : "fail",
  };
}

/**
 * Suggest readable text color (black or white) for a background
 */
export function getReadableTextColor(backgroundColor: string): string {
  const bg = hexToRgb(backgroundColor);
  const luminance = getLuminance(bg.r, bg.g, bg.b);

  // Return white for dark backgrounds, black for light backgrounds
  return luminance > 0.5 ? "#000000" : "#FFFFFF";
}

// ============================================
// COLOR PALETTE GENERATION
// ============================================

/**
 * Generate a complete color palette (shades from light to dark)
 */
export function generatePalette(baseColor: string): {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
} {
  const rgb = hexToRgb(baseColor);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  const shades = [
    { name: "50", l: 95 },
    { name: "100", l: 90 },
    { name: "200", l: 80 },
    { name: "300", l: 70 },
    { name: "400", l: 60 },
    { name: "500", l: hsl.l }, // Base color
    { name: "600", l: Math.max(hsl.l - 10, 30) },
    { name: "700", l: Math.max(hsl.l - 20, 25) },
    { name: "800", l: Math.max(hsl.l - 30, 20) },
    { name: "900", l: Math.max(hsl.l - 40, 15) },
    { name: "950", l: Math.max(hsl.l - 50, 10) },
  ];

  const palette: Record<string, string> = {};

  shades.forEach((shade) => {
    const rgb = hslToRgb(hsl.h, hsl.s, shade.l);
    palette[shade.name] = rgbToHex(rgb.r, rgb.g, rgb.b);
  });

  return palette;
}

/**
 * Generate complementary color (opposite on color wheel)
 */
export function getComplementaryColor(baseColor: string): string {
  const rgb = hexToRgb(baseColor);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  // Add 180 degrees to hue for complementary
  const complementaryHue = (hsl.h + 180) % 360;
  const complementaryRgb = hslToRgb(complementaryHue, hsl.s, hsl.l);

  return rgbToHex(complementaryRgb.r, complementaryRgb.g, complementaryRgb.b);
}

/**
 * Generate analogous colors (adjacent on color wheel)
 */
export function getAnalogousColors(baseColor: string): string[] {
  const rgb = hexToRgb(baseColor);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  const colors = [];

  // 30 degrees apart for analogous colors
  for (const offset of [-30, 30]) {
    const hue = (hsl.h + offset + 360) % 360;
    const analogousRgb = hslToRgb(hue, hsl.s, hsl.l);
    colors.push(rgbToHex(analogousRgb.r, analogousRgb.g, analogousRgb.b));
  }

  return colors;
}

/**
 * Generate triadic colors (evenly spaced on color wheel)
 */
export function getTriadicColors(baseColor: string): string[] {
  const rgb = hexToRgb(baseColor);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  const colors = [];

  // 120 degrees apart for triadic colors
  for (const offset of [120, 240]) {
    const hue = (hsl.h + offset) % 360;
    const triadicRgb = hslToRgb(hue, hsl.s, hsl.l);
    colors.push(rgbToHex(triadicRgb.r, triadicRgb.g, triadicRgb.b));
  }

  return colors;
}

/**
 * Auto-generate complete brand color scheme from single color
 */
export function generateBrandColorScheme(primaryColor: string): {
  primary: string;
  secondary: string;
  accent: string;
  complementary: string;
  analogous: string[];
  triadic: string[];
  palette: ReturnType<typeof generatePalette>;
} {
  const analogous = getAnalogousColors(primaryColor);
  const triadic = getTriadicColors(primaryColor);

  return {
    primary: primaryColor,
    secondary: analogous[1], // Use second analogous color
    accent: triadic[0], // Use first triadic color
    complementary: getComplementaryColor(primaryColor),
    analogous,
    triadic,
    palette: generatePalette(primaryColor),
  };
}

// ============================================
// DARK MODE ADJUSTMENTS
// ============================================

/**
 * Adjust color for dark mode (lighten dark colors, keep light colors)
 */
export function adjustForDarkMode(color: string, amount: number = 20): string {
  const rgb = hexToRgb(color);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  // If color is too dark (lightness < 50%), lighten it for dark mode
  if (hsl.l < 50) {
    const adjustedL = Math.min(hsl.l + amount, 70);
    const adjustedRgb = hslToRgb(hsl.h, hsl.s, adjustedL);
    return rgbToHex(adjustedRgb.r, adjustedRgb.g, adjustedRgb.b);
  }

  return color;
}

/**
 * Generate dark mode variant of a color
 */
export function getDarkModeVariant(color: string): string {
  const rgb = hexToRgb(color);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  // Increase lightness for dark mode readability
  const adjustedL = Math.min(hsl.l + 15, 75);
  // Slightly reduce saturation for softer appearance
  const adjustedS = Math.max(hsl.s - 5, 0);

  const adjustedRgb = hslToRgb(hsl.h, adjustedS, adjustedL);
  return rgbToHex(adjustedRgb.r, adjustedRgb.g, adjustedRgb.b);
}

// ============================================
// COLOR EXTRACTION (Placeholder)
// ============================================

/**
 * Extract dominant colors from image
 * This is a placeholder - real implementation would use canvas API
 */
export async function extractColorsFromImage(
  imageUrl: string,
): Promise<string[]> {
  // TODO: Implement using canvas to analyze image pixels
  // For now, return placeholder
  console.warn("Color extraction from image not yet implemented");
  return ["#4F46E5", "#7C3AED", "#EC4899"];
}

/**
 * Suggest brand colors based on logo
 */
export async function suggestColorsFromLogo(
  logoUrl: string,
): Promise<{
  primary: string;
  secondary: string;
  accent: string;
}> {
  const colors = await extractColorsFromImage(logoUrl);

  return {
    primary: colors[0] || "#4F46E5",
    secondary: colors[1] || "#7C3AED",
    accent: colors[2] || "#EC4899",
  };
}
