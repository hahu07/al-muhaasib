"use client";

/**
 * SCHOOL CONFIGURATION CONTEXT
 *
 * Provides school configuration and settings throughout the application.
 * Handles branding, currency, academic settings, and module permissions.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import type { SchoolConfig, ModuleName } from "@/types";
import { schoolConfigService } from "@/services/schoolConfigService";
import { useAuth } from "./AuthContext";

interface SchoolContextValue {
  config: SchoolConfig | null;
  loading: boolean;
  error: string | null;

  // Helper methods
  isModuleEnabled: (moduleName: ModuleName) => boolean;
  formatCurrency: (amount: number) => string;
  getCurrentSession: () => string;
  getCurrentTerm: () => string;

  // Update methods
  refreshConfig: () => Promise<void>;
  updateConfig: (updates: Partial<SchoolConfig>) => Promise<void>;
}

const SchoolContext = createContext<SchoolContextValue | undefined>(undefined);

interface SchoolProviderProps {
  children: ReactNode;
}

export function SchoolProvider({ children }: SchoolProviderProps) {
  const [config, setConfig] = useState<SchoolConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Load school configuration
  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      const schoolConfig = await schoolConfigService.getConfig();
      
      console.log('[SchoolContext] Loaded config:', {
        hasConfig: !!schoolConfig,
        defaultPaymentMethods: schoolConfig?.defaultPaymentMethods,
        enabledModules: schoolConfig?.enabledModules
      });

      // If no config exists, create default config
      if (!schoolConfig && user) {
        const satelliteId = process.env.NEXT_PUBLIC_SATELLITE_ID || "local-dev";
        const defaultConfig = await schoolConfigService.createDefaultConfig(
          "My School",
          satelliteId,
          user.key,
        );
        console.log('[SchoolContext] Created default config:', {
          defaultPaymentMethods: defaultConfig.defaultPaymentMethods
        });
        setConfig(defaultConfig);
      } else {
        setConfig(schoolConfig);
      }
    } catch (err) {
      console.error("Error loading school config:", err);
      setError("Failed to load school configuration");
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (user) {
      loadConfig();
    }
  }, [user]);

  // Refresh configuration
  const refreshConfig = async () => {
    await loadConfig();
  };

  // Update configuration
  const updateConfig = async (updates: Partial<SchoolConfig>) => {
    if (!config) {
      throw new Error("No school configuration loaded");
    }

    try {
      const updated = await schoolConfigService.updateConfig(
        config.id,
        updates,
      );
      setConfig(updated);
    } catch (err) {
      console.error("Error updating school config:", err);
      throw err;
    }
  };

  // Check if module is enabled
  const isModuleEnabled = (moduleName: ModuleName): boolean => {
    if (!config) return true; // Default to enabled if no config
    return config.enabledModules.includes(moduleName);
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    if (!config) return `₦${amount.toLocaleString("en-NG")}`;

    return `${config.currencySymbol}${amount.toLocaleString(config.locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Get current session
  const getCurrentSession = (): string => {
    return config?.currentSession || "2024/2025";
  };

  // Get current term
  const getCurrentTerm = (): string => {
    if (!config) return "First Term";

    const term = config.terms.find((t) => t.name === config.currentTerm);
    return term?.label || "First Term";
  };

  const value: SchoolContextValue = {
    config,
    loading,
    error,
    isModuleEnabled,
    formatCurrency,
    getCurrentSession,
    getCurrentTerm,
    refreshConfig,
    updateConfig,
  };

  return (
    <SchoolContext.Provider value={value}>{children}</SchoolContext.Provider>
  );
}

// Hook to use school context
export function useSchool() {
  const context = useContext(SchoolContext);
  if (context === undefined) {
    throw new Error("useSchool must be used within a SchoolProvider");
  }
  return context;
}

// Optional hook that returns null if not in provider (for optional usage)
export function useSchoolOptional() {
  return useContext(SchoolContext);
}
