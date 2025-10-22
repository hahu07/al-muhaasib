import { BaseDataService, COLLECTIONS } from "./dataService";
import type { AppUser, UserRole } from "@/types";

export class UserService extends BaseDataService<AppUser> {
  constructor() {
    super(COLLECTIONS.USERS);
  }

  async getUserByInternetIdentityId(
    internetIdentityId: string,
  ): Promise<AppUser | null> {
    const users = await this.list();
    return (
      users.find((user) => user.internetIdentityId === internetIdentityId) ||
      null
    );
  }

  async updateUserRole(userId: string, role: UserRole): Promise<AppUser> {
    const permissions = getDefaultPermissions(role);
    return this.update(userId, { role, permissions });
  }

  async updateUserProfile(
    userId: string,
    updates: Partial<
      Pick<AppUser, "firstname" | "surname" | "email" | "role" | "isActive">
    >,
  ): Promise<AppUser> {
    return this.update(userId, updates);
  }

  async deactivateUser(userId: string): Promise<AppUser> {
    return this.update(userId, { isActive: false });
  }

  async activateUser(userId: string): Promise<AppUser> {
    return this.update(userId, { isActive: true });
  }

  async updateLastLogin(userId: string): Promise<AppUser> {
    const nowNanos = BigInt(Date.now()) * BigInt(1_000_000);
    return this.update(userId, {
      lastLogin: nowNanos as unknown as AppUser["lastLogin"],
    });
  }

  async getActiveUsers(): Promise<AppUser[]> {
    const users = await this.list();
    return users.filter((user) => user.isActive);
  }

  async getUsersByRole(role: UserRole): Promise<AppUser[]> {
    const users = await this.list();
    return users.filter((user) => user.role === role && user.isActive);
  }

  async addPermissions(
    userId: string,
    permissions: string[],
  ): Promise<AppUser> {
    const user = await this.getById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    const updatedPermissions = Array.from(
      new Set([...user.permissions, ...permissions]),
    );
    return this.update(userId, { permissions: updatedPermissions });
  }

  async removePermissions(
    userId: string,
    permissions: string[],
  ): Promise<AppUser> {
    const user = await this.getById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    const updatedPermissions = user.permissions.filter(
      (p) => !permissions.includes(p),
    );
    return this.update(userId, { permissions: updatedPermissions });
  }

  async setPermissions(
    userId: string,
    permissions: string[],
  ): Promise<AppUser> {
    return this.update(userId, { permissions });
  }

  async hasPermission(userId: string, permission: string): Promise<boolean> {
    const user = await this.getById(userId);
    return user ? user.permissions.includes(permission) : false;
  }

  async resetPermissionsToDefault(userId: string): Promise<AppUser> {
    const user = await this.getById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    const defaultPermissions = getDefaultPermissions(user.role);
    return this.update(userId, { permissions: defaultPermissions });
  }
}

// Helper functions
function getDefaultPermissions(role: UserRole): string[] {
  switch (role) {
    case "super_admin":
      // Full system access - all permissions
      return [
        // User Management
        "users.view",
        "users.create",
        "users.edit",
        "users.delete",
        "users.manage_roles",
        // Student Management
        "students.view",
        "students.create",
        "students.edit",
        "students.delete",
        // Fee Management
        "fees.view",
        "fees.create",
        "fees.edit",
        "fees.delete",
        // Payment Management
        "payments.view",
        "payments.create",
        "payments.edit",
        "payments.delete",
        "payments.reverse",
        // Expense Management
        "expenses.view",
        "expenses.create",
        "expenses.edit",
        "expenses.delete",
        "expenses.approve",
        // Staff Management
        "staff.view",
        "staff.create",
        "staff.edit",
        "staff.delete",
        "staff.process_salary",
        "staff.approve_salary",
        // Asset Management
        "assets.view",
        "assets.create",
        "assets.edit",
        "assets.delete",
        "assets.depreciate",
        "assets.dispose",
        // Accounting
        "accounting.view",
        "accounting.create_entries",
        "accounting.post_entries",
        "accounting.reverse_entries",
        "accounting.manage_coa",
        // Reports
        "reports.view",
        "reports.financial",
        "reports.export",
        "reports.audit",
        // Settings
        "settings.view",
        "settings.edit_school",
        "settings.edit_system",
        "settings.backup",
      ];

    case "bursar":
      // Financial head - full financial operations
      return [
        // User Management (limited)
        "users.view",
        // Student Management
        "students.view",
        "students.create",
        "students.edit",
        // Fee Management
        "fees.view",
        "fees.create",
        "fees.edit",
        "fees.delete",
        // Payment Management
        "payments.view",
        "payments.create",
        "payments.edit",
        "payments.reverse",
        // Expense Management
        "expenses.view",
        "expenses.create",
        "expenses.edit",
        "expenses.approve",
        // Staff Management
        "staff.view",
        "staff.edit",
        "staff.process_salary",
        "staff.approve_salary",
        // Asset Management
        "assets.view",
        "assets.create",
        "assets.edit",
        "assets.depreciate",
        "assets.dispose",
        // Accounting
        "accounting.view",
        "accounting.create_entries",
        "accounting.post_entries",
        "accounting.manage_coa",
        // Reports
        "reports.view",
        "reports.financial",
        "reports.export",
        // Settings
        "settings.view",
        "settings.edit_school",
      ];

    case "accountant":
      // Accounting staff - most financial operations
      return [
        // Student Management
        "students.view",
        "students.create",
        "students.edit",
        // Fee Management
        "fees.view",
        "fees.create",
        "fees.edit",
        // Payment Management
        "payments.view",
        "payments.create",
        "payments.edit",
        // Expense Management
        "expenses.view",
        "expenses.create",
        "expenses.edit",
        // Staff Management
        "staff.view",
        "staff.process_salary",
        // Asset Management
        "assets.view",
        "assets.create",
        "assets.edit",
        "assets.depreciate",
        // Accounting
        "accounting.view",
        "accounting.create_entries",
        "accounting.post_entries",
        // Reports
        "reports.view",
        "reports.financial",
        "reports.export",
        // Settings
        "settings.view",
      ];

    case "auditor":
      // Read-only access for auditing
      return [
        "students.view",
        "fees.view",
        "payments.view",
        "expenses.view",
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
      // Limited access for data entry only
      return [
        "students.view",
        "students.create",
        "payments.view",
        "payments.create",
        "expenses.view",
        "expenses.create",
        "reports.view",
      ];

    default:
      return ["students.view", "payments.view", "reports.view"];
  }
}

// Create service instance
export const userService = new UserService();

// Convenience functions for the auth context
export const getUserProfile = async (
  internetIdentityId: string,
): Promise<AppUser | null> => {
  return userService.getUserByInternetIdentityId(internetIdentityId);
};

export const createUserProfile = async (
  data: Omit<AppUser, "id" | "createdAt" | "updatedAt">,
): Promise<AppUser> => {
  return userService.create(data);
};

export const updateUserProfile = async (
  userId: string,
  updates: Partial<
    Pick<AppUser, "firstname" | "surname" | "email" | "role" | "isActive">
  >,
): Promise<AppUser> => {
  return userService.updateUserProfile(userId, updates);
};
