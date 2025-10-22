/**
 * Setup Service
 * Checks if the system needs initial setup
 */

import { listDocs } from "@junobuild/core";

const USERS_COLLECTION = "users";

export class SetupService {
  /**
   * Check if the system needs initial setup
   * Returns true if no super_admin exists
   */
  async needsSetup(): Promise<boolean> {
    try {
      // Check if any super_admin exists
      const users = await listDocs({
        collection: USERS_COLLECTION,
        filter: {},
      });

      const hasSuperAdmin = users.items.some((doc) => {
        const data = doc.data as Record<string, unknown>;
        return data.role === "super_admin";
      });

      return !hasSuperAdmin;
    } catch (error) {
      console.error("Error checking setup status:", error);
      // If there's an error, assume setup is needed to be safe
      return true;
    }
  }

  /**
   * Check if setup is complete
   * Returns true if at least one super_admin exists
   */
  async isSetupComplete(): Promise<boolean> {
    const needsSetup = await this.needsSetup();
    return !needsSetup;
  }
}

// Export singleton instance
export const setupService = new SetupService();
