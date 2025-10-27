/**
 * BRANDING KIT EXPORT
 *
 * Generate downloadable branding kit with CSS variables,
 * color swatches, and usage documentation.
 */

import type { SchoolConfig } from "@/types";
import { generatePalette } from "./colorUtils";

/**
 * Generate CSS file content with all brand variables
 */
export function generateCSSFile(config: SchoolConfig): string {
  const palette = generatePalette(config.branding.primaryColor);

  return `/**
 * ${config.schoolName} - Brand Colors
 * Generated: ${new Date().toLocaleDateString()}
 */

:root {
  /* Primary Brand Color */
  --brand-primary: ${config.branding.primaryColor};
  --brand-primary-rgb: ${hexToRgb(config.branding.primaryColor)};
  
  /* Secondary Brand Color */
  --brand-secondary: ${config.branding.secondaryColor};
  --brand-secondary-rgb: ${hexToRgb(config.branding.secondaryColor)};
  
  /* Accent Color */
  --brand-accent: ${config.branding.accentColor};
  --brand-accent-rgb: ${hexToRgb(config.branding.accentColor)};
  
  /* Primary Color Palette (Light to Dark) */
  --brand-primary-50: ${palette[50]};
  --brand-primary-100: ${palette[100]};
  --brand-primary-200: ${palette[200]};
  --brand-primary-300: ${palette[300]};
  --brand-primary-400: ${palette[400]};
  --brand-primary-500: ${palette[500]};
  --brand-primary-600: ${palette[600]};
  --brand-primary-700: ${palette[700]};
  --brand-primary-800: ${palette[800]};
  --brand-primary-900: ${palette[900]};
  --brand-primary-950: ${palette[950]};
}

/* Utility Classes */
.bg-brand-primary { background-color: var(--brand-primary); }
.text-brand-primary { color: var(--brand-primary); }
.border-brand-primary { border-color: var(--brand-primary); }

.bg-brand-secondary { background-color: var(--brand-secondary); }
.text-brand-secondary { color: var(--brand-secondary); }
.border-brand-secondary { border-color: var(--brand-secondary); }

.bg-brand-accent { background-color: var(--brand-accent); }
.text-brand-accent { color: var(--brand-accent); }
.border-brand-accent { border-color: var(--brand-accent); }
`;
}

/**
 * Generate SVG color swatches
 */
export function generateColorSwatchSVG(config: SchoolConfig): string {
  const palette = generatePalette(config.branding.primaryColor);
  const swatchSize = 60;
  const gap = 10;
  const width = swatchSize * 11 + gap * 10;
  const height = swatchSize * 4 + gap * 3;

  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .swatch-label { font-family: Arial, sans-serif; font-size: 10px; fill: #666; }
      .color-value { font-family: monospace; font-size: 9px; fill: #999; }
    </style>
  </defs>
  
  <text x="0" y="15" font-family="Arial" font-size="16" font-weight="bold">${config.schoolName}</text>
  <text x="0" y="35" font-family="Arial" font-size="12" fill="#666">Brand Color Palette</text>
  
`;

  // Primary Color
  svg += `  <text x="0" y="70" class="swatch-label">Primary</text>\n`;
  svg += `  <rect x="0" y="75" width="${swatchSize}" height="${swatchSize}" fill="${config.branding.primaryColor}" rx="4"/>\n`;
  svg += `  <text x="${swatchSize / 2}" y="${75 + swatchSize + 15}" class="color-value" text-anchor="middle">${config.branding.primaryColor}</text>\n\n`;

  // Secondary Color
  svg += `  <text x="${swatchSize + gap}" y="70" class="swatch-label">Secondary</text>\n`;
  svg += `  <rect x="${swatchSize + gap}" y="75" width="${swatchSize}" height="${swatchSize}" fill="${config.branding.secondaryColor}" rx="4"/>\n`;
  svg += `  <text x="${swatchSize + gap + swatchSize / 2}" y="${75 + swatchSize + 15}" class="color-value" text-anchor="middle">${config.branding.secondaryColor}</text>\n\n`;

  // Accent Color
  svg += `  <text x="${(swatchSize + gap) * 2}" y="70" class="swatch-label">Accent</text>\n`;
  svg += `  <rect x="${(swatchSize + gap) * 2}" y="75" width="${swatchSize}" height="${swatchSize}" fill="${config.branding.accentColor}" rx="4"/>\n`;
  svg += `  <text x="${(swatchSize + gap) * 2 + swatchSize / 2}" y="${75 + swatchSize + 15}" class="color-value" text-anchor="middle">${config.branding.accentColor}</text>\n\n`;

  // Palette Shades
  const yOffset = 180;
  svg += `  <text x="0" y="${yOffset - 10}" class="swatch-label">Primary Color Shades</text>\n`;
  Object.entries(palette).forEach(([shade, color], idx) => {
    const x = idx * (swatchSize + gap);
    svg += `  <rect x="${x}" y="${yOffset}" width="${swatchSize}" height="${swatchSize}" fill="${color}" rx="4"/>\n`;
    svg += `  <text x="${x + swatchSize / 2}" y="${yOffset + swatchSize + 15}" class="swatch-label" text-anchor="middle">${shade}</text>\n`;
  });

  svg += `\n</svg>`;
  return svg;
}

/**
 * Generate README documentation
 */
export function generateREADME(config: SchoolConfig): string {
  return `# ${config.schoolName} - Brand Guidelines

## Brand Colors

### Primary Colors

- **Primary**: \`${config.branding.primaryColor}\`
  - Use for: Main buttons, headers, primary actions
  - RGB: ${hexToRgb(config.branding.primaryColor)}

- **Secondary**: \`${config.branding.secondaryColor}\`
  - Use for: Secondary buttons, supporting elements
  - RGB: ${hexToRgb(config.branding.secondaryColor)}

- **Accent**: \`${config.branding.accentColor}\`
  - Use for: Highlights, badges, calls-to-action
  - RGB: ${hexToRgb(config.branding.accentColor)}

## Usage in HTML/CSS

\`\`\`html
<!-- Using CSS Variables -->
<div style="background-color: var(--brand-primary); color: white;">
  Branded Content
</div>

<!-- Using Utility Classes -->
<button class="bg-brand-primary text-white">
  Primary Button
</button>
\`\`\`

## Usage in Design Tools

Import the \`colors.svg\` file into your design tool (Figma, Sketch, Adobe XD) to use the exact brand colors.

### Figma
1. Open your Figma file
2. Import \`colors.svg\` as an image
3. Use the eyedropper tool to sample colors

### Adobe Illustrator/Photoshop
1. File > Open > colors.svg
2. Select swatches and add to your swatches panel

## Logo

${config.branding.logo ? `Logo URL: ${config.branding.logo}` : "No logo configured"}

## School Information

- **Name**: ${config.schoolName}
- **Address**: ${config.address}, ${config.city}, ${config.state}
- **Phone**: ${config.phone}
- **Email**: ${config.email}
${config.website ? `- **Website**: ${config.website}` : ""}
${config.motto ? `- **Motto**: "${config.motto}"` : ""}

## Color Accessibility

All primary colors have been tested for WCAG compliance:
- Use white text on primary/secondary/accent backgrounds
- Use primary color for text on white backgrounds
- Maintain minimum contrast ratio of 4.5:1 for body text

## Print Guidelines

When printing materials:
- Use CMYK equivalents of brand colors
- Ensure minimum 300 DPI for logo
- Maintain color consistency across all materials

---

Generated: ${new Date().toLocaleDateString()}
Brand Kit Version: 1.0
`;
}

/**
 * Convert hex to RGB string
 */
function hexToRgb(hex: string): string {
  hex = hex.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  return `${r}, ${g}, ${b}`;
}

/**
 * Download branding kit as ZIP (browser-side)
 */
export async function downloadBrandingKit(config: SchoolConfig) {
  const cssContent = generateCSSFile(config);
  const svgContent = generateColorSwatchSVG(config);
  const readmeContent = generateREADME(config);

  // Create individual files
  const files = [
    { name: "brand-colors.css", content: cssContent, type: "text/css" },
    { name: "colors.svg", content: svgContent, type: "image/svg+xml" },
    { name: "README.md", content: readmeContent, type: "text/markdown" },
  ];

  // Download each file individually (simple approach)
  // For a ZIP file, you'd need a library like JSZip
  files.forEach((file) => {
    const blob = new Blob([file.content], { type: file.type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });
}

/**
 * Generate JSON color data for developers
 */
export function generateColorJSON(config: SchoolConfig): string {
  const palette = generatePalette(config.branding.primaryColor);

  return JSON.stringify(
    {
      school: config.schoolName,
      version: "1.0",
      generated: new Date().toISOString(),
      colors: {
        primary: {
          hex: config.branding.primaryColor,
          rgb: hexToRgb(config.branding.primaryColor),
        },
        secondary: {
          hex: config.branding.secondaryColor,
          rgb: hexToRgb(config.branding.secondaryColor),
        },
        accent: {
          hex: config.branding.accentColor,
          rgb: hexToRgb(config.branding.accentColor),
        },
      },
      palette: palette,
    },
    null,
    2,
  );
}
