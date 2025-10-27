# Banking Module UI Integration Guide

## Overview

The banking module UI has been created with the following components:

### ✅ Completed Components

1. **Banking Dashboard Page** (`src/app/dashboard/banking/page.tsx`)
   - Module enablement check
   - Informative message when disabled
   - Main dashboard when enabled

2. **BankAccountsDashboard** (`src/components/banking/BankAccountsDashboard.tsx`)
   - Account overview with balances
   - Quick stats (total balance, today's inflow/outflow, unreconciled count)
   - Pending transfers display
   - Recent transactions list
   - Transfer button with modal form

3. **BankTransactionList** (`src/components/banking/BankTransactionList.tsx`)
   - Transaction list with icons
   - Reconciliation status indicators
   - Inflow/outflow highlighting

4. **InterAccountTransferForm** (`src/components/banking/InterAccountTransferForm.tsx`)
   - Modal form for creating transfers
   - Account selection with balance validation
   - Approval workflow option
   - Real-time validation

5. **BankReconciliationUI** (Placeholder)
6. **BankStatementImport** (Placeholder)

---

## Integration Steps

### 1. Add Banking Link to Navigation

Find your main navigation component (likely in `src/app/dashboard/layout.tsx` or similar) and add:

```typescript
"use client";

import { useBankingModule } from "@/hooks/useBankingModule";
import { BanknoteIcon } from "lucide-react";
import Link from "next/link";

export function Navigation() {
  const { isBankingEnabled } = useBankingModule();

  return (
    <nav>
      {/* ... existing links ... */}
      
      {/* Banking link - only show if module is enabled */}
      {isBankingEnabled && (
        <Link
          href="/dashboard/banking"
          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          <BanknoteIcon className="h-5 w-5" />
          <span>Banking</span>
        </Link>
      )}
      
      {/* ... other links ... */}
    </nav>
  );
}
```

### 2. Add Module Toggle to Settings Page

In `src/app/dashboard/settings/page.tsx`, add a section to enable/disable the banking module:

```typescript
"use client";

import { useState } from "react";
import { schoolConfigService } from "@/services";
import { useSchool } from "@/contexts/SchoolContext";

export default function SettingsPage() {
  const { schoolConfig, refreshSchoolConfig } = useSchool();
  const [loading, setLoading] = useState(false);

  async function toggleBankingModule(enabled: boolean) {
    if (!schoolConfig) return;
    
    setLoading(true);
    try {
      const currentModules = schoolConfig.enabledModules || [];
      const newModules = enabled
        ? [...currentModules, "banking"]
        : currentModules.filter((m) => m !== "banking");

      await schoolConfigService.update(schoolConfig.id, {
        enabledModules: newModules,
      });

      await refreshSchoolConfig();
      
      // Show success message
      alert(enabled ? "Banking module enabled!" : "Banking module disabled!");
    } catch (error) {
      console.error("Error updating banking module:", error);
      alert("Failed to update banking module");
    } finally {
      setLoading(false);
    }
  }

  const isBankingEnabled = schoolConfig?.enabledModules?.includes("banking") ?? false;

  return (
    <div>
      {/* ... existing settings ... */}
      
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Module Configuration
        </h2>
        
        <div className="space-y-4">
          {/* Banking Module Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Banking Module</h3>
              <p className="text-sm text-gray-600">
                Enable advanced banking features including transaction tracking,
                reconciliation, and cash flow management
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isBankingEnabled}
                onChange={(e) => toggleBankingModule(e.target.checked)}
                disabled={loading}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 3. Alternative: Simple Checkbox Version

If you prefer a simpler checkbox-style toggle:

```typescript
<div className="flex items-start gap-3">
  <input
    type="checkbox"
    id="banking-module"
    checked={isBankingEnabled}
    onChange={(e) => toggleBankingModule(e.target.checked)}
    disabled={loading}
    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
  />
  <div>
    <label
      htmlFor="banking-module"
      className="font-medium text-gray-900 cursor-pointer"
    >
      Enable Banking Module
    </label>
    <p className="text-sm text-gray-600">
      Adds transaction tracking, reconciliation, transfers, and cash flow features
    </p>
  </div>
</div>
```

---

## Testing the Integration

### 1. Enable the Module

1. Go to `/dashboard/settings`
2. Find the "Banking Module" toggle
3. Enable it
4. Refresh the page

### 2. Verify Navigation

1. Check that "Banking" link appears in your navigation menu
2. Click it to navigate to `/dashboard/banking`

### 3. Test Banking Features

1. View bank accounts (from accounting module)
2. Create an inter-account transfer
3. View recent transactions
4. Check pending transfers

### 4. Disable the Module

1. Go back to settings
2. Disable the banking module
3. Verify:
   - Banking link disappears from navigation
   - `/dashboard/banking` shows "module not enabled" message

---

## Navigation Integration Examples

### Sidebar Navigation

```typescript
const navItems = [
  { href: "/dashboard", icon: HomeIcon, label: "Dashboard" },
  { href: "/dashboard/students", icon: UsersIcon, label: "Students" },
  { href: "/dashboard/fees", icon: DollarSignIcon, label: "Fees" },
  { href: "/dashboard/payments", icon: CreditCardIcon, label: "Payments" },
  { href: "/dashboard/expenses", icon: TrendingDownIcon, label: "Expenses" },
  { href: "/dashboard/staff", icon: BriefcaseIcon, label: "Staff" },
  { href: "/dashboard/assets", icon: PackageIcon, label: "Assets" },
  { href: "/dashboard/accounting", icon: CalculatorIcon, label: "Accounting" },
];

// Conditionally add banking
if (isBankingEnabled) {
  navItems.push({
    href: "/dashboard/banking",
    icon: BanknoteIcon,
    label: "Banking",
  });
}

navItems.push({ href: "/dashboard/settings", icon: SettingsIcon, label: "Settings" });
```

### Dropdown Menu

```typescript
<DropdownMenu>
  <DropdownMenuTrigger>Modules</DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem href="/dashboard">Dashboard</DropdownMenuItem>
    <DropdownMenuItem href="/dashboard/students">Students</DropdownMenuItem>
    {/* ... other items ... */}
    
    {isBankingEnabled && (
      <DropdownMenuItem href="/dashboard/banking">
        <BanknoteIcon className="mr-2 h-4 w-4" />
        Banking
      </DropdownMenuItem>
    )}
  </DropdownMenuContent>
</DropdownMenu>
```

---

## Module Features Summary

When enabled, users can:

✅ **View bank accounts** - See all accounts with current balances  
✅ **Track transactions** - View detailed transaction history  
✅ **Create transfers** - Move funds between school accounts  
✅ **Monitor cash flow** - See today's inflows and outflows  
✅ **Reconciliation tracking** - Identify unreconciled transactions  
✅ **Approval workflows** - Optional approval for large transfers  

---

## Future Enhancements

The placeholder components (BankReconciliationUI and BankStatementImport) can be fully implemented later with:

### BankReconciliationUI Features:
- Two-pane view (book vs bank)
- Drag-and-drop transaction matching
- Adjustment entry form
- Reconciliation summary with difference calculation
- Complete/save reconciliation

### BankStatementImport Features:
- CSV/Excel file upload
- Automatic column detection
- Manual column mapping interface
- Data preview before import
- Batch import with error handling
- Import history and rollback

---

## Permissions

Banking operations respect the permission system:

- `BANKING_VIEW` - View banking dashboard and transactions
- `BANKING_CREATE_TRANSACTIONS` - Record new transactions
- `BANKING_RECONCILE` - Perform reconciliations
- `BANKING_TRANSFER` - Create transfers
- `BANKING_APPROVE_TRANSFER` - Approve pending transfers
- `BANKING_IMPORT_STATEMENTS` - Import bank statements

Assign these permissions to appropriate roles in your user management system.

---

## Support

For issues or questions:
- Review the service implementation in `src/services/bankingService.ts`
- Check type definitions in `src/types/index.ts`
- Refer to `docs/BANKING_MODULE_IMPLEMENTATION.md` for backend details
- Check the hook implementation in `src/hooks/useBankingModule.ts`

---

**Last Updated:** 2025-10-27  
**Status:** UI Implementation Complete  
**Pending:** Navigation and Settings Integration (manual step)
