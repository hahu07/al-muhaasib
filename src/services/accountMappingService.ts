import { BaseDataService, COLLECTIONS } from "./dataService";
import type { AccountMapping, FeeType, ExpenseCategory } from "@/types";
import { chartOfAccountsService } from "./accountingService";

export class AccountMappingService extends BaseDataService<AccountMapping> {
  constructor() {
    super(COLLECTIONS.ACCOUNT_MAPPINGS);
  }

  /**
   * Get mapping for a specific source type (e.g., fee type or expense category)
   */
  async getMappingForSource(
    mappingType: AccountMapping["mappingType"],
    sourceType: string,
  ): Promise<AccountMapping | null> {
    const mappings = await this.list();
    const matching = mappings.filter(
      (m) =>
        m.mappingType === mappingType &&
        m.sourceType === sourceType &&
        m.isActive,
    );

    // If multiple mappings exist (duplicates), return the most recent one
    if (matching.length === 0) return null;
    if (matching.length === 1) return matching[0];

    // Sort by updatedAt descending and return the newest
    return matching.sort(
      (a, b) => Number(b.updatedAt) - Number(a.updatedAt),
    )[0];
  }

  /**
   * Get all mappings by type (deduplicated)
   */
  async getByType(
    mappingType: AccountMapping["mappingType"],
  ): Promise<AccountMapping[]> {
    const mappings = await this.list();
    const activeMappings = mappings.filter(
      (m) => m.mappingType === mappingType && m.isActive,
    );

    // Deduplicate by sourceType - keep only the most recent one
    const seen = new Map<string, AccountMapping>();
    for (const mapping of activeMappings) {
      const existing = seen.get(mapping.sourceType);
      if (!existing || Number(mapping.updatedAt) > Number(existing.updatedAt)) {
        seen.set(mapping.sourceType, mapping);
      }
    }

    return Array.from(seen.values());
  }

  /**
   * Check if a mapping would create a duplicate
   */
  async validateNoDuplicate(
    mappingType: AccountMapping["mappingType"],
    sourceType: string,
    excludeMappingId?: string,
  ): Promise<{ valid: boolean; message?: string }> {
    const mappings = await this.list();
    const duplicate = mappings.find(
      (m) =>
        m.mappingType === mappingType &&
        m.sourceType === sourceType &&
        m.isActive &&
        m.id !== excludeMappingId,
    );

    if (duplicate) {
      return {
        valid: false,
        message: `A mapping for ${sourceType} already exists. Each source type can only map to one account.`,
      };
    }

    return { valid: true };
  }

  /**
   * Create or update mapping with duplicate validation
   */
  async setMapping(data: {
    mappingType: AccountMapping["mappingType"];
    sourceType: string;
    sourceName: string;
    accountId: string;
    accountCode: string;
    accountName: string;
  }): Promise<AccountMapping> {
    // Check if mapping already exists
    const existing = await this.getMappingForSource(
      data.mappingType,
      data.sourceType,
    );

    // Validate no duplicate (skip if updating existing)
    const validation = await this.validateNoDuplicate(
      data.mappingType,
      data.sourceType,
      existing?.id,
    );

    if (!validation.valid) {
      throw new Error(validation.message);
    }

    if (existing) {
      return this.update(existing.id, {
        accountId: data.accountId,
        accountCode: data.accountCode,
        accountName: data.accountName,
        sourceName: data.sourceName,
      });
    }

    return this.create({
      ...data,
      isDefault: false,
      isActive: true,
    });
  }

  /**
   * Initialize default mappings for revenue (fee types)
   */
  async initializeDefaultRevenueMappings(): Promise<AccountMapping[]> {
    const accounts = await chartOfAccountsService.getActiveAccounts();
    const tuitionAccount = accounts.find((a) => a.accountCode === "4100");
    const feeAccount = accounts.find((a) => a.accountCode === "4200");
    const otherIncomeAccount = accounts.find((a) => a.accountCode === "4300");

    if (!tuitionAccount || !feeAccount || !otherIncomeAccount) {
      console.warn(
        "Default revenue accounts not found. Please ensure Chart of Accounts is initialized.",
      );
      return [];
    }

    const defaultMappings: Array<{
      sourceType: FeeType;
      sourceName: string;
      accountId: string;
      accountCode: string;
      accountName: string;
    }> = [
      {
        sourceType: "tuition",
        sourceName: "Tuition Fees",
        accountId: tuitionAccount.id,
        accountCode: tuitionAccount.accountCode,
        accountName: tuitionAccount.accountName,
      },
      {
        sourceType: "uniform",
        sourceName: "Uniform Fees",
        accountId: feeAccount.id,
        accountCode: feeAccount.accountCode,
        accountName: feeAccount.accountName,
      },
      {
        sourceType: "feeding",
        sourceName: "Feeding Fees",
        accountId: otherIncomeAccount.id,
        accountCode: otherIncomeAccount.accountCode,
        accountName: otherIncomeAccount.accountName,
      },
      {
        sourceType: "transport",
        sourceName: "Transport Fees",
        accountId: otherIncomeAccount.id,
        accountCode: otherIncomeAccount.accountCode,
        accountName: otherIncomeAccount.accountName,
      },
      {
        sourceType: "books",
        sourceName: "Books & Materials",
        accountId: feeAccount.id,
        accountCode: feeAccount.accountCode,
        accountName: feeAccount.accountName,
      },
      {
        sourceType: "sports",
        sourceName: "Sports Fees",
        accountId: feeAccount.id,
        accountCode: feeAccount.accountCode,
        accountName: feeAccount.accountName,
      },
      {
        sourceType: "development",
        sourceName: "Development Levy",
        accountId: feeAccount.id,
        accountCode: feeAccount.accountCode,
        accountName: feeAccount.accountName,
      },
      {
        sourceType: "examination",
        sourceName: "Examination Fees",
        accountId: feeAccount.id,
        accountCode: feeAccount.accountCode,
        accountName: feeAccount.accountName,
      },
      {
        sourceType: "pta",
        sourceName: "PTA Dues",
        accountId: feeAccount.id,
        accountCode: feeAccount.accountCode,
        accountName: feeAccount.accountName,
      },
      {
        sourceType: "computer",
        sourceName: "Computer Fees",
        accountId: feeAccount.id,
        accountCode: feeAccount.accountCode,
        accountName: feeAccount.accountName,
      },
      {
        sourceType: "library",
        sourceName: "Library Fees",
        accountId: feeAccount.id,
        accountCode: feeAccount.accountCode,
        accountName: feeAccount.accountName,
      },
      {
        sourceType: "laboratory",
        sourceName: "Laboratory Fees",
        accountId: feeAccount.id,
        accountCode: feeAccount.accountCode,
        accountName: feeAccount.accountName,
      },
      {
        sourceType: "lesson",
        sourceName: "Extra Lessons",
        accountId: feeAccount.id,
        accountCode: feeAccount.accountCode,
        accountName: feeAccount.accountName,
      },
      {
        sourceType: "other",
        sourceName: "Other Fees",
        accountId: otherIncomeAccount.id,
        accountCode: otherIncomeAccount.accountCode,
        accountName: otherIncomeAccount.accountName,
      },
    ];

    const created: AccountMapping[] = [];
    for (const mapping of defaultMappings) {
      const existing = await this.getMappingForSource(
        "revenue",
        mapping.sourceType,
      );
      if (!existing) {
        const newMapping = await this.create({
          mappingType: "revenue",
          ...mapping,
          isDefault: true,
          isActive: true,
        });
        created.push(newMapping);
      }
    }

    return created;
  }

  /**
   * Initialize default mappings for expenses
   */
  async initializeDefaultExpenseMappings(): Promise<AccountMapping[]> {
    const accounts = await chartOfAccountsService.getActiveAccounts();
    const salaryExpense = accounts.find((a) => a.accountCode === "5100");
    const utilitiesExpense = accounts.find((a) => a.accountCode === "5200");
    const maintenanceExpense = accounts.find((a) => a.accountCode === "5300");
    const suppliesExpense = accounts.find((a) => a.accountCode === "5400");
    const adminExpense = accounts.find((a) => a.accountCode === "5600");
    const otherExpense = accounts.find((a) => a.accountCode === "5900");

    if (!salaryExpense || !utilitiesExpense || !otherExpense) {
      console.warn(
        "Default expense accounts not found. Please ensure Chart of Accounts is initialized.",
      );
      return [];
    }

    const defaultMappings: Array<{
      sourceType: string;
      sourceName: string;
      accountId: string;
      accountCode: string;
      accountName: string;
    }> = [
      {
        sourceType: "salaries",
        sourceName: "Salaries & Wages",
        accountId: salaryExpense.id,
        accountCode: salaryExpense.accountCode,
        accountName: salaryExpense.accountName,
      },
      {
        sourceType: "utilities",
        sourceName: "Utilities",
        accountId: utilitiesExpense.id,
        accountCode: utilitiesExpense.accountCode,
        accountName: utilitiesExpense.accountName,
      },
      {
        sourceType: "maintenance",
        sourceName: "Maintenance & Repairs",
        accountId: maintenanceExpense?.id || otherExpense.id,
        accountCode: maintenanceExpense?.accountCode || otherExpense.accountCode,
        accountName: maintenanceExpense?.accountName || otherExpense.accountName,
      },
      {
        sourceType: "stationery",
        sourceName: "Stationery & Supplies",
        accountId: suppliesExpense?.id || otherExpense.id,
        accountCode: suppliesExpense?.accountCode || otherExpense.accountCode,
        accountName: suppliesExpense?.accountName || otherExpense.accountName,
      },
      {
        sourceType: "administrative",
        sourceName: "Administrative Expenses",
        accountId: adminExpense?.id || otherExpense.id,
        accountCode: adminExpense?.accountCode || otherExpense.accountCode,
        accountName: adminExpense?.accountName || otherExpense.accountName,
      },
      {
        sourceType: "miscellaneous",
        sourceName: "Miscellaneous Expenses",
        accountId: otherExpense.id,
        accountCode: otherExpense.accountCode,
        accountName: otherExpense.accountName,
      },
    ];

    const created: AccountMapping[] = [];
    for (const mapping of defaultMappings) {
      const existing = await this.getMappingForSource(
        "expense",
        mapping.sourceType,
      );
      if (!existing) {
        const newMapping = await this.create({
          mappingType: "expense",
          ...mapping,
          isDefault: true,
          isActive: true,
        });
        created.push(newMapping);
      }
    }

    return created;
  }

  /**
   * Initialize default mappings for assets
   */
  async initializeDefaultAssetMappings(): Promise<AccountMapping[]> {
    const accounts = await chartOfAccountsService.getActiveAccounts();
    const fixedAssetsAccount = accounts.find((a) => a.accountCode === "1200");
    const cashAccount = accounts.find((a) => a.accountCode === "1110");
    const bankAccount = accounts.find((a) => a.accountCode === "1120");

    if (!fixedAssetsAccount || !cashAccount || !bankAccount) {
      console.warn(
        "Default asset accounts not found. Please ensure Chart of Accounts is initialized.",
      );
      return [];
    }

    const defaultMappings: Array<{
      sourceType: string;
      sourceName: string;
      accountId: string;
      accountCode: string;
      accountName: string;
    }> = [
      {
        sourceType: "building",
        sourceName: "Building Purchase",
        accountId: fixedAssetsAccount.id,
        accountCode: fixedAssetsAccount.accountCode,
        accountName: fixedAssetsAccount.accountName,
      },
      {
        sourceType: "equipment",
        sourceName: "Equipment Purchase",
        accountId: fixedAssetsAccount.id,
        accountCode: fixedAssetsAccount.accountCode,
        accountName: fixedAssetsAccount.accountName,
      },
      {
        sourceType: "furniture",
        sourceName: "Furniture Purchase",
        accountId: fixedAssetsAccount.id,
        accountCode: fixedAssetsAccount.accountCode,
        accountName: fixedAssetsAccount.accountName,
      },
      {
        sourceType: "vehicle",
        sourceName: "Vehicle Purchase",
        accountId: fixedAssetsAccount.id,
        accountCode: fixedAssetsAccount.accountCode,
        accountName: fixedAssetsAccount.accountName,
      },
      {
        sourceType: "computer",
        sourceName: "Computer/IT Equipment",
        accountId: fixedAssetsAccount.id,
        accountCode: fixedAssetsAccount.accountCode,
        accountName: fixedAssetsAccount.accountName,
      },
    ];

    const created: AccountMapping[] = [];
    for (const mapping of defaultMappings) {
      const existing = await this.getMappingForSource("asset", mapping.sourceType);
      if (!existing) {
        const newMapping = await this.create({
          mappingType: "asset",
          ...mapping,
          isDefault: true,
          isActive: true,
        });
        created.push(newMapping);
      }
    }

    return created;
  }

  /**
   * Initialize default mappings for liabilities
   */
  async initializeDefaultLiabilityMappings(): Promise<AccountMapping[]> {
    const accounts = await chartOfAccountsService.getActiveAccounts();
    const accountsPayable = accounts.find((a) => a.accountCode === "2110");
    const salariesPayable = accounts.find((a) => a.accountCode === "2120");
    const taxPayable = accounts.find((a) => a.accountCode === "2130");
    const nhfPayable = accounts.find((a) => a.accountCode === "2140");
    const pensionPayable = accounts.find((a) => a.accountCode === "2150");
    const nhisPayable = accounts.find((a) => a.accountCode === "2160");

    if (!accountsPayable || !salariesPayable || !taxPayable) {
      console.warn(
        "Default liability accounts not found. Please ensure Chart of Accounts is initialized.",
      );
      return [];
    }

    const defaultMappings: Array<{
      sourceType: string;
      sourceName: string;
      accountId: string;
      accountCode: string;
      accountName: string;
    }> = [
      {
        sourceType: "vendor_payable",
        sourceName: "Vendor Payables",
        accountId: accountsPayable.id,
        accountCode: accountsPayable.accountCode,
        accountName: accountsPayable.accountName,
      },
      {
        sourceType: "salary_payable",
        sourceName: "Salary Payables",
        accountId: salariesPayable.id,
        accountCode: salariesPayable.accountCode,
        accountName: salariesPayable.accountName,
      },
      {
        sourceType: "tax_payable",
        sourceName: "Tax Payables",
        accountId: taxPayable.id,
        accountCode: taxPayable.accountCode,
        accountName: taxPayable.accountName,
      },
      {
        sourceType: "loan_payable",
        sourceName: "Loan Payables",
        accountId: accountsPayable.id,
        accountCode: accountsPayable.accountCode,
        accountName: accountsPayable.accountName,
      },
    ];

    // Add statutory deduction mappings if accounts exist
    if (nhfPayable) {
      defaultMappings.push({
        sourceType: "nhf_payable",
        sourceName: "National Housing Fund Payable",
        accountId: nhfPayable.id,
        accountCode: nhfPayable.accountCode,
        accountName: nhfPayable.accountName,
      });
    }

    if (pensionPayable) {
      defaultMappings.push({
        sourceType: "pension_payable",
        sourceName: "Pension Contributions Payable",
        accountId: pensionPayable.id,
        accountCode: pensionPayable.accountCode,
        accountName: pensionPayable.accountName,
      });
    }

    if (nhisPayable) {
      defaultMappings.push({
        sourceType: "nhis_payable",
        sourceName: "NHIS Contributions Payable",
        accountId: nhisPayable.id,
        accountCode: nhisPayable.accountCode,
        accountName: nhisPayable.accountName,
      });
    }

    const created: AccountMapping[] = [];
    for (const mapping of defaultMappings) {
      const existing = await this.getMappingForSource(
        "liability",
        mapping.sourceType,
      );
      if (!existing) {
        const newMapping = await this.create({
          mappingType: "liability",
          ...mapping,
          isDefault: true,
          isActive: true,
        });
        created.push(newMapping);
      }
    }

    return created;
  }

  /**
   * Remove duplicate mappings (keep the most recent one for each sourceType)
   */
  async removeDuplicates(): Promise<number> {
    const mappings = await this.list();
    const toDelete: string[] = [];

    // Group by mappingType and sourceType
    const groups = new Map<string, AccountMapping[]>();
    for (const mapping of mappings) {
      if (!mapping.isActive) continue;
      const key = `${mapping.mappingType}:${mapping.sourceType}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(mapping);
    }

    // For each group, keep only the most recent, delete the rest
    for (const [key, group] of groups.entries()) {
      if (group.length > 1) {
        // Sort by updatedAt descending
        group.sort((a, b) => Number(b.updatedAt) - Number(a.updatedAt));
        // Mark all except the first (most recent) for deletion
        for (let i = 1; i < group.length; i++) {
          toDelete.push(group[i].id);
        }
      }
    }

    // Delete duplicates
    for (const id of toDelete) {
      await this.delete(id);
    }

    return toDelete.length;
  }

  /**
   * Initialize all default mappings
   */
  async initializeDefaults(): Promise<{
    revenue: AccountMapping[];
    expense: AccountMapping[];
    asset: AccountMapping[];
    liability: AccountMapping[];
  }> {
    const revenue = await this.initializeDefaultRevenueMappings();
    const expense = await this.initializeDefaultExpenseMappings();
    const asset = await this.initializeDefaultAssetMappings();
    const liability = await this.initializeDefaultLiabilityMappings();

    // Clean up any duplicates that may have been created
    await this.removeDuplicates();

    return { revenue, expense, asset, liability };
  }
}

export const accountMappingService = new AccountMappingService();
