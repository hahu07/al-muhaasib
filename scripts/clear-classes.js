#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Script to clear all existing classes from the database
 *
 * Usage: node scripts/clear-classes.js
 *
 * This script will remove all classes from your Juno database.
 * Use with caution in production!
 */

const { initJuno, listDocs, deleteDoc } = require("@junobuild/core-peer");

async function clearAllClasses() {
  try {
    console.log("🔄 Initializing Juno...");

    // Initialize Juno with your satellite ID
    // You may need to update this with your actual satellite ID
    await initJuno({
      satelliteId: process.env.JUNO_SATELLITE_ID || "your-satellite-id-here",
    });

    console.log("📋 Fetching existing classes...");

    // List all documents in the 'classes' collection
    const { items: classes } = await listDocs({
      collection: "classes",
      filter: {},
    });

    if (classes.length === 0) {
      console.log("✅ No classes found to delete.");
      return;
    }

    console.log(`📝 Found ${classes.length} classes to delete:`);
    classes.forEach((cls, index) => {
      const data = cls.data;
      console.log(
        `  ${index + 1}. ${data.name}${data.section ? ` ${data.section}` : ""} (${data.level})`,
      );
    });

    console.log("\n🗑️  Deleting classes...");

    // Delete each class
    for (let i = 0; i < classes.length; i++) {
      const cls = classes[i];
      const data = cls.data;

      try {
        await deleteDoc({
          collection: "classes",
          doc: cls,
        });
        console.log(
          `✅ Deleted: ${data.name}${data.section ? ` ${data.section}` : ""}`,
        );
      } catch (error) {
        console.error(
          `❌ Failed to delete ${data.name}${data.section ? ` ${data.section}` : ""}:`,
          error.message,
        );
      }
    }

    console.log(`\n🎉 Successfully deleted ${classes.length} classes!`);
    console.log(
      "💡 You can now create fresh classes using the Class Management interface.",
    );
  } catch (error) {
    console.error("❌ Error clearing classes:", error);

    if (error.message.includes("satellite")) {
      console.log(
        "\n💡 Tip: Make sure your JUNO_SATELLITE_ID environment variable is set correctly.",
      );
      console.log("You can find your satellite ID in your Juno console.");
    }

    process.exit(1);
  }
}

// Run the script
clearAllClasses();
