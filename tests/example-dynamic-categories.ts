#!/usr/bin/env tsx

/**
 * Example script demonstrating dynamic expense category creation
 * This shows how to use the enhanced expense category system
 */

import { expenseCategoryService, expenseService } from "./src/services";

async function demonstrateDynamicCategories() {
  console.log("🚀 Dynamic Expense Categories Demo");
  console.log("=====================================\n");

  try {
    // 1. Initialize default categories
    console.log("1. Initializing default categories...");
    await expenseCategoryService.initializeDefaultCategories();
    console.log("✅ Default categories initialized\n");

    // 2. Create custom categories
    console.log("2. Creating custom expense categories...");

    // Create a marketing category
    const marketingCategory = await expenseCategoryService.createCategory({
      name: "Digital Marketing",
      category: "marketing_expenses", // Custom category
      description:
        "Online advertising, social media marketing, and digital campaigns",
      budgetCode: "MKT-001",
    });
    console.log(
      `✅ Created: ${marketingCategory.name} (${marketingCategory.category})`,
    );

    // Create a professional development category
    const profDevCategory = await expenseCategoryService.createCategory({
      name: "Professional Development",
      category: "conference_fees", // Custom category
      description:
        "Conference attendance, certification fees, and training programs",
    });
    console.log(
      `✅ Created: ${profDevCategory.name} (${profDevCategory.category})`,
    );

    // Create an event category
    const eventCategory = await expenseCategoryService.createCategory({
      name: "School Events",
      category: "event_management", // Custom category
      description: "Graduation ceremonies, sports day, cultural events",
      budgetCode: "EVT-001",
    });
    console.log(
      `✅ Created: ${eventCategory.name} (${eventCategory.category})\n`,
    );

    // 3. List all categories
    console.log("3. Listing all active categories...");
    const categories = await expenseCategoryService.getActiveCategories();
    console.log(`📋 Total active categories: ${categories.length}`);

    // Group by type
    const groupedCategories = categories.reduce(
      (acc, cat) => {
        const predefinedCategories = expenseCategoryService
          .getPredefinedCategories()
          .map((c) => c.value);
        const type = predefinedCategories.includes(cat.category)
          ? "Predefined"
          : "Custom";

        if (!acc[type]) acc[type] = [];
        acc[type].push(cat);
        return acc;
      },
      {} as Record<string, typeof categories>,
    );

    Object.entries(groupedCategories).forEach(([type, cats]) => {
      console.log(`\n${type} Categories (${cats.length}):`);
      cats.forEach((cat) => {
        console.log(
          `  • ${cat.name} - ${cat.category} ${cat.budgetCode ? `[${cat.budgetCode}]` : ""}`,
        );
      });
    });

    // 4. Create sample expenses using both predefined and custom categories
    console.log("\n4. Creating sample expenses...");

    // Expense with predefined category
    const utilitiesCategory = categories.find(
      (c) => c.category === "utilities",
    );
    if (utilitiesCategory) {
      const expenseA = await expenseService.createExpense({
        categoryId: utilitiesCategory.id,
        categoryName: utilitiesCategory.name,
        category: utilitiesCategory.category,
        amount: 15000,
        description: "Monthly electricity bill",
        paymentMethod: "bank_transfer",
        paymentDate: new Date().toISOString().split("T")[0],
        vendorName: "Power Company Ltd",
        recordedBy: "admin-user-id",
      });
      console.log(
        `💰 Created expense: ${expenseA.description} - ₦${expenseA.amount.toLocaleString()}`,
      );
    }

    // Expense with custom category
    const marketingExpense = await expenseService.createExpense({
      categoryId: marketingCategory.id,
      categoryName: marketingCategory.name,
      category: marketingCategory.category,
      amount: 50000,
      description: "Facebook and Google Ads campaign for new enrollment",
      paymentMethod: "pos",
      paymentDate: new Date().toISOString().split("T")[0],
      vendorName: "Digital Marketing Agency",
      purpose: "Student recruitment campaign",
      recordedBy: "admin-user-id",
    });
    console.log(
      `💰 Created expense: ${marketingExpense.description} - ₦${marketingExpense.amount.toLocaleString()}`,
    );

    // 5. Demonstrate category management
    console.log("\n5. Category management operations...");

    // Update a category
    const updatedCategory = await expenseCategoryService.updateCategory(
      eventCategory.id,
      {
        description:
          "Updated: All school events including graduations, sports, and cultural activities",
        budgetCode: "EVT-002",
      },
    );
    console.log(
      `🔄 Updated category: ${updatedCategory.name} - New budget code: ${updatedCategory.budgetCode}`,
    );

    // Deactivate a category (soft delete)
    await expenseCategoryService.deactivateCategory(profDevCategory.id);
    console.log(`❌ Deactivated category: ${profDevCategory.name}`);

    // Reactivate the category
    await expenseCategoryService.activateCategory(profDevCategory.id);
    console.log(`✅ Reactivated category: ${profDevCategory.name}`);

    // 6. Show expense summary
    console.log("\n6. Expense summary...");
    const summary = await expenseService.getExpenseSummary();
    console.log(
      `📊 Total expenses: ₦${summary.totalExpenses.toLocaleString()}`,
    );
    console.log(`📈 Paid expenses count: ${summary.paidExpenses}`);
    console.log(`⏳ Pending expenses count: ${summary.pendingExpenses}`);

    console.log("\nExpenses by category:");
    Object.entries(summary.byCategory).forEach(([category, data]) => {
      console.log(
        `  • ${category}: ₦${data.amount.toLocaleString()} (${data.count} expense${data.count !== 1 ? "s" : ""})`,
      );
    });

    console.log("\n🎉 Demo completed successfully!");
    console.log("\nKey Features Demonstrated:");
    console.log("✨ Dynamic category creation with custom types");
    console.log("🔧 Category management (create, update, activate/deactivate)");
    console.log("💼 Mixed usage of predefined and custom categories");
    console.log("📊 Expense tracking and reporting");
    console.log("🛡️ Type safety with flexible category system");
  } catch (error) {
    console.error("❌ Demo failed:", error);
  }
}

// Run the demonstration
if (require.main === module) {
  demonstrateDynamicCategories()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}

export { demonstrateDynamicCategories };
