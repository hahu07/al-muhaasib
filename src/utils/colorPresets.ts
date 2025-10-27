/**
 * COLOR THEME PRESETS
 *
 * Professional, pre-defined color schemes for schools to choose from.
 * Each theme is carefully crafted for readability and brand appeal.
 */

export interface ColorTheme {
  id: string;
  name: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  preview?: {
    lightBg: string;
    darkBg: string;
  };
}

export const COLOR_PRESETS: ColorTheme[] = [
  {
    id: "professional-blue",
    name: "Professional Blue",
    description: "Classic and trustworthy - perfect for established institutions",
    primaryColor: "#4F46E5", // Indigo
    secondaryColor: "#7C3AED", // Purple
    accentColor: "#EC4899", // Pink
  },
  {
    id: "academic-green",
    name: "Academic Green",
    description: "Fresh and growth-oriented - ideal for progressive schools",
    primaryColor: "#059669", // Emerald
    secondaryColor: "#0891B2", // Cyan
    accentColor: "#F59E0B", // Amber
  },
  {
    id: "vibrant-orange",
    name: "Vibrant Orange",
    description: "Energetic and creative - great for arts-focused institutions",
    primaryColor: "#EA580C", // Orange
    secondaryColor: "#DC2626", // Red
    accentColor: "#7C3AED", // Purple
  },
  {
    id: "royal-purple",
    name: "Royal Purple",
    description: "Elegant and distinguished - suits prestigious academies",
    primaryColor: "#7C3AED", // Purple
    secondaryColor: "#DB2777", // Pink
    accentColor: "#2563EB", // Blue
  },
  {
    id: "tech-teal",
    name: "Tech Teal",
    description: "Modern and innovative - perfect for STEM-focused schools",
    primaryColor: "#0891B2", // Cyan
    secondaryColor: "#06B6D4", // Sky
    accentColor: "#8B5CF6", // Violet
  },
  {
    id: "warm-burgundy",
    name: "Warm Burgundy",
    description: "Traditional and scholarly - classic university colors",
    primaryColor: "#9F1239", // Rose
    secondaryColor: "#B91C1C", // Red
    accentColor: "#C2410C", // Orange
  },
  {
    id: "nature-earth",
    name: "Nature Earth",
    description: "Grounded and eco-conscious - environmentally aware institutions",
    primaryColor: "#65A30D", // Lime
    secondaryColor: "#16A34A", // Green
    accentColor: "#CA8A04", // Yellow
  },
  {
    id: "navy-gold",
    name: "Navy & Gold",
    description: "Prestigious and timeless - traditional excellence",
    primaryColor: "#1E3A8A", // Blue
    secondaryColor: "#1E40AF", // Blue
    accentColor: "#D97706", // Amber
  },
  {
    id: "coral-reef",
    name: "Coral Reef",
    description: "Warm and welcoming - friendly community atmosphere",
    primaryColor: "#F472B6", // Pink
    secondaryColor: "#FB923C", // Orange
    accentColor: "#22D3EE", // Cyan
  },
  {
    id: "midnight-blue",
    name: "Midnight Blue",
    description: "Deep and sophisticated - research institutions",
    primaryColor: "#1E40AF", // Blue
    secondaryColor: "#4338CA", // Indigo
    accentColor: "#0EA5E9", // Sky
  },
  {
    id: "forest-sage",
    name: "Forest Sage",
    description: "Calm and nurturing - holistic education approach",
    primaryColor: "#047857", // Emerald
    secondaryColor: "#065F46", // Green
    accentColor: "#84CC16", // Lime
  },
  {
    id: "sunrise-amber",
    name: "Sunrise Amber",
    description: "Optimistic and inspiring - forward-thinking schools",
    primaryColor: "#F59E0B", // Amber
    secondaryColor: "#EAB308", // Yellow
    accentColor: "#F97316", // Orange
  },
  {
    id: "monochrome-modern",
    name: "Monochrome Modern",
    description: "Sleek and minimalist - contemporary design",
    primaryColor: "#374151", // Gray
    secondaryColor: "#6B7280", // Gray
    accentColor: "#3B82F6", // Blue accent
  },
  {
    id: "crimson-excellence",
    name: "Crimson Excellence",
    description: "Bold and prestigious - Ivy League inspired",
    primaryColor: "#B91C1C", // Red
    secondaryColor: "#991B1B", // Dark red
    accentColor: "#D97706", // Gold
  },
  {
    id: "ocean-breeze",
    name: "Ocean Breeze",
    description: "Cool and refreshing - coastal or maritime schools",
    primaryColor: "#0EA5E9", // Sky
    secondaryColor: "#06B6D4", // Cyan
    accentColor: "#14B8A6", // Teal
  },
];

/**
 * Get theme by ID
 */
export function getThemeById(id: string): ColorTheme | undefined {
  return COLOR_PRESETS.find((theme) => theme.id === id);
}

/**
 * Get random theme (for suggestions)
 */
export function getRandomTheme(): ColorTheme {
  return COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)];
}

/**
 * Get themes by category/mood
 */
export function getThemesByMood(mood: string): ColorTheme[] {
  const keywords: Record<string, string[]> = {
    traditional: ["professional", "royal", "navy", "burgundy", "crimson"],
    modern: ["tech", "monochrome", "vibrant"],
    nature: ["academic", "nature", "forest", "ocean"],
    creative: ["vibrant", "coral", "sunrise"],
    prestigious: ["royal", "navy", "crimson", "burgundy"],
  };

  const searchTerms = keywords[mood.toLowerCase()] || [];
  return COLOR_PRESETS.filter((theme) =>
    searchTerms.some((term) => theme.id.includes(term)),
  );
}

/**
 * Find similar themes based on color
 */
export function findSimilarThemes(hexColor: string, limit: number = 3): ColorTheme[] {
  // Simple hue-based similarity (could be enhanced with color distance)
  const targetHue = hexToHue(hexColor);
  
  return COLOR_PRESETS
    .map((theme) => ({
      theme,
      distance: Math.abs(hexToHue(theme.primaryColor) - targetHue),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)
    .map((item) => item.theme);
}

/**
 * Simple hex to hue conversion
 */
function hexToHue(hex: string): number {
  hex = hex.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;

  if (max !== min) {
    const d = max - min;
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

  return h * 360;
}
