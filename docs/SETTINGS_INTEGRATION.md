# Settings Integration Guide

## Overview

The school settings now properly integrate throughout the application. When you update basic information like school name, address, phone, and email in the settings page, these changes will automatically reflect wherever this information appears in the software.

## What Was Updated

### 1. **Payment Receipts** ✅
**File:** `src/components/payments/PaymentReceipt.tsx`

**Changes:**
- Now uses `useSchool()` hook to get school information
- Displays school name, address, phone, and email from settings
- Uses school's currency symbol and locale for formatting
- Automatically updates when settings change

**Where it appears:**
- Payment receipts when recording student payments
- Printable receipts

### 2. **Payment Recording Form** ✅
**File:** `src/components/payments/PaymentRecordingForm.tsx`

**Changes:**
- Uses `formatCurrency()` from SchoolContext
- All amounts (total fees, paid, outstanding) now use school's configured currency symbol
- Automatically adapts to currency settings changes

### 3. **Financial Reports** ✅
**Files:** 
- `src/components/reports/BalanceSheetReport.tsx`
- `src/components/reports/IncomeStatementReport.tsx`

**Changes:**
- Use `formatCurrency()` from SchoolContext instead of hardcoded NGN
- Currency formatting now respects school settings

### 4. **Reusable Report Header Component** ✅
**File:** `src/components/reports/ReportHeader.tsx` (NEW)

**Purpose:**
- Displays school logo, name, address, and contact info at the top of reports
- Automatically pulls data from SchoolContext
- Can be used across all report types

**Usage Example:**
```tsx
import { ReportHeader } from "@/components/reports/ReportHeader";

<ReportHeader 
  reportTitle="Balance Sheet"
  reportSubtitle="As of December 31, 2024"
/>
```

## How Settings Reflect in the App

### SchoolContext
The `SchoolContext` (`src/contexts/SchoolContext.tsx`) provides:
- `config` - Full school configuration object
- `formatCurrency(amount)` - Formats numbers with school's currency
- `getCurrentSession()` - Gets current academic session
- `getCurrentTerm()` - Gets current academic term
- `updateConfig(updates)` - Updates school settings

### Using Settings in Components

```tsx
import { useSchool } from '@/contexts/SchoolContext';

function MyComponent() {
  const { config, formatCurrency } = useSchool();
  
  return (
    <div>
      <h1>{config?.schoolName}</h1>
      <p>{config?.address}, {config?.city}</p>
      <p>Phone: {config?.phone}</p>
      <p>Total: {formatCurrency(5000)}</p>
    </div>
  );
}
```

## Settings Available

### Basic Information
- School Name
- School Code (unique identifier)
- Motto
- Address, City, State, Country
- Phone, Email, Website

### Branding
- Logo URL
- Primary, Secondary, Accent Colors
- Font Family

### Regional Settings
- Currency (e.g., NGN, USD)
- Currency Symbol (e.g., ₦, $)
- Timezone
- Locale
- Date Format

### Academic Settings
- Current Session
- Current Term
- Session and Term configurations

### System Configuration
- Enabled Modules
- Payment Settings
- Report Headers/Footers

## Where to Update Settings

Navigate to: `/dashboard/settings`

The settings page has 4 tabs:
1. **Basic Info** - School name, address, contact details
2. **Branding** - Colors, logo
3. **Academic** - Session, term, currency
4. **System** - Enabled modules, payment options

## Components That Need Manual Updates

The following components still use hardcoded currency formatting and should be updated in future:
- `src/components/dashboard/ExpenseAnalytics.tsx`
- `src/components/reports/CashFlowReport.tsx`
- `src/components/staff/PayrollDashboard.tsx`
- `src/components/assets/AssetList.tsx`
- And others (search for local `formatCurrency` implementations)

### How to Update Them

1. Import `useSchool` hook:
```tsx
import { useSchool } from '@/contexts/SchoolContext';
```

2. Use the hook in component:
```tsx
const { formatCurrency, config } = useSchool();
```

3. Remove local `formatCurrency` function

4. Use context's `formatCurrency()` for all amounts

## Testing

To verify settings integration:

1. Go to `/dashboard/settings`
2. Update Basic Info tab:
   - School Name: "Test School"
   - Address: "123 Test Street"
   - Phone: "+234 800 TEST 001"
   - Email: "info@testschool.com"
3. Save changes
4. Navigate to a student profile and record a payment
5. View the receipt - it should show your updated school information
6. Check any financial reports - currency should match your settings

## Next Steps

To fully integrate settings throughout the app:

1. **Update remaining components** to use `formatCurrency` from context
2. **Add ReportHeader** to all report components for consistent branding
3. **Use school logo** in navigation/header if configured
4. **Apply branding colors** dynamically based on settings
5. **Add school info** to email templates (future feature)
