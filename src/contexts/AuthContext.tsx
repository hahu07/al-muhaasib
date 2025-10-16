"use client";

import { onAuthStateChange, type User } from "@junobuild/core";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { AppUser, UserRole } from "@/types";
import { getUserProfile, createUserProfile } from "@/services/userService";

interface AuthContextType {
  user: User | undefined | null;
  appUser: AppUser | undefined | null;
  loading: boolean;
  hasRole: (role: UserRole) => boolean;
  hasPermission: (permission: string) => boolean;
  isAdmin: boolean;
  isAccounting: boolean;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: undefined,
  appUser: undefined,
  loading: true,
  hasRole: () => false,
  hasPermission: () => false,
  isAdmin: false,
  isAccounting: false,
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
          
          // If no profile exists, create a default one
          if (!userProfile) {
            userProfile = await createUserProfile({
              internetIdentityId: authUser.key,
              surname: "User", // Default - should be updated by user
              firstname: "New", // Default - should be updated by user
              email: "", // Should be updated by user
              role: "accounting", // Default role - admin can change this
              isActive: true,
              permissions: getDefaultPermissions("accounting"),
            });
          }
          
          setAppUser(userProfile);
        } catch (error) {
          console.error("Error loading user profile:", error);
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

  const isAdmin = appUser?.role === "admin";
  const isAccounting = appUser?.role === "accounting";

  const signOut = () => {
    // The actual sign out will be handled by the Juno auth system
    setUser(null);
    setAppUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        appUser,
        loading,
        hasRole,
        hasPermission,
        isAdmin,
        isAccounting,
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
    case "admin":
      return [
        "users.read",
        "users.write",
        "students.read",
        "students.write",
        "transactions.read", 
        "transactions.write",
        "reports.read",
        "system.read",
        "system.write",
      ];
    case "accounting":
      return [
        "students.read",
        "students.write", 
        "transactions.read",
        "transactions.write",
        "reports.read",
      ];
    default:
      return ["students.read", "transactions.read"];
  }
}