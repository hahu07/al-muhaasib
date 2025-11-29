"use client";

import {
  onAuthStateChange,
  signOut as junoSignOut,
  type User,
} from "@junobuild/core";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { AppUser, UserRole } from "@/types";
import {
  getUserProfile,
  createUserProfile,
  userService,
} from "@/services/userService";

interface AuthContextType {
  user: User | undefined | null;
  appUser: AppUser | undefined | null;
  loading: boolean;
  hasRole: (role: UserRole) => boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  isSuperAdmin: boolean;
  isBursar: boolean;
  isAccountant: boolean;
  isAuditor: boolean;
  canManageUsers: boolean;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: undefined,
  appUser: undefined,
  loading: true,
  hasRole: () => false,
  hasPermission: () => false,
  hasAnyPermission: () => false,
  hasAllPermissions: () => false,
  isSuperAdmin: false,
  isBursar: false,
  isAccountant: false,
  isAuditor: false,
  canManageUsers: false,
  signOut: () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | undefined | null>(undefined);
  const [appUser, setAppUser] = useState<AppUser | undefined | null>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sub = onAuthStateChange(async (authUser) => {
      setUser(authUser);

      if (authUser) {
        try {
          // Try to get existing user profile
          let userProfile = await getUserProfile(authUser.key);

          // If no profile exists, check if this is the first user
          if (!userProfile) {
            console.log("No user profile found, checking if first user...");

            // Check if any users exist in the system
            const allUsers = await userService.list();
            const isFirstUser = allUsers.length === 0;

            // First user should be super_admin, others should go through proper setup
            const defaultRole: UserRole = isFirstUser
              ? "super_admin"
              : "accountant";

            console.log(
              `Creating ${isFirstUser ? "FIRST USER (super_admin)" : "new user (accountant)"} profile`,
            );

            userProfile = await createUserProfile({
              internetIdentityId: authUser.key,
              surname: isFirstUser ? "Admin" : "User",
              firstname: isFirstUser ? "System" : "New",
              email: "",
              role: defaultRole,
              isActive: true,
              permissions: getDefaultPermissions(defaultRole),
            });
          } else {
            console.log(
              "User profile loaded:",
              userProfile.role,
              userProfile.permissions?.length,
              "permissions",
            );
          }

          setAppUser(userProfile);
        } catch (error) {
          console.error("Error loading user profile:", error);
          console.error("Error details:", error);
          setAppUser(null);
        }
      } else {
        setAppUser(null);
      }

      setLoading(false);
    });

    return () => {
      sub();
    };
  }, []);

  const hasRole = (role: UserRole): boolean => {
    return appUser?.role === role;
  };

  const hasPermission = (permission: string): boolean => {
    return appUser?.permissions.includes(permission) || false;
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some((p) => appUser?.permissions.includes(p)) || false;
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every((p) => appUser?.permissions.includes(p)) || false;
  };

  const isSuperAdmin = appUser?.role === "super_admin";
  const isBursar = appUser?.role === "bursar";
  const isAccountant = appUser?.role === "accountant";
  const isAuditor = appUser?.role === "auditor";
  const canManageUsers = hasPermission("users.manage_roles");

  const signOut = async () => {
    try {
      // Clear local state first
      setUser(null);
      setAppUser(null);

      // Call Juno's sign out to clear Internet Identity session
      await junoSignOut();

      // Redirect to home page after sign out
      window.location.href = "/";
    } catch (error) {
      console.error("Error signing out:", error);
      // Even if there's an error, try to redirect
      window.location.href = "/";
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        appUser,
        loading,
        hasRole,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        isSuperAdmin,
        isBursar,
        isAccountant,
        isAuditor,
        canManageUsers,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Helper function to get default permissions based on role
function getDefaultPermissions(role: UserRole): string[] {
  switch (role) {
    case "super_admin":
      return [
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
        "scholarships.view",
        "scholarships.create",
        "scholarships.edit",
        "scholarships.delete",
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
      ];
    case "bursar":
      return [
        "users.view",
        "students.view",
        "students.create",
        "students.edit",
        "fees.view",
        "fees.create",
        "fees.edit",
        "fees.delete",
        "payments.view",
        "payments.create",
        "payments.edit",
        "payments.reverse",
        "scholarships.view",
        "scholarships.create",
        "scholarships.edit",
        "scholarships.delete",
        "expenses.view",
        "expenses.create",
        "expenses.edit",
        "expenses.approve",
        "staff.view",
        "staff.edit",
        "staff.process_salary",
        "staff.approve_salary",
        "assets.view",
        "assets.create",
        "assets.edit",
        "assets.depreciate",
        "assets.dispose",
        "accounting.view",
        "accounting.create_entries",
        "accounting.post_entries",
        "accounting.manage_coa",
        "reports.view",
        "reports.financial",
        "reports.export",
        "settings.view",
        "settings.edit_school",
      ];
    case "accountant":
      return [
        "students.view",
        "students.create",
        "students.edit",
        "fees.view",
        "fees.create",
        "fees.edit",
        "payments.view",
        "payments.create",
        "payments.edit",
        "scholarships.view",
        "scholarships.create",
        "scholarships.edit",
        "scholarships.delete",
        "expenses.view",
        "expenses.create",
        "expenses.edit",
        "staff.view",
        "staff.process_salary",
        "assets.view",
        "assets.create",
        "assets.edit",
        "assets.depreciate",
        "accounting.view",
        "accounting.create_entries",
        "accounting.post_entries",
        "reports.view",
        "reports.financial",
        "reports.export",
        "settings.view",
      ];
    case "auditor":
      return [
        "students.view",
        "fees.view",
        "payments.view",
        "expenses.view",
        "scholarships.view",
        "staff.view",
        "assets.view",
        "accounting.view",
        "reports.view",
        "reports.financial",
        "reports.audit",
        "reports.export",
        "settings.view",
      ];
    case "data_entry":
      return [
        "students.view",
        "students.create",
        "payments.view",
        "payments.create",
        "expenses.view",
        "scholarships.view",
        "expenses.create",
        "reports.view",
      ];
    default:
      return ["students.view", "payments.view", "reports.view"];
  }
}
