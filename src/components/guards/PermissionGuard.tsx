"use client";

import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface PermissionGuardProps {
  children: ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean; // If true, requires all permissions; if false, requires any
  fallback?: ReactNode;
}

/**
 * PermissionGuard Component
 * Conditionally renders children based on user permissions
 *
 * Usage:
 * <PermissionGuard permission="users.edit">
 *   <Button>Edit User</Button>
 * </PermissionGuard>
 *
 * <PermissionGuard permissions={["users.edit", "users.delete"]} requireAll={false}>
 *   <Button>Manage User</Button>
 * </PermissionGuard>
 */
export function PermissionGuard({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback = null,
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useAuth();

  // Check single permission
  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>;
  }

  // Check multiple permissions
  if (permissions) {
    const hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);

    if (!hasAccess) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}

interface RoleGuardProps {
  children: ReactNode;
  roles: string[];
  fallback?: ReactNode;
}

/**
 * RoleGuard Component
 * Conditionally renders children based on user role
 */
export function RoleGuard({
  children,
  roles,
  fallback = null,
}: RoleGuardProps) {
  const { appUser } = useAuth();

  if (!appUser || !roles.includes(appUser.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
