# Branding Features

## Overview

The branding settings have been enhanced with three major features:
1. **Logo Upload** - Direct file upload instead of URL
2. **Real-time Preview** - Live preview of branding changes
3. **A/B Testing** - Test and compare different color schemes

## Features

### 1. Logo Upload

**Location**: `src/components/settings/LogoUpload.tsx`

**Features**:
- Drag & drop file upload
- File type validation (PNG, JPG, SVG)
- 2MB size limit
- Image preview
- Juno storage integration
- Delete uploaded logos

**Usage**:
```tsx
<LogoUpload
  currentLogo={logo}
  currentStorageKey={logoStorageKey}
  onLogoChange={handleLogoChange}
  disabled={saving}
/>
```

**Storage**:
- Files are stored in Juno storage under the `logos` collection
- The storage key is saved to `SchoolBranding.logoStorageKey`
- The download URL is saved to `SchoolBranding.logo`

### 2. Real-time Preview

**Features**:
- Live navbar preview with logo and colors
- Button previews in all three brand colors
- Card preview with branded borders
- Updates immediately when colors change

**Implementation**:
- Uses `useEffect` to watch color changes
- Updates CSS variables for dynamic styling
- Shows logo in navbar preview

### 3. A/B Testing

**Location**: `src/components/settings/ColorVariantTesting.tsx`

**Features**:
- Save current colors as named variants
- Compare multiple color schemes side-by-side
- Apply variants with one click
- Duplicate existing variants
- Import/export variants as JSON
- Persistent storage in localStorage

**Usage**:
1. Configure your desired colors
2. Click "Save Current" and name your variant
3. Try different colors
4. Save as another variant
5. Compare all variants visually
6. Click "Apply" on the best performing variant

**Storage**:
- Variants saved to localStorage under `branding_color_variants`
- Export/import for backup or sharing

## Type Updates

### SchoolBranding Interface

```typescript
export interface SchoolBranding {
  logo?: string; // URL or data URL for uploaded logo
  logoStorageKey?: string; // Juno storage key for uploaded file
  favicon?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily?: string;
}
```

## Juno Storage Setup

Ensure the `logos` collection is configured in your Juno satellite:

```rust
// In src/satellite/src/lib.rs or datastore configuration
#[collection("logos")]
pub struct LogosCollection;
```

## Testing

1. **Logo Upload**:
   - Upload a PNG/JPG/SVG file (< 2MB)
   - Verify preview appears
   - Save and refresh page
   - Confirm logo persists

2. **Real-time Preview**:
   - Change primary color
   - Verify navbar updates immediately
   - Change secondary/accent colors
   - Verify all previews update

3. **A/B Testing**:
   - Save 2-3 color variants
   - Export variants as JSON
   - Clear localStorage
   - Import variants back
   - Apply a variant and save

## Future Enhancements

- [ ] Logo crop/resize functionality
- [ ] Multiple logo variants (light/dark mode)
- [ ] Analytics integration for A/B testing
- [ ] Automated contrast checking with warnings
- [ ] Theme builder with preset color palettes
- [ ] Export branding as CSS/SCSS files
