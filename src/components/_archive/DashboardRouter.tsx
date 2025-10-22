"use client";

import { useAuth } from "@/contexts/AuthContext";
import { AccountingDashboard } from "@/components/dashboards/AccountingDashboard";
import { AdminDashboard } from "@/components/dashboards/AdminDashboard";
import { Button } from "@/components/ui/button";
import { ShieldIcon, AlertTriangleIcon, RefreshCwIcon } from "lucide-react";

export function DashboardRouter() {
  const { appUser, loading, isSuperAdmin, isBursar } = useAuth();

  // Loading state
  if (loading) {
    return <DashboardLoadingState />;
  }

  // No user found
  if (!appUser) {
    return <NoUserState />;
  }

  // Inactive user
  if (!appUser.isActive) {
    return <InactiveUserState user={appUser} />;
  }

  // Route to appropriate dashboard based on role
  // Super admins and bursars see the admin dashboard
  if (isSuperAdmin || isBursar) {
    return <AdminDashboard />;
  }

  // All other roles see the accounting dashboard
  return <AccountingDashboard />;
}

// Loading state component
function DashboardLoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <RefreshCwIcon className="mx-auto mb-4 h-12 w-12 animate-spin text-blue-600" />
        <h2 className="mb-2 text-xl font-semibold text-gray-900">
          Loading Dashboard
        </h2>
        <p className="text-gray-600">
          Preparing your Al-Muhaasib experience...
        </p>
      </div>
    </div>
  );
}

// No user state
function NoUserState() {
  const handleCreateAdmin = async () => {
    try {
      // Import dynamically to avoid circular dependencies
      const { createUserProfile } = await import("@/services/userService");
      const { authSubscribe } = await import("@junobuild/core");

      // Get current user
      const unsubscribe = authSubscribe((user) => {
        if (user) {
          createUserProfile({
            internetIdentityId: user.key,
            surname: "Admin",
            firstname: "User",
            email: "",
            role: "super_admin",
            isActive: true,
            permissions: [
              "users.view",
              "users.create",
              "users.edit",
              "users.delete",
              "users.manage_roles",
              "students.view",
              "students.create",
              "students.edit",
              "students.delete",
              "fees.view",
              "fees.create",
              "fees.edit",
              "fees.delete",
              "payments.view",
              "payments.create",
              "payments.edit",
              "payments.delete",
              "payments.reverse",
              "expenses.view",
              "expenses.create",
              "expenses.edit",
              "expenses.delete",
              "expenses.approve",
              "staff.view",
              "staff.create",
              "staff.edit",
              "staff.delete",
              "staff.process_salary",
              "staff.approve_salary",
              "assets.view",
              "assets.create",
              "assets.edit",
              "assets.delete",
              "assets.depreciate",
              "assets.dispose",
              "accounting.view",
              "accounting.create_entries",
              "accounting.post_entries",
              "accounting.reverse_entries",
              "accounting.manage_coa",
              "reports.view",
              "reports.financial",
              "reports.export",
              "reports.audit",
              "settings.view",
              "settings.edit_school",
              "settings.edit_system",
              "settings.backup",
            ],
          })
            .then(() => {
              window.location.reload();
            })
            .catch((error) => {
              console.error("Failed to create admin user:", error);
              alert(
                "Failed to create admin account. Check console for details.",
              );
            });
        }
        unsubscribe();
      });
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Check console for details.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="max-w-md text-center">
        <AlertTriangleIcon className="mx-auto mb-4 h-12 w-12 text-yellow-500" />
        <h2 className="mb-2 text-xl font-semibold">Account Setup Required</h2>
        <p className="mb-4">
          This is your first time signing in. Your user profile needs to be
          created.
        </p>
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-left">
          <p className="mb-2 text-sm font-semibold text-blue-800">
            First-time Setup:
          </p>
          <ol className="list-inside list-decimal space-y-1 text-sm text-blue-700">
            <li>Click &quot;Create Admin Account&quot; below</li>
            <li>You&apos;ll be set up as the system administrator</li>
            <li>You can then create other user accounts</li>
          </ol>
        </div>
        <div className="space-y-3">
          <Button onClick={handleCreateAdmin} className="w-full">
            Create Admin Account
          </Button>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="w-full"
          >
            Try Again
          </Button>
          <p className="text-xs text-gray-500">
            Note: Make sure your Juno satellite is properly configured
          </p>
        </div>
      </div>
    </div>
  );
}

// Inactive user state
function InactiveUserState({
  user,
}: {
  user: {
    surname?: string;
    firstname?: string;
    email: string;
    role: string;
    lastLogin?: Date;
  };
}) {
  const fullName =
    user.firstname && user.surname
      ? `${user.firstname} ${user.surname}`
      : "User";

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="max-w-md text-center">
        <ShieldIcon className="mx-auto mb-4 h-12 w-12 text-yellow-500" />
        <h2 className="mb-2 text-xl font-semibold text-gray-900">
          Account Inactive
        </h2>
        <p className="mb-4 text-gray-600">
          Hello {fullName}, your account has been deactivated.
        </p>
        <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            Please contact your system administrator to reactivate your account
            and regain access to Al-Muhaasib.
          </p>
        </div>
        <div className="space-y-2 text-xs text-gray-500">
          <p>Account: {user.email}</p>
          <p>Role: {user.role}</p>
          <p>
            Last Login:{" "}
            {user.lastLogin
              ? new Date(user.lastLogin).toLocaleDateString()
              : "Never"}
          </p>
        </div>
      </div>
    </div>
  );
}

// Unknown role state
function UnknownRoleState({
  user,
}: {
  user: { surname?: string; firstname?: string; role?: string };
}) {
  const fullName =
    user.firstname && user.surname
      ? `${user.firstname} ${user.surname}`
      : "User";

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="max-w-md text-center">
        <AlertTriangleIcon className="mx-auto mb-4 h-12 w-12 text-orange-500" />
        <h2 className="mb-2 text-xl font-semibold text-gray-900">
          Unknown User Role
        </h2>
        <p className="mb-4 text-gray-600">
          Hello {fullName}, your account role is not recognized.
        </p>
        <div className="mb-6 rounded-lg border border-orange-200 bg-orange-50 p-4">
          <p className="mb-2 text-sm text-orange-800">
            Your current role: <strong>{user.role || "undefined"}</strong>
          </p>
          <p className="text-sm text-orange-800">
            Please contact your administrator to update your role to a valid
            accounting role.
          </p>
        </div>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          className="w-full"
        >
          Refresh Dashboard
        </Button>
      </div>
    </div>
  );
}
