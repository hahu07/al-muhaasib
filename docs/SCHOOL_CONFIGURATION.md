# School Configuration & Multi-Tenancy Guide

## Overview

Al-Muhaasib supports **multi-tenant architecture** where each school can have its own customized instance. This guide explains how school configuration works and how to set up multiple schools.

## Architecture

### One Satellite Per School (Recommended)

Each school gets its own **Juno satellite** (isolated data container):

```typescript
School A → Satellite ID: abc123-xyz
School B → Satellite ID: def456-uvw
School C → Satellite ID: ghi789-rst
```

**Benefits:**

- Complete data isolation
- Independent scaling
- School owns their data
- Custom branding per school
- Different permission models

## School Configuration Types

### 1. Basic Information

- School name, code, motto
- Address, city, state, country
- Contact: phone, email, website

### 2. Branding

- Logo and favicon
- Primary, secondary, and accent colors
- Custom fonts

### 3. Academic Settings

- Current session (e.g., "2024/2025")
- Current term (first, second, third)
- Term dates and session dates
- Academic calendar

### 4. Regional Settings

- Currency (NGN, USD, etc.)
- Currency symbol (₦, $, etc.)
- Timezone (Africa/Lagos, etc.)
- Locale (en-NG, en-US, etc.)
- Date format

### 5. System Configuration

- Enabled modules
- Module permissions
- Feature toggles

### 6. Payment Settings

- Allow partial payments
- Late fee percentage
- Default payment methods

## Usage

### In React Components

```typescript
import { useSchool } from '@/contexts/SchoolContext';

function MyComponent() {
  const {
    config,
    formatCurrency,
    isModuleEnabled,
    getCurrentSession
  } = useSchool();

  // Format currency according to school settings
  const formatted = formatCurrency(50000); // "₦50,000.00"

  // Check if module is enabled
  if (isModuleEnabled('expenses')) {
    // Show expenses module
  }

  // Get current academic period
  const session = getCurrentSession(); // "2024/2025"

  return (
    <div>
      <h1>{config?.schoolName}</h1>
      <p>{formatted}</p>
    </div>
  );
}
```

### In Services

```typescript
import { schoolConfigService } from "@/services";

// Get current configuration
const config = await schoolConfigService.getConfig();

// Update configuration
await schoolConfigService.updateConfig(configId, {
  schoolName: "New School Name",
  phone: "08012345678",
});

// Update branding
await schoolConfigService.updateBranding(configId, {
  primaryColor: "#4F46E5",
  logo: "/new-logo.png",
});

// Toggle module
await schoolConfigService.toggleModule(configId, "expenses", true);

// Check if module is enabled
const isEnabled = await schoolConfigService.isModuleEnabled("staff");
```

## Setting Up a New School

### Method 1: Automatic Setup (First Admin Login)

When the first admin user logs in, a default configuration is automatically created:

```typescript
{
  schoolName: 'My School',
  country: 'Nigeria',
  currency: 'NGN',
  currencySymbol: '₦',
  currentSession: '2024/2025',
  currentTerm: 'first',
  enabledModules: ['students', 'fees', 'payments', 'expenses', 'staff', 'assets', 'reports', 'accounting']
}
```

### Method 2: Manual Setup via UI

1. Log in as admin
2. Navigate to `/settings`
3. Fill in school information across tabs:
   - Basic Info
   - Branding
   - Academic
   - System

4. Click "Save Changes"

### Method 3: Programmatic Setup

```typescript
import { schoolConfigService } from "@/services";

const config = await schoolConfigService.createDefaultConfig(
  "Green Valley School",
  "satellite-abc123",
  "admin-user-id",
);
```

## Multi-School Deployment Options

### Option A: Separate Deployments

Each school gets their own domain/subdomain:

- `greenvalley.al-muhaasib.com`
- `stmary.al-muhaasib.com`

**Pros:** Maximum isolation, independent updates
**Cons:** Higher hosting costs, more maintenance

### Option B: Single App, Multiple Satellites

One deployment serves all schools, routing to correct satellite:

```typescript
// Based on subdomain
const satelliteId = getSatelliteIdFromSubdomain();

// Based on path
const satelliteId = getSatelliteIdFromPath();
```

**Pros:** Cost-effective, centralized updates
**Cons:** Requires tenant routing logic

### Option C: White-Label SaaS

Centralized platform where schools sign up:

```typescript
// Admin portal creates new school
async function createSchool(schoolData) {
  // 1. Provision new Juno satellite
  const satelliteId = await provisionSatellite();

  // 2. Create school configuration
  const config = await schoolConfigService.createConfig({
    ...schoolData,
    satelliteId,
  });

  // 3. Assign subdomain or custom domain
  await assignDomain(config.schoolCode);

  return config;
}
```

**Pros:** Scalable, easy onboarding
**Cons:** Most complex setup

## Juno Satellite Setup

### 1. Create New Satellite

```bash
juno init
```

### 2. Configure Satellite ID

```env
NEXT_PUBLIC_SATELLITE_ID=your-satellite-id
```

### 3. Set Permissions

In Juno console:

- Collection: `school_config`
- Permissions: `managed` (controllers only)
- Read: Public (for school info display)
- Write: Admin only

## Module Management

### Enabling/Disabling Modules

```typescript
// Via UI: Settings → System → Enabled Modules

// Via code:
await schoolConfigService.toggleModule(configId, "expenses", false);
```

### Checking Module Access

```typescript
import { useSchool } from '@/contexts/SchoolContext';

function ExpensesModule() {
  const { isModuleEnabled } = useSchool();

  if (!isModuleEnabled('expenses')) {
    return <div>This module is not available</div>;
  }

  return <ExpensesContent />;
}
```

## Branding Customization

### Dynamic Theming

```typescript
const { config } = useSchool();

// Apply school colors
document.documentElement.style.setProperty(
  "--primary-color",
  config.branding.primaryColor,
);
```

### Logo Display

```tsx
<img src={config.branding.logo} alt={config.schoolName} />
```

## Best Practices

1. **Always validate satellite ID**: Ensure each school connects to correct satellite
2. **Cache configuration**: Use React context to avoid repeated fetches
3. **Graceful fallbacks**: Provide defaults if config is not loaded
4. **Admin-only updates**: Restrict configuration changes to admin users
5. **Audit changes**: Log all configuration updates
6. **Backup configs**: Regularly export school configurations

## Security Considerations

1. **Satellite isolation**: Each school's data is completely isolated
2. **Permission model**: Only admins can modify school configuration
3. **API validation**: Backend validates all configuration changes
4. **Sensitive data**: Never expose satellite IDs in client logs

## Testing Multi-Tenancy

```typescript
// Mock school configuration for testing
const mockConfig: SchoolConfig = {
  id: 'test-config',
  schoolName: 'Test School',
  schoolCode: 'TEST001',
  satelliteId: 'test-satellite',
  // ... other fields
};

// Wrap test components
<SchoolProvider>
  <YourComponent />
</SchoolProvider>
```

## Troubleshooting

### Configuration Not Loading

- Check satellite ID in environment variables
- Verify Juno initialization
- Check browser console for errors

### Updates Not Saving

- Ensure user has admin role
- Check collection permissions in Juno
- Verify internet connection

### Wrong School Data Showing

- Verify correct satellite ID
- Clear browser cache
- Check authentication state

## Future Enhancements

- [ ] Import/Export configuration
- [ ] Configuration templates
- [ ] Multi-language support
- [ ] Advanced branding (CSS customization)
- [ ] Usage analytics per school
- [ ] Automated backups
- [ ] Configuration versioning

## Related Documentation

- [Type System Overview](./TYPE_SYSTEM_OVERVIEW.md)
- [Service Layer](./SERVICE_LAYER.md)
- [Authentication & Roles](./JUNO_INITIALIZATION_FIX.md)
