# Revenue Account Mapping Configuration

## Overview

The system now dynamically maps fee types to revenue accounts in the Chart of Accounts. This allows you to:
- Add new revenue accounts
- Edit the mapping between fee types and accounts
- Automatically post payments to the correct revenue accounts

## How It Works

When a payment is received:
1. The system looks at the `feeAllocations` (tuition, uniform, feeding, etc.)
2. For each allocation, it maps the fee type to a revenue account code
3. It creates journal entries that properly allocate the revenue

## Default Mapping

The current mapping in `autoPostingService.ts`:

```typescript
tuition → 4100 (Tuition Fees)
uniform → 4200 (Other Fees)
feeding → 4300 (Other Income)
transport → 4300 (Other Income)
books → 4200 (Other Fees)
sports → 4200 (Other Fees)
development → 4200 (Other Fees)
examination → 4200 (Other Fees)
pta → 4200 (Other Fees)
computer → 4200 (Other Fees)
library → 4200 (Other Fees)
laboratory → 4200 (Other Fees)
lesson → 4200 (Other Fees)
other → 4300 (Other Income)
```

## Customizing the Mapping

### Option 1: Create Specific Revenue Accounts

1. Go to **Accounting Dashboard** → **Chart of Accounts**
2. Add new revenue accounts, for example:
   - 4110 - Uniform Fees
   - 4120 - Feeding Fees
   - 4130 - Transport Fees

3. Update the mapping in `src/services/autoPostingService.ts`:
   ```typescript
   const feeTypeMapping: Record<string, string> = {
     tuition: "4100",
     uniform: "4110", // Changed to specific uniform account
     feeding: "4120", // Changed to specific feeding account
     transport: "4130", // Changed to specific transport account
     // ... rest of mappings
   };
   ```

### Option 2: Use Broad Categories

Keep the current setup where similar fees are grouped:
- All tuition → 4100
- All other mandatory fees → 4200
- All optional/miscellaneous → 4300

## Future Enhancements

To make this fully dynamic (configurable through UI):

1. Create a `FeeTypeAccountMapping` collection in Juno
2. Store mappings as documents: `{ feeType: "uniform", accountCode: "4110" }`
3. Update `getRevenueAccountForFeeType()` to query this collection
4. Add a UI in the Setup section to manage mappings

## Impact on Income Statement

With proper mapping:
- **Tuition Fees** will show tuition payments only
- **Other Fees** will show uniform, books, sports, etc.
- **Other Income** will show feeding, transport, etc.

This makes the Income Statement accurately reflect revenue sources.

## Existing Payments

**Important**: This change affects NEW payments only. Existing payments were posted to 4200 (Other Fees) regardless of fee type.

To fix historical data:
1. You can manually create reversing journal entries
2. Or update the entries directly in the Journal Entries module
3. Or leave them as-is and the new system will work going forward
