import { useSchool } from "@/contexts/SchoolContext";

/**
 * Custom hook to check if the banking module is enabled
 * 
 * This hook checks the school configuration to determine if
 * banking features should be available to users.
 * 
 * @returns Object containing isEnabled flag and schoolConfig
 * 
 * @example
 * ```tsx
 * function BankingDashboard() {
 *   const { isBankingEnabled, schoolConfig } = useBankingModule();
 *   
 *   if (!isBankingEnabled) {
 *     return <div>Banking module is not enabled for this school.</div>;
 *   }
 *   
 *   return <div>Banking features...</div>;
 * }
 * ```
 */
export function useBankingModule() {
  const { config } = useSchool();

  const isBankingEnabled =
    config?.enabledModules?.includes("banking") ?? false;

  return {
    isBankingEnabled,
    schoolConfig: config,
  };
}
