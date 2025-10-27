#!/usr/bin/env tsx
/**
 * Update existing users with banking permissions
 * 
 * Run this script to add banking permissions to all existing users
 * based on their current role.
 * 
 * Usage: npx tsx scripts/update-user-banking-permissions.ts
 */

import { userService } from "../src/services/userService";

async function updateUserBankingPermissions() {
  console.log("🔄 Fetching all users...\n");
  
  const users = await userService.list();
  console.log(`Found ${users.length} users\n`);
  
  for (const user of users) {
    console.log(`Updating ${user.firstname} ${user.surname} (${user.role})...`);
    
    try {
      // Reset permissions to default (which now includes banking)
      await userService.resetPermissionsToDefault(user.id);
      console.log(`✅ Updated permissions for ${user.firstname} ${user.surname}\n`);
    } catch (error) {
      console.error(`❌ Failed to update ${user.firstname} ${user.surname}:`, error);
    }
  }
  
  console.log("✅ All users updated successfully!");
}

// Run the script
updateUserBankingPermissions().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
