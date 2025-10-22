# Real-Time Asset Data Implementation

## Overview

This document describes the real-time data implementation for the Asset Management module in Al-Muhaasib. The implementation provides automatic data refresh, live statistics, and real-time monitoring of asset conditions.

## Architecture

### 1. Custom Hook: `useRealtimeAssets`

**Location:** `/src/hooks/useRealtimeAssets.ts`

This hook manages the real-time asset data fetching and statistics calculation:

```typescript
const { assets, statistics, loading, error, refresh } = useRealtimeAssets();
```

#### Features:

- **Auto-refresh**: Automatically fetches fresh data every 2 minutes
- **Statistics Calculation**: Computes comprehensive asset statistics in real-time
- **Error Handling**: Graceful error states with retry functionality
- **Loading States**: Proper loading indicators during data fetch

#### Statistics Provided:

- Total assets count
- Active/Inactive asset counts
- Assets under maintenance
- Disposed assets count
- Total asset value
- Total depreciation
- Assets grouped by category
- Assets grouped by status
- Assets grouped by condition
- Recent asset registrations (last 10)
- Assets with warranty expiring soon (within 30 days)
- Assets needing maintenance (poor condition or needs repair)

### 2. Asset Mapping Utilities

**Location:** `/src/utils/assetMapping.ts`

Handles conversion between service layer (`FixedAsset`) and UI layer (`SimpleAsset`) formats:

```typescript
// Convert service asset to UI format
const uiAsset = convertServiceAssetToUI(serviceAsset);

// Convert UI asset to service creation format
const serviceData = convertUIAssetToServiceCreation(uiAsset);
```

#### Mappings Include:

- Category mapping (service ↔ UI)
- Status mapping (service ↔ UI)
- Full asset data structure conversion

### 3. Updated Components

#### AssetManagement Component

**Location:** `/src/components/assets/AssetManagement.tsx`

- Integrated `useRealtimeAssets` hook
- Passes real-time data to child components
- Triggers refresh after asset registration/updates
- Provides preloaded assets to AssetList component

#### OverviewTab Component

**Enhanced with:**

- Real-time statistics display
- Loading indicators during refresh
- Error states with retry functionality
- Alert sections for:
  - Warranties expiring soon
  - Assets needing maintenance
- Recent asset registrations with actual data
- Assets by category with real values and percentages
- Interactive asset cards (click to view details)

#### AssetList Component

**Enhanced with:**

- Support for preloaded assets from real-time hook
- Eliminates duplicate data fetching
- Faster load times when navigating between tabs

## Real-Time Features

### 1. Automatic Refresh

- Assets data refreshes every 2 minutes automatically
- No user interaction required
- Background updates don't interrupt user workflow

### 2. Statistics Dashboard

Real-time display of:

- Total number of assets
- Active assets count
- Assets under maintenance
- Total asset value with depreciation info
- Category breakdown with values
- Condition-based grouping

### 3. Proactive Alerts

The system now displays real-time alerts for:

#### Warranty Expiration Alerts

- Shows assets with warranties expiring within 30 days
- Clickable cards to view asset details
- Visual warning indicators

#### Maintenance Alerts

- Identifies assets in poor condition
- Highlights assets needing repair
- Quick access to asset details

### 4. Recent Activity

- Displays last 10 registered assets
- Shows purchase date and price
- Clickable for detailed view
- Real-time updates as new assets are added

### 5. Visual Indicators

- Loading spinners during data refresh
- Refresh indicators in card headers
- Empty state messages when no data
- Error states with retry buttons

## Performance Optimizations

1. **Efficient Data Fetching**
   - Single data fetch for all components
   - Shared state via custom hook
   - Cached calculations

2. **Preloaded Data**
   - AssetList uses preloaded data from hook
   - Eliminates redundant API calls
   - Faster tab switching

3. **Optimized Calculations**
   - Statistics calculated once per fetch
   - Memoized calculations in hook
   - Sorted and filtered data ready for display

## User Experience Enhancements

1. **No Manual Refresh Required**
   - Data updates automatically
   - Users see latest information without clicking refresh

2. **Proactive Notifications**
   - Alerts for expiring warranties
   - Maintenance reminders
   - Actionable insights

3. **Smooth Loading States**
   - Skeleton loaders during initial load
   - Non-intrusive refresh indicators
   - Error recovery options

4. **Interactive Data**
   - Click on alerts to view asset details
   - Click on recent assets for full information
   - Seamless navigation

## Data Flow

```
1. useRealtimeAssets Hook
   ↓
2. Fetch from fixedAssetService
   ↓
3. Convert serviceAssets → uiAssets (via mapping utilities)
   ↓
4. Calculate Statistics
   ↓
5. Update Component State
   ↓
6. Render in UI Components
   ↓
7. Auto-refresh after 2 minutes (loop back to step 2)
```

## Configuration

### Refresh Interval

Defined in `/src/hooks/useRealtimeAssets.ts`:

```typescript
const REFRESH_INTERVAL = 120000; // 2 minutes
```

To change the refresh interval, modify this constant (value in milliseconds).

### Alert Thresholds

#### Warranty Expiration

Currently set to 30 days:

```typescript
const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
```

#### Maintenance Alerts

Based on asset condition:

- `poor` condition
- `needs_repair` status

## Future Enhancements

Potential additions:

1. **WebSocket Integration**: Real-time updates without polling
2. **Custom Alert Rules**: User-defined thresholds
3. **Historical Trends**: Charts showing asset value over time
4. **Predictive Maintenance**: AI-based maintenance predictions
5. **Export Statistics**: Download real-time reports
6. **Asset Notifications**: Push notifications for critical alerts
7. **Asset Tracking**: GPS/location tracking for mobile assets
8. **QR Code Integration**: Quick asset lookup via QR scanning

## Testing

To test the real-time functionality:

1. **Initial Load**
   - Navigate to Assets page
   - Verify statistics load correctly
   - Check for alerts if applicable

2. **Auto Refresh**
   - Wait 2 minutes
   - Observe refresh indicator
   - Verify data updates

3. **Manual Refresh**
   - Register a new asset
   - Observe immediate data refresh
   - Verify statistics update

4. **Error Handling**
   - Disconnect from network
   - Verify error state displays
   - Click retry button
   - Verify recovery

## Troubleshooting

### Data Not Refreshing

- Check browser console for errors
- Verify Juno satellite connection
- Check network connectivity

### Statistics Incorrect

- Ensure asset service is returning correct data
- Check mapping utilities for conversion errors
- Verify calculations in useRealtimeAssets hook

### Performance Issues

- Reduce refresh interval if too frequent
- Check for memory leaks in components
- Monitor network requests in browser dev tools

## Dependencies

- `@junobuild/core`: Juno blockchain integration
- `react`: Component framework
- `lucide-react`: Icons
- Custom services and utilities in the project

## Conclusion

The real-time asset data implementation provides a modern, responsive, and user-friendly interface for managing school assets. The automatic refresh, proactive alerts, and real-time statistics help administrators make informed decisions and maintain assets effectively.
