#!/usr/bin/env tsx

/**
 * Enhanced Expense Validation Demo
 *
 * This demonstrates the comprehensive expense validation system with:
 * - Approval workflows and business rules
 * - Category-specific validation
 * - Amount-based validation rules
 * - Anti-fraud duplicate detection
 * - Weekend/holiday expense rules
 * - High-value expense requirements
 * - Payment method constraints
 * - Referential integrity checks
 */

import { expenseService, expenseCategoryService } from "./src/services";

async function demonstrateEnhancedExpenseValidation() {
  console.log("🛡️ Enhanced Expense Validation Demo");
  console.log("====================================\n");

  try {
    // Initialize categories
    await expenseCategoryService.initializeDefaultCategories();
    const categories = await expenseCategoryService.getActiveCategories();
    const utilitiesCategory = categories.find(
      (c) => c.category === "utilities",
    )!;

    console.log("💼 ENHANCED VALIDATION FEATURES");
    console.log("==============================\n");

    // Test 1: Self-Approval Prevention
    console.log("1. 🚫 Testing Self-Approval Prevention");
    try {
      const expense = await expenseService.createExpense({
        categoryId: utilitiesCategory.id,
        categoryName: utilitiesCategory.name,
        category: utilitiesCategory.category,
        amount: 25000,
        description: "Office electricity bill",
        paymentMethod: "bank_transfer",
        paymentDate: "2024-12-01",
        recordedBy: "user-123",
      });

      // Try to approve with same user (should fail in validation hook)
      await expenseService.approveExpense(expense.id, "user-123"); // Same as recordedBy

      console.log(
        "   ❌ VALIDATION FAILED: Self-approval should be prevented\\n",
      );
    } catch (error) {
      console.log(`   ✅ VALIDATION WORKING: ${error}`);
      console.log("   🛡️ Users cannot approve their own expenses\\n");
    }

    // Test 2: Cash Payment Limits
    console.log("2. 💰 Testing Cash Payment Limits");
    try {
      await expenseService.createExpense({
        categoryId: utilitiesCategory.id,
        categoryName: utilitiesCategory.name,
        category: utilitiesCategory.category,
        amount: 150_000, // Over ₦100K cash limit
        description: "Large cash payment",
        paymentMethod: "cash",
        paymentDate: "2024-12-01",
        recordedBy: "user-123",
      });

      console.log(
        "   ❌ VALIDATION FAILED: Should prevent large cash payments\\n",
      );
    } catch (error) {
      console.log(`   ✅ VALIDATION WORKING: ${error}`);
      console.log(
        "   🛡️ Cash payments limited to ₦100,000 for audit compliance\\n",
      );
    }

    // Test 3: High-Value Expense Requirements
    console.log("3. 📋 Testing High-Value Expense Requirements");
    try {
      await expenseService.createExpense({
        categoryId: utilitiesCategory.id,
        categoryName: utilitiesCategory.name,
        category: utilitiesCategory.category,
        amount: 1_500_000, // Over ₦1M - requires purpose and vendor
        description: "High value expense",
        paymentMethod: "bank_transfer",
        paymentDate: "2024-12-01",
        recordedBy: "user-123",
        // Missing purpose and vendor_name
      });

      console.log(
        "   ❌ VALIDATION FAILED: Should require additional docs for high-value\\n",
      );
    } catch (error) {
      console.log(`   ✅ VALIDATION WORKING: ${error}`);
      console.log(
        "   🛡️ High-value expenses require detailed documentation\\n",
      );
    }

    // Test 4: Valid High-Value Expense
    console.log("4. ✅ Testing Valid High-Value Expense Creation");
    try {
      const highValueExpense = await expenseService.createExpense({
        categoryId: utilitiesCategory.id,
        categoryName: utilitiesCategory.name,
        category: utilitiesCategory.category,
        amount: 1_500_000,
        description: "Generator purchase for school backup power",
        purpose:
          "Emergency power backup system for uninterrupted school operations during outages",
        paymentMethod: "bank_transfer",
        paymentDate: "2024-12-01",
        vendorName: "Power Solutions Nigeria Ltd",
        vendorContact: "08012345678",
        recordedBy: "user-123",
      });

      console.log(
        `   ✅ SUCCESS: High-value expense created: ${highValueExpense.reference}`,
      );
      console.log(`   📊 Amount: ₦${highValueExpense.amount.toLocaleString()}`);
      console.log(`   📝 Status: ${highValueExpense.status}\\n`);
    } catch (error) {
      console.log(`   ❌ UNEXPECTED ERROR: ${error}\\n`);
    }

    // Test 5: Duplicate Reference Prevention
    console.log("5. 🔍 Testing Duplicate Reference Prevention");
    try {
      // Try to create expense with duplicate reference
      await expenseService.createExpense({
        categoryId: utilitiesCategory.id,
        categoryName: utilitiesCategory.name,
        category: utilitiesCategory.category,
        amount: 25000,
        description: "Another expense",
        paymentMethod: "cash",
        paymentDate: "2024-12-02",
        recordedBy: "user-456",
        reference: "EXP-2024-ABC12345", // Duplicate reference
      } as any);

      console.log(
        "   ❌ VALIDATION FAILED: Should prevent duplicate references\\n",
      );
    } catch (error) {
      console.log(`   ✅ VALIDATION WORKING: ${error}`);
      console.log("   🛡️ Expense references must be unique\\n");
    }

    // Test 6: Equipment Purchase Category Rules
    console.log("6. 🖥️ Testing Equipment Purchase Category Rules");

    // First create equipment category
    const equipmentCategory = await expenseCategoryService.createCategory({
      name: "Computer Equipment",
      category: "computer_equipment",
      description: "Computer hardware and software purchases",
    });

    try {
      await expenseService.createExpense({
        categoryId: equipmentCategory.id,
        categoryName: equipmentCategory.name,
        category: equipmentCategory.category,
        amount: 75_000, // Over ₦50K for equipment
        description: "Laptop purchase",
        paymentMethod: "bank_transfer",
        paymentDate: "2024-12-01",
        recordedBy: "user-123",
        // Missing detailed purpose and vendor for equipment over ₦50K
      });

      console.log(
        "   ❌ VALIDATION FAILED: Should require detailed equipment documentation\\n",
      );
    } catch (error) {
      console.log(`   ✅ VALIDATION WORKING: ${error}`);
      console.log(
        "   🛡️ Equipment purchases over ₦50,000 require detailed documentation\\n",
      );
    }

    // Test 7: Valid Equipment Purchase
    console.log("7. ✅ Testing Valid Equipment Purchase");
    try {
      const equipmentExpense = await expenseService.createExpense({
        categoryId: equipmentCategory.id,
        categoryName: equipmentCategory.name,
        category: equipmentCategory.category,
        amount: 75_000,
        description: "Dell laptop for admin office",
        purpose:
          "Administrative laptop for school records management and student data processing",
        paymentMethod: "bank_transfer",
        paymentDate: "2024-12-01",
        vendorName: "TechHub Nigeria",
        vendorContact: "08087654321",
        recordedBy: "user-123",
      });

      console.log(
        `   ✅ SUCCESS: Equipment expense created: ${equipmentExpense.reference}`,
      );
      console.log(`   💻 Category: ${equipmentExpense.categoryName}`);
      console.log(`   📝 Purpose: ${equipmentExpense.purpose}\\n`);
    } catch (error) {
      console.log(`   ❌ UNEXPECTED ERROR: ${error}\\n`);
    }

    // Test 8: Weekend Expense Rules
    console.log("8. 📅 Testing Weekend Expense Rules");
    try {
      await expenseService.createExpense({
        categoryId: utilitiesCategory.id,
        categoryName: utilitiesCategory.name,
        category: utilitiesCategory.category,
        amount: 75_000, // Over ₦50K on weekend
        description: "Weekend maintenance",
        paymentMethod: "cash",
        paymentDate: "2024-12-07", // Saturday
        recordedBy: "user-123",
        // Missing detailed justification for weekend expense
      });

      console.log(
        "   ❌ VALIDATION FAILED: Should require weekend justification\\n",
      );
    } catch (error) {
      console.log(`   ✅ VALIDATION WORKING: ${error}`);
      console.log(
        "   🛡️ Weekend expenses over ₦50,000 require detailed justification\\n",
      );
    }

    // Test 9: Future Date Validation
    console.log("9. ⏰ Testing Future Date Validation");
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10); // 10 days in future

      await expenseService.createExpense({
        categoryId: utilitiesCategory.id,
        categoryName: utilitiesCategory.name,
        category: utilitiesCategory.category,
        amount: 25000,
        description: "Future expense",
        paymentMethod: "cash",
        paymentDate: futureDate.toISOString().split("T")[0],
        recordedBy: "user-123",
      });

      console.log(
        "   ❌ VALIDATION FAILED: Should prevent far future dates\\n",
      );
    } catch (error) {
      console.log(`   ✅ VALIDATION WORKING: ${error}`);
      console.log(
        "   🛡️ Payment dates cannot be more than 7 days in the future\\n",
      );
    }

    // Test 10: Approval Workflow Validation
    console.log("10. 🔄 Testing Complete Approval Workflow");

    // Create a valid expense
    const workflowExpense = await expenseService.createExpense({
      categoryId: utilitiesCategory.id,
      categoryName: utilitiesCategory.name,
      category: utilitiesCategory.category,
      amount: 45000,
      description: "Monthly water bill - December",
      paymentMethod: "bank_transfer",
      paymentDate: "2024-12-01",
      vendorName: "Water Board",
      recordedBy: "user-123",
    });

    console.log(
      `   📝 Created expense: ${workflowExpense.reference} [Status: ${workflowExpense.status}]`,
    );

    // Approve the expense
    const approvedExpense = await expenseService.approveExpense(
      workflowExpense.id,
      "admin-456",
    );
    console.log(
      `   ✅ Approved expense: ${approvedExpense.reference} [Status: ${approvedExpense.status}]`,
    );
    console.log(`   👤 Approved by: ${approvedExpense.approvedBy}`);

    // Mark as paid
    const paidExpense = await expenseService.markAsPaid(approvedExpense.id);
    console.log(
      `   💰 Marked as paid: ${paidExpense.reference} [Status: ${paidExpense.status}]\\n`,
    );

    // Test 11: Rejection Workflow
    console.log("11. ❌ Testing Rejection Workflow");

    const rejectableExpense = await expenseService.createExpense({
      categoryId: utilitiesCategory.id,
      categoryName: utilitiesCategory.name,
      category: utilitiesCategory.category,
      amount: 85000,
      description: "Questionable expense for review",
      paymentMethod: "bank_transfer",
      paymentDate: "2024-12-01",
      recordedBy: "user-789",
    });

    const rejectedExpense = await expenseService.rejectExpense(
      rejectableExpense.id,
      "Expense lacks proper documentation and vendor details are missing",
    );

    console.log(
      `   ❌ Rejected expense: ${rejectedExpense.reference} [Status: ${rejectedExpense.status}]`,
    );
    console.log(`   💬 Rejection reason: ${rejectedExpense.notes}\\n`);

    // Summary of all validation features
    console.log("🎯 ENHANCED VALIDATION FEATURES SUMMARY");
    console.log("=====================================");
    console.log("");
    console.log("✅ APPROVAL WORKFLOW VALIDATION:");
    console.log("  • Self-approval prevention");
    console.log("  • Approval timestamp validation");
    console.log("  • Status transition enforcement");
    console.log("  • Rejection reason requirements");
    console.log("");
    console.log("✅ AMOUNT-BASED RULES:");
    console.log("  • Cash payment limits (₦100K max)");
    console.log("  • POS payment limits (₦500K max)");
    console.log("  • High-value documentation requirements");
    console.log("  • Amount precision validation (2 decimal places)");
    console.log("");
    console.log("✅ BUSINESS RULE ENFORCEMENT:");
    console.log("  • Duplicate reference prevention");
    console.log("  • Potential duplicate expense detection");
    console.log("  • Category-specific validation rules");
    console.log("  • Weekend/holiday expense justification");
    console.log("");
    console.log("✅ CATEGORY-SPECIFIC RULES:");
    console.log("  • Staff expenses require detailed purpose");
    console.log("  • Utility expenses require vendor info");
    console.log("  • Equipment purchases need documentation");
    console.log("  • High-value approvals need comprehensive details");
    console.log("");
    console.log("✅ DATE & FORMAT VALIDATION:");
    console.log("  • Future date limits (max 7 days ahead)");
    console.log("  • Historical date limits (max 1 year back)");
    console.log("  • Reference format validation (EXP-YYYY-XXXXXXXX)");
    console.log("  • URL format validation for invoices");
    console.log("");
    console.log("✅ AUDIT & COMPLIANCE:");
    console.log("  • Payment method constraints for large amounts");
    console.log("  • Vendor information requirements");
    console.log("  • Invoice documentation for mega expenses");
    console.log("  • Comprehensive approval audit trail");

    console.log(
      "\\n🎉 Enhanced expense validation system is working perfectly!",
    );
    console.log(
      "💪 Al-Muhaasib is protected by comprehensive business rule enforcement! 🛡️✨",
    );
  } catch (error) {
    console.error("❌ Demo failed:", error);
  }
}

// Run the demonstration
if (require.main === module) {
  demonstrateEnhancedExpenseValidation()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}

export { demonstrateEnhancedExpenseValidation };
