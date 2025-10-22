/**
 * Permission Hook
 * Helper hook for checking permissions throughout the app
 */

import { useAuth } from "@/contexts/AuthContext";

export function usePermission() {
  const { hasPermission, hasAnyPermission, hasAllPermissions, appUser } =
    useAuth();

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canView: (resource: string) => hasPermission(`${resource}.view`),
    canCreate: (resource: string) => hasPermission(`${resource}.create`),
    canEdit: (resource: string) => hasPermission(`${resource}.edit`),
    canDelete: (resource: string) => hasPermission(`${resource}.delete`),
    userRole: appUser?.role,
    userPermissions: appUser?.permissions || [],
  };
}
