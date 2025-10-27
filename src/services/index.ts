/**
 * AL-MUHAASIB SERVICE LAYER
 * Comprehensive exports for all services
 */

// Base services
export * from "./dataService";
export * from "./userService";

// School configuration
export * from "./schoolConfigService";

// School management
export * from "./classService";

// Revenue management
export * from "./feeService";
export * from "./paymentService";

// Expense management
export * from "./expenseService";

// Staff & payroll
export * from "./staffService";
export * from "./statutoryDeductionsCalculator";
export * from "./payeCalculator";

// Asset & capital expenditure management
export * from "./assetService";
export * from "./depreciationPostingService";

// Accounting & double-entry bookkeeping
export * from "./accountingService";
export * from "./accountMappingService";

// Banking module (optional, enabled via SchoolConfig)
export * from "./bankingService";
export * from "./bankingAutoPostService";
