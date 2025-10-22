"use client";

import { useEffect, useState } from "react";
import { initSatellite } from "@junobuild/core";
import { AuthProvider } from "@/contexts/AuthContext";
import { SchoolProvider } from "@/contexts/SchoolContext";

export function JunoProvider({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        await initSatellite({
          workers: {
            auth: true,
          },
        });
        setInitialized(true);
      } catch (err) {
        console.error("Failed to initialize Juno:", err);
        setError(
          "Failed to connect to backend storage. Please check your configuration.",
        );
      }
    };

    init();
  }, []);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md p-8 text-center">
          <div className="mb-4 text-6xl">⚠️</div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
            Configuration Error
          </h1>
          <p className="mb-4 text-gray-600 dark:text-gray-400">{error}</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Please ensure Juno is properly configured in your environment.
          </p>
        </div>
      </div>
    );
  }

  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-b-4 border-blue-600"></div>
          <p className="text-gray-600 dark:text-gray-400">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <SchoolProvider>{children}</SchoolProvider>
    </AuthProvider>
  );
}
