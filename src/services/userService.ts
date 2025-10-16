import { BaseDataService, COLLECTIONS } from './dataService';
import type { AppUser, UserRole } from '@/types';

export class UserService extends BaseDataService<AppUser> {
  constructor() {
    super(COLLECTIONS.USERS);
  }

  async getUserByInternetIdentityId(internetIdentityId: string): Promise<AppUser | null> {
    const users = await this.list();
    return users.find(user => user.internetIdentityId === internetIdentityId) || null;
  }

  async updateUserRole(userId: string, role: UserRole): Promise<AppUser> {
    const permissions = getDefaultPermissions(role);
    return this.update(userId, { role, permissions });
  }

  async updateUserProfile(userId: string, updates: Partial<Pick<AppUser, 'name' | 'email'>>): Promise<AppUser> {
    return this.update(userId, updates);
  }

  async deactivateUser(userId: string): Promise<AppUser> {
    return this.update(userId, { isActive: false });
  }

  async activateUser(userId: string): Promise<AppUser> {
    return this.update(userId, { isActive: true });
  }

  async updateLastLogin(userId: string): Promise<AppUser> {
    return this.update(userId, { lastLogin: new Date() });
  }

  async getActiveUsers(): Promise<AppUser[]> {
    const users = await this.list();
    return users.filter(user => user.isActive);
  }

  async getUsersByRole(role: UserRole): Promise<AppUser[]> {
    const users = await this.list();
    return users.filter(user => user.role === role && user.isActive);
  }
}

// Helper functions
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

// Create service instance
export const userService = new UserService();

// Convenience functions for the auth context
export const getUserProfile = async (internetIdentityId: string): Promise<AppUser | null> => {
  return userService.getUserByInternetIdentityId(internetIdentityId);
};

export const createUserProfile = async (data: Omit<AppUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<AppUser> => {
  return userService.create(data);
};