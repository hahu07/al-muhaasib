/**
 * Development Script: Reset Database
 *
 * WARNING: This will delete ALL data from your Juno satellite!
 * Use this to simulate a fresh school setup during development.
 *
 * Usage:
 * 1. Make sure you're signed in to Juno
 * 2. Run: npx ts-node scripts/reset-dev-data.ts
 */

import { initJuno, listDocs, deleteDoc } from "@junobuild/core";

const COLLECTIONS = [
  "users",
  "school_config",
  "students",
  "classes",
  "fees",
  "fee_assignments",
  "payments",
  "expenses",
  "expense_categories",
  "staff",
  "salary_payments",
  "assets",
  "chart_of_accounts",
  "journal_entries",
  "bank_accounts",
];

async function resetDatabase() {
  console.log("🚨 WARNING: This will delete ALL data!");
  console.log("Collections to clear:", COLLECTIONS.join(", "));
  console.log("\nWaiting 5 seconds... Press Ctrl+C to cancel");

  await new Promise((resolve) => setTimeout(resolve, 5000));

  console.log("\n🗑️  Starting database reset...\n");

  try {
    // Initialize Juno
    await initJuno({
      satelliteId: process.env.NEXT_PUBLIC_SATELLITE_ID || "",
    });

    for (const collection of COLLECTIONS) {
      console.log(`Clearing ${collection}...`);

      try {
        const docs = await listDocs({ collection });

        for (const doc of docs.items) {
          await deleteDoc({
            collection,
            doc: doc,
          });
        }

        console.log(`✓ Cleared ${docs.items.length} items from ${collection}`);
      } catch (error) {
        console.log(`⚠️  Could not clear ${collection}:`, error);
      }
    }

    console.log("\n✅ Database reset complete!");
    console.log("\nNext steps:");
    console.log("1. Sign out of the app");
    console.log("2. Sign in again");
    console.log("3. You'll see the setup wizard for a fresh school");
  } catch (error) {
    console.error("❌ Error resetting database:", error);
  }
}

// Run the reset
resetDatabase();
