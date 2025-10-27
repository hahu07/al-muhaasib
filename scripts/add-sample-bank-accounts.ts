#!/usr/bin/env tsx
/**
 * Add sample bank accounts to the Chart of Accounts
 * 
 * This script creates realistic bank accounts that will appear
 * in both the Accounting module and the Banking dashboard.
 * 
 * Usage: npx tsx scripts/add-sample-bank-accounts.ts
 */

import { initSatellite } from "@junobuild/core";
import { bankAccountService } from "../src/services/accountingService";

// Initialize Juno
const SATELLITE_ID = process.env.NEXT_PUBLIC_SATELLITE_ID || "pjgun-3iaaa-aaaal-ajrya-cai";

async function initJuno() {
  await initSatellite({
    satelliteId: SATELLITE_ID,
  });
  console.log("✅ Juno initialized\n");
}

async function addSampleBankAccounts() {
  // Initialize Juno first
  await initJuno();
  
  console.log("🏦 Adding sample bank accounts...\n");

  const sampleBankAccounts = [
    {
      bankName: "Guaranty Trust Bank (GTBank)",
      accountName: "GTBank - School Current Account",
      accountNumber: "0123456789",
      accountType: "current" as const,
      balance: 5000000, // ₦5,000,000 opening balance
      isActive: true,
    },
    {
      bankName: "First Bank of Nigeria",
      accountName: "First Bank - Savings Account",
      accountNumber: "2011234567",
      accountType: "savings" as const,
      balance: 2500000, // ₦2,500,000 opening balance
      isActive: true,
    },
    {
      bankName: "Access Bank Plc",
      accountName: "Access Bank - Current Account",
      accountNumber: "0987654321",
      accountType: "current" as const,
      balance: 3000000, // ₦3,000,000 opening balance
      isActive: true,
    },
    {
      bankName: "Zenith Bank Plc",
      accountName: "Zenith Bank - Corporate Account",
      accountNumber: "1234567890",
      accountType: "current" as const,
      balance: 7500000, // ₦7,500,000 opening balance
      isActive: true,
    },
    {
      bankName: "Petty Cash",
      accountName: "Petty Cash - School Office",
      accountNumber: "N/A",
      accountType: "savings" as const,
      balance: 50000, // ₦50,000
      isActive: true,
    },
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const account of sampleBankAccounts) {
    try {
      const created = await bankAccountService.create(account);
      console.log(`✅ Created: ${account.accountName}`);
      console.log(`   Bank: ${account.bankName}`);
      console.log(`   Account #: ${account.accountNumber}`);
      console.log(`   Type: ${account.accountType}`);
      console.log(`   Opening Balance: ₦${account.balance.toLocaleString()}\n`);
      successCount++;
    } catch (error: any) {
      console.error(`❌ Failed to create ${account.accountName}:`, error.message, "\n");
      errorCount++;
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`✅ Successfully created: ${successCount} accounts`);
  if (errorCount > 0) {
    console.log(`❌ Failed: ${errorCount} accounts`);
  }
  console.log("=".repeat(60));
  console.log("\n💡 Tip: Visit the Banking dashboard to see these accounts!");
  console.log("   URL: http://localhost:3001/dashboard/banking\n");
}

// Run the script
addSampleBankAccounts().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
