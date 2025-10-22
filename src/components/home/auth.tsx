"use client";

import { Login } from "@/components/home/login";
import { Logout } from "@/components/home/logout";
import { useAuth } from "@/contexts/AuthContext";
import { type ReactNode } from "react";

interface AuthProps {
  children: ReactNode;
}

export const Auth = ({ children }: AuthProps) => {
  const { user, loading } = useAuth();

  // Show loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-400"></div>
          <h2 className="gradient-text mb-2 text-xl font-semibold">
            Al-Muhaasib
          </h2>
          <p className="text-blue-300">Loading your account...</p>
        </div>
      </div>
    );
  }

  // Show login screen if no user
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md space-y-8 p-8">
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600">
              <span className="text-2xl font-bold text-white">₦</span>
            </div>
            <h2 className="gradient-text mb-3 text-4xl font-extrabold">
              Al-Muhaasib
            </h2>
            <p className="mt-2 mb-2 text-xl font-medium text-blue-300">
              School Management Accounting System
            </p>
            <p className="mt-1 text-sm text-purple-300">
              Sign in with Internet Identity to continue
            </p>
          </div>
          <div className="dark-card rounded-lg p-8 shadow-2xl backdrop-blur">
            <Login />
          </div>
          <div className="text-center text-xs text-purple-400">
            <p>Powered by Juno • Built for Nigerian Schools</p>
          </div>
        </div>
      </div>
    );
  }

  // User is authenticated, show dashboard with logout button
  return (
    <div className="relative">
      {children}
      <div className="fixed top-4 right-20 z-50">
        <Logout />
      </div>
    </div>
  );
};
