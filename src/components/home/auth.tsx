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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold gradient-text mb-2">Al-Muhaasib</h2>
          <p className="text-blue-300">Loading your account...</p>
        </div>
      </div>
    );
  }

  // Show login screen if no user
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mb-6">
              <span className="text-white font-bold text-2xl">₦</span>
            </div>
            <h2 className="text-4xl font-extrabold gradient-text mb-3">
              Al-Muhaasib
            </h2>
            <p className="mt-2 text-xl font-medium text-blue-300 mb-2">
              School Management Accounting System
            </p>
            <p className="mt-1 text-sm text-purple-300">
              Sign in with Internet Identity to continue
            </p>
          </div>
          <div className="dark-card rounded-lg shadow-2xl p-8 backdrop-blur">
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
