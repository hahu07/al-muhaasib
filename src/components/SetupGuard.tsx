"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { setupService } from "@/services/setupService";

/**
 * SetupGuard Component
 * Redirects to setup wizard if system needs initial setup
 * Only the first authenticated user will see the setup wizard
 */
export function SetupGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, appUser, loading: authLoading } = useAuth();
  const [checkingSetup, setCheckingSetup] = useState(false);
  const [setupChecked, setSetupChecked] = useState(false);

  useEffect(() => {
    const checkSetup = async () => {
      // Skip if already checked
      if (setupChecked) {
        return;
      }

      // Skip check if still loading auth
      if (authLoading) {
        return;
      }

      // Skip if on setup page
      if (pathname === "/setup") {
        setSetupChecked(true);
        return;
      }

      // Only check if user is fully authenticated with profile
      if (!user || !appUser) {
        return;
      }

      // If user already has a role, assume setup is done
      if (appUser.role) {
        setSetupChecked(true);
        return;
      }

      // Only perform the expensive database check as last resort
      try {
        setCheckingSetup(true);
        const needsSetup = await setupService.needsSetup();

        if (needsSetup && pathname !== "/setup") {
          router.push("/setup");
        }

        setSetupChecked(true);
      } catch (error) {
        console.error("Error checking setup status:", error);
        // On error, assume setup is done and let user proceed
        setSetupChecked(true);
      } finally {
        setCheckingSetup(false);
      }
    };

    checkSetup();
  }, [user, appUser, authLoading, pathname, router, setupChecked]);

  // Show loading state only while actively checking setup
  if (checkingSetup) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Checking system status...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
