/**
 * SCHOOL CONFIGURATION SERVICE
 *
 * Manages school settings, branding, and multi-tenant configuration.
 * Each school has one configuration document stored in the "school_config" collection.
 */

import { getDoc, listDocs, setDoc } from "@junobuild/core";
import type { Doc } from "@junobuild/core";
import { nanoid } from "nanoid";
import type {
  SchoolConfig,
  SchoolBranding,
  AcademicSession,
  TermSettings,
  ModuleName,
  AcademicTerm,
} from "@/types";

const COLLECTION_NAME = "school_config";

/**
 * Service for managing school configuration
 */
export class SchoolConfigService {
  /**
   * Get the school configuration
   * Since each satellite represents one school, there should be only one config document
   */
  async getConfig(): Promise<SchoolConfig | null> {
    try {
      const docs = await listDocs({
        collection: COLLECTION_NAME,
        filter: {},
      });

      if (docs.items.length === 0) {
        return null;
      }

      const doc = docs.items[0];
      return this.mapDocToConfig(doc);
    } catch (error) {
      console.error("Error fetching school config:", error);
      throw error;
    }
  }

  /**
   * Get config by ID
   */
  async getConfigById(id: string): Promise<SchoolConfig | null> {
    try {
      const doc = await getDoc({
        collection: COLLECTION_NAME,
        key: id,
      });

      if (!doc) return null;

      return this.mapDocToConfig(doc);
    } catch (error) {
      console.error("Error fetching config by ID:", error);
      throw error;
    }
  }

  /**
   * Create initial school configuration
   */
  async createConfig(
    config: Omit<SchoolConfig, "id" | "createdAt" | "updatedAt">,
  ): Promise<SchoolConfig> {
    try {
      const id = nanoid();
      const nowNanos = BigInt(Date.now()) * BigInt(1_000_000);

      const newConfig = {
        ...config,
        id,
        createdAt: nowNanos,
        updatedAt: nowNanos,
      } as SchoolConfig;

      await setDoc({
        collection: COLLECTION_NAME,
        doc: {
          key: id,
          data: this.configToDocData(newConfig),
          description: `School Configuration: ${config.schoolName}`,
          version: undefined,
        },
      });

      return newConfig;
    } catch (error) {
      console.error("Error creating school config:", error);
      throw error;
    }
  }

  /**
   * Update school configuration
   */
  async updateConfig(
    id: string,
    updates: Partial<SchoolConfig>,
  ): Promise<SchoolConfig> {
    try {
      const existingDoc = await getDoc({
        collection: COLLECTION_NAME,
        key: id,
      });

      if (!existingDoc) {
        throw new Error("School configuration not found");
      }

      const existing = this.mapDocToConfig(existingDoc);
      const updatedConfig: SchoolConfig = {
        ...existing,
        ...updates,
        id: existing.id,
        createdAt: existing.createdAt,
        updatedAt: BigInt(Date.now()) * BigInt(1_000_000),
      };

      await setDoc({
        collection: COLLECTION_NAME,
        doc: {
          key: id,
          data: this.configToDocData(updatedConfig),
          description: `School Configuration: ${updatedConfig.schoolName}`,
          version: existingDoc.version,
        },
      });

      return updatedConfig;
    } catch (error) {
      console.error("Error updating school config:", error);
      throw error;
    }
  }

  /**
   * Update branding settings
   */
  async updateBranding(
    id: string,
    branding: Partial<SchoolBranding>,
  ): Promise<SchoolConfig> {
    try {
      const config = await this.getConfigById(id);
      if (!config) {
        throw new Error("School configuration not found");
      }

      const updatedBranding: SchoolBranding = {
        ...config.branding,
        ...branding,
      };

      return this.updateConfig(id, { branding: updatedBranding });
    } catch (error) {
      console.error("Error updating branding:", error);
      throw error;
    }
  }

  /**
   * Update academic settings
   */
  async updateAcademicSettings(
    id: string,
    settings: {
      currentSession?: string;
      currentTerm?: AcademicTerm;
      sessions?: AcademicSession[];
      terms?: TermSettings[];
    },
  ): Promise<SchoolConfig> {
    try {
      return this.updateConfig(id, settings);
    } catch (error) {
      console.error("Error updating academic settings:", error);
      throw error;
    }
  }

  /**
   * Toggle module availability
   */
  async toggleModule(
    id: string,
    moduleName: ModuleName,
    enabled: boolean,
  ): Promise<SchoolConfig> {
    try {
      const config = await this.getConfigById(id);
      if (!config) {
        throw new Error("School configuration not found");
      }

      let enabledModules = [...config.enabledModules];

      if (enabled && !enabledModules.includes(moduleName)) {
        enabledModules.push(moduleName);
      } else if (!enabled) {
        enabledModules = enabledModules.filter((m) => m !== moduleName);
      }

      return this.updateConfig(id, { enabledModules });
    } catch (error) {
      console.error("Error toggling module:", error);
      throw error;
    }
  }

  /**
   * Create default school configuration
   */
  async createDefaultConfig(
    schoolName: string,
    satelliteId: string,
    createdBy: string,
  ): Promise<SchoolConfig> {
    const defaultConfig: Omit<SchoolConfig, "id" | "createdAt" | "updatedAt"> =
      {
        schoolName,
        schoolCode: nanoid(8).toUpperCase(),
        motto: "",
        address: "",
        city: "",
        state: "",
        country: "Nigeria",
        phone: "",
        email: "",
        branding: {
          primaryColor: "#4F46E5",
          secondaryColor: "#7C3AED",
          accentColor: "#EC4899",
          logo: "/favicon.svg",
        },
        currency: "NGN",
        currencySymbol: "₦",
        timezone: "Africa/Lagos",
        locale: "en-NG",
        dateFormat: "DD/MM/YYYY",
        currentSession: "2024/2025",
        currentTerm: "first",
        sessions: [
          {
            id: nanoid(),
            name: "2024/2025",
            startDate: "2024-09-01",
            endDate: "2025-07-31",
            isCurrent: true,
          },
        ],
        terms: [
          {
            id: nanoid(),
            name: "first",
            label: "First Term",
            startDate: "2024-09-01",
            endDate: "2024-12-20",
            isCurrent: true,
          },
          {
            id: nanoid(),
            name: "second",
            label: "Second Term",
            startDate: "2025-01-06",
            endDate: "2025-04-10",
            isCurrent: false,
          },
          {
            id: nanoid(),
            name: "third",
            label: "Third Term",
            startDate: "2025-04-28",
            endDate: "2025-07-31",
            isCurrent: false,
          },
        ],
        enabledModules: [
          "students",
          "fees",
          "payments",
          "expenses",
          "staff",
          "assets",
          "reports",
          "accounting",
        ],
        allowPartialPayments: true,
        defaultPaymentMethods: ["cash", "bank_transfer", "pos"],
        satelliteId,
        isActive: true,
        subscriptionStatus: "trial",
        createdBy,
      };

    return this.createConfig(defaultConfig);
  }

  /**
   * Check if a module is enabled
   */
  async isModuleEnabled(moduleName: ModuleName): Promise<boolean> {
    try {
      const config = await this.getConfig();
      if (!config) return true; // If no config, allow all modules

      return config.enabledModules.includes(moduleName);
    } catch (error) {
      console.error("Error checking module status:", error);
      return true; // Default to enabled on error
    }
  }

  /**
   * Get current academic session and term
   */
  async getCurrentAcademic(): Promise<{
    session: string;
    term: AcademicTerm;
  } | null> {
    try {
      const config = await this.getConfig();
      if (!config) return null;

      return {
        session: config.currentSession,
        term: config.currentTerm,
      };
    } catch (error) {
      console.error("Error getting current academic period:", error);
      return null;
    }
  }

  /**
   * Helper: Map Juno document to SchoolConfig
   */
  private mapDocToConfig(doc: Doc<Record<string, unknown>>): SchoolConfig {
    const data = doc.data as Record<string, unknown>;

    return {
      id: doc.key,
      schoolName: data.schoolName as string,
      schoolCode: data.schoolCode as string,
      motto: data.motto as string | undefined,
      address: data.address as string,
      city: data.city as string,
      state: data.state as string,
      country: data.country as string,
      postalCode: data.postalCode as string | undefined,
      phone: data.phone as string,
      email: data.email as string,
      website: data.website as string | undefined,
      branding: data.branding as SchoolBranding,
      currency: data.currency as string,
      currencySymbol: data.currencySymbol as string,
      timezone: data.timezone as string,
      locale: data.locale as string,
      dateFormat: data.dateFormat as string,
      currentSession: data.currentSession as string,
      currentTerm: data.currentTerm as AcademicTerm,
      sessions: data.sessions as AcademicSession[],
      terms: data.terms as TermSettings[],
      enabledModules: data.enabledModules as ModuleName[],
      allowPartialPayments: data.allowPartialPayments as boolean,
      lateFeePercentage: data.lateFeePercentage as number | undefined,
      defaultPaymentMethods: data.defaultPaymentMethods as (
        | "cash"
        | "bank_transfer"
        | "pos"
        | "online"
        | "cheque"
      )[],
      reportHeader: data.reportHeader as string | undefined,
      reportFooter: data.reportFooter as string | undefined,
      customFields: data.customFields as Record<string, unknown> | undefined,
      satelliteId: data.satelliteId as string,
      isActive: data.isActive as boolean,
      subscriptionStatus: data.subscriptionStatus as
        | "trial"
        | "active"
        | "suspended"
        | "cancelled"
        | undefined,
      subscriptionExpiresAt: data.subscriptionExpiresAt as string | undefined,
      createdAt: BigInt(data.createdAt as number),
      updatedAt: BigInt(data.updatedAt as number),
      createdBy: data.createdBy as string,
    };
  }

  /**
   * Helper: Convert SchoolConfig to document data
   */
  private configToDocData(config: SchoolConfig): Record<string, unknown> {
    return {
      schoolName: config.schoolName,
      schoolCode: config.schoolCode,
      motto: config.motto,
      address: config.address,
      city: config.city,
      state: config.state,
      country: config.country,
      postalCode: config.postalCode,
      phone: config.phone,
      email: config.email,
      website: config.website,
      branding: config.branding,
      currency: config.currency,
      currencySymbol: config.currencySymbol,
      timezone: config.timezone,
      locale: config.locale,
      dateFormat: config.dateFormat,
      currentSession: config.currentSession,
      currentTerm: config.currentTerm,
      sessions: config.sessions,
      terms: config.terms,
      enabledModules: config.enabledModules,
      allowPartialPayments: config.allowPartialPayments,
      lateFeePercentage: config.lateFeePercentage,
      defaultPaymentMethods: config.defaultPaymentMethods,
      reportHeader: config.reportHeader,
      reportFooter: config.reportFooter,
      customFields: config.customFields,
      satelliteId: config.satelliteId,
      isActive: config.isActive,
      subscriptionStatus: config.subscriptionStatus,
      subscriptionExpiresAt: config.subscriptionExpiresAt,
      createdAt: Number(config.createdAt),
      updatedAt: Number(config.updatedAt),
      createdBy: config.createdBy,
    };
  }
}

// Export singleton instance
export const schoolConfigService = new SchoolConfigService();
