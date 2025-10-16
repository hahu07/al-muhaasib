import { expenseCategoryService } from '@/services';
import type { ExpenseCategoryDef, ExpenseCategory } from '@/types';

/**
 * Default expense categories to initialize when the app starts
 */
const DEFAULT_EXPENSE_CATEGORIES: Omit<ExpenseCategoryDef, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Staff Salaries',
    category: 'salaries' as ExpenseCategory,
    description: 'Monthly salaries for teaching and non-teaching staff',
    isActive: true,
  },
  {
    name: 'Utilities',
    category: 'utilities' as ExpenseCategory,
    description: 'Electricity, water, gas, and other utility expenses',
    isActive: true,
  },
  {
    name: 'Teaching Materials',
    category: 'teaching_materials' as ExpenseCategory,
    description: 'Books, stationery, and other teaching supplies',
    isActive: true,
  },
  {
    name: 'Office Supplies',
    category: 'stationery' as ExpenseCategory,
    description: 'General office and administrative supplies',
    isActive: true,
  },
  {
    name: 'Maintenance & Repairs',
    category: 'maintenance' as ExpenseCategory,
    description: 'Building maintenance, repairs, and upkeep',
    isActive: true,
  },
  {
    name: 'Transportation',
    category: 'transportation' as ExpenseCategory,
    description: 'School transport and travel-related expenses',
    isActive: true,
  },
];

/**
 * Initialize default expense categories if none exist
 */
export async function initializeExpenseCategories(): Promise<void> {
  try {
    // Check if any categories already exist
    const existingCategories = await expenseCategoryService.list();
    
    if (existingCategories.length > 0) {
      // Categories already exist, no need to initialize
      return;
    }

    console.log('No expense categories found. Initializing default categories...');

    // Create default categories
    for (const categoryData of DEFAULT_EXPENSE_CATEGORIES) {
      try {
        await expenseCategoryService.create(categoryData);
        console.log(`Created expense category: ${categoryData.name}`);
      } catch (error) {
        console.error(`Failed to create category ${categoryData.name}:`, error);
      }
    }

    console.log('Default expense categories initialized successfully');
  } catch (error) {
    console.error('Error initializing expense categories:', error);
    // Don't throw error - this is not critical for app functionality
  }
}

/**
 * Get suggested categories based on common school expense types
 */
export function getSuggestedCategories(): { name: string; category: ExpenseCategory; description?: string }[] {
  return [
    { name: 'Staff Allowances', category: 'allowances', description: 'Transport, housing, and other staff allowances' },
    { name: 'Equipment Purchase', category: 'equipment_purchase', description: 'Purchase of school equipment and furniture' },
    { name: 'Food & Catering', category: 'food_supplies', description: 'School feeding and catering supplies' },
    { name: 'Security Services', category: 'security', description: 'Security personnel and services' },
    { name: 'Cleaning Services', category: 'cleaning', description: 'Cleaning and janitorial services' },
    { name: 'Communication', category: 'communication', description: 'Internet, phone, and communication expenses' },
    { name: 'Legal & Professional Fees', category: 'legal_fees', description: 'Legal, audit, and professional service fees' },
    { name: 'Insurance', category: 'insurance', description: 'Property, liability, and other insurance premiums' },
    { name: 'Miscellaneous', category: 'miscellaneous', description: 'Other expenses not covered by specific categories' },
  ];
}