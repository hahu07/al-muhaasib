'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { expenseService, expenseCategoryService, budgetService } from '@/services';
import { useAuth } from '@/contexts/AuthContext';
import type { ExpenseCategoryDef, Expense, ExpenseCategory } from '@/types';
import { 
  DollarSignIcon, 
  CalendarIcon, 
  UserIcon, 
  FileTextIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  PlusIcon
} from 'lucide-react';

interface ExpenseRecordingFormProps {
  onSuccess?: (expenseId: string) => void;
  onCancel?: () => void;
  className?: string;
}

export const ExpenseRecordingForm: React.FC<ExpenseRecordingFormProps> = ({
  onSuccess,
  onCancel,
  className = '',
}) => {
  const { appUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<ExpenseCategoryDef[]>([]);
  const [budgetCheck, setBudgetCheck] = useState<{
    available: boolean;
    remaining: number;
    message: string;
  } | null>(null);
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    category: 'miscellaneous' as ExpenseCategory,
    description: '',
  });
  const [categoryFormLoading, setCategoryFormLoading] = useState(false);
  const [categoryFormErrors, setCategoryFormErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    categoryId: '',
    amount: '',
    description: '',
    purpose: '',
    paymentMethod: 'cash' as 'cash' | 'bank_transfer' | 'cheque' | 'pos',
    paymentDate: new Date().toISOString().split('T')[0],
    vendorName: '',
    vendorContact: '',
    notes: '',
  });

  // Load expense categories on component mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Check budget availability when category or amount changes
  useEffect(() => {
    if (formData.categoryId && formData.amount) {
      checkBudgetAvailability();
    } else {
      setBudgetCheck(null);
    }
  }, [formData.categoryId, formData.amount]);

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      
      // Initialize default categories if none exist
      await expenseCategoryService.initializeDefaultCategories();
      
      const activeCategories = await expenseCategoryService.getActiveCategories();
      setCategories(activeCategories);
    } catch (error) {
      console.error('Error loading expense categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const checkBudgetAvailability = async () => {
    try {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        setBudgetCheck(null);
        return;
      }

      const currentYear = new Date().getFullYear();
      const academicYear = `${currentYear}/${currentYear + 1}`;
      const term = 'first'; // You might want to make this dynamic

      const result = await budgetService.checkBudgetAvailability(
        academicYear,
        formData.categoryId,
        amount,
        term
      );

      setBudgetCheck(result);
    } catch (error) {
      console.error('Error checking budget availability:', error);
      setBudgetCheck({
        available: false,
        remaining: 0,
        message: 'Unable to check budget availability',
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.categoryId) {
      newErrors.categoryId = 'Expense category is required';
    }

    const amount = parseFloat(formData.amount);
    if (!formData.amount || isNaN(amount) || amount <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.paymentDate) {
      newErrors.paymentDate = 'Payment date is required';
    }

    // Validate vendor contact format if provided
    if (formData.vendorContact && !/^[\d\s\-+()]+$/.test(formData.vendorContact)) {
      newErrors.vendorContact = 'Invalid contact format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate() || !appUser) return;

    try {
      setLoading(true);

      const amount = parseFloat(formData.amount);
      const selectedCategory = categories.find(c => c.id === formData.categoryId);
      
      if (!selectedCategory) {
        throw new Error('Selected category not found');
      }

      // Create the expense
      const expense = await expenseService.createExpense({
        categoryId: formData.categoryId,
        categoryName: selectedCategory.name,
        category: selectedCategory.category,
        amount,
        description: formData.description.trim(),
        purpose: formData.purpose.trim() || undefined,
        paymentMethod: formData.paymentMethod,
        paymentDate: formData.paymentDate,
        vendorName: formData.vendorName.trim() || undefined,
        vendorContact: formData.vendorContact.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        recordedBy: appUser.id,
      });

      // Reset form
      setFormData({
        categoryId: '',
        amount: '',
        description: '',
        purpose: '',
        paymentMethod: 'cash',
        paymentDate: new Date().toISOString().split('T')[0],
        vendorName: '',
        vendorContact: '',
        notes: '',
      });

      onSuccess?.(expense.id);
    } catch (error) {
      console.error('Error recording expense:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to record expense: ${errorMessage}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCategoryFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCategoryFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (categoryFormErrors[name]) {
      setCategoryFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateCategoryForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!categoryFormData.name.trim()) {
      newErrors.name = 'Category name is required';
    }

    if (!categoryFormData.category) {
      newErrors.category = 'Category type is required';
    }

    // Check for duplicate names
    const isDuplicate = categories.some(cat => 
      cat.name.toLowerCase() === categoryFormData.name.toLowerCase()
    );

    if (isDuplicate) {
      newErrors.name = 'Category name already exists';
    }

    setCategoryFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateCategoryForm() || !appUser) return;

    try {
      setCategoryFormLoading(true);

      const newCategory = await expenseCategoryService.createCategory({
        name: categoryFormData.name.trim(),
        category: categoryFormData.category,
        description: categoryFormData.description.trim() || undefined,
      });

      // Reset category form
      setCategoryFormData({
        name: '',
        category: 'miscellaneous',
        description: '',
      });
      setCategoryFormErrors({});
      setShowCreateCategoryModal(false);

      // Reload categories
      await loadCategories();

      // Select the newly created category
      setFormData(prev => ({ ...prev, categoryId: newCategory.id }));
      
      alert('Category created successfully!');
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Failed to create category. Please try again.');
    } finally {
      setCategoryFormLoading(false);
    }
  };

  const handleCloseCategoryModal = () => {
    setShowCreateCategoryModal(false);
    setCategoryFormData({
      name: '',
      category: 'miscellaneous',
      description: '',
    });
    setCategoryFormErrors({});
  };

  const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'pos', label: 'POS' },
  ];

  // Get predefined categories from service
  const expenseCategoryOptions = expenseCategoryService.getPredefinedCategories().map(cat => ({
    value: cat.value,
    label: cat.label
  }));

  return (
    <>
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <DollarSignIcon className="w-5 h-5" />
          Record New Expense
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Enter expense details for approval and payment processing
        </p>
      </div>

      {/* Main Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Selection */}
        <div className="md:col-span-1">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Expense Category *
              </label>
              <Select 
                value={formData.categoryId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
                disabled={loadingCategories}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    loadingCategories 
                      ? 'Loading categories...' 
                      : categories.length === 0 
                      ? 'No categories available' 
                      : 'Select category'
                  } />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.categoryId}</p>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowCreateCategoryModal(true)}
              className="mb-0 px-3 py-2 h-10 whitespace-nowrap"
              title="Create new expense category"
            >
              <PlusIcon className="w-4 h-4" />
            </Button>
          </div>
          {categories.length === 0 && !loadingCategories && (
            <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
              No expense categories found. Create one to continue.
            </p>
          )}
        </div>

        {/* Amount */}
        <div className="md:col-span-1">
          <Input
            label="Amount (₦)"
            name="amount"
            type="number"
            step="0.01"
            min="0"
            value={formData.amount}
            onChange={handleChange}
            error={errors.amount}
            required
            placeholder="0.00"
            helperText="Enter the expense amount in Naira"
          />
        </div>

        {/* Budget Check Display - Informational Only */}
        {budgetCheck && (
          <div className="md:col-span-2">
            <div className={`p-3 rounded-lg border ${
              budgetCheck.available
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
                : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700'
            }`}>
              <div className="flex items-center gap-2">
                {budgetCheck.available ? (
                  <CheckCircleIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                ) : (
                  <AlertCircleIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                )}
                <div className="flex-1">
                  <span className={`text-sm font-medium ${
                    budgetCheck.available
                      ? 'text-blue-800 dark:text-blue-300'
                      : 'text-amber-800 dark:text-amber-300'
                  }`}>
                    Budget Status: {budgetCheck.message}
                  </span>
                  {!budgetCheck.available && (
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                      Note: You can still record this expense. Budget monitoring is for informational purposes.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Description */}
        <div className="md:col-span-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Brief description of the expense..."
              required
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>
            )}
          </div>
        </div>

        {/* Purpose (Optional) */}
        <div className="md:col-span-2">
          <Input
            label="Purpose (Optional)"
            name="purpose"
            value={formData.purpose}
            onChange={handleChange}
            placeholder="Specific purpose or justification for this expense"
            helperText="Provide additional context for the expense"
          />
        </div>

        {/* Payment Method */}
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Payment Method *
          </label>
          <Select 
            value={formData.paymentMethod} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value as typeof formData.paymentMethod }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent>
              {paymentMethods.map(method => (
                <SelectItem key={method.value} value={method.value}>
                  {method.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Payment Date */}
        <div className="md:col-span-1">
          <Input
            label="Payment Date"
            name="paymentDate"
            type="date"
            value={formData.paymentDate}
            onChange={handleChange}
            error={errors.paymentDate}
            required
          />
        </div>

        {/* Vendor Information */}
        <div className="md:col-span-1">
          <Input
            label="Vendor/Supplier Name (Optional)"
            name="vendorName"
            value={formData.vendorName}
            onChange={handleChange}
            placeholder="Name of vendor or supplier"
          />
        </div>

        <div className="md:col-span-1">
          <Input
            label="Vendor Contact (Optional)"
            name="vendorContact"
            value={formData.vendorContact}
            onChange={handleChange}
            error={errors.vendorContact}
            placeholder="Phone number or email"
            helperText="Contact information for the vendor"
          />
        </div>

        {/* Notes */}
        <div className="md:col-span-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Additional Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Any additional notes or comments..."
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button 
          type="submit" 
          loading={loading}
        >
          <FileTextIcon className="w-4 h-4 mr-2" />
          Record Expense
        </Button>
      </div>
    </form>

    {/* Create Category Modal */}
    {showCreateCategoryModal && (
      <Modal
        isOpen={showCreateCategoryModal}
        onClose={handleCloseCategoryModal}
        title="Create New Expense Category"
        size="md"
      >
        <form onSubmit={handleCreateCategory} className="space-y-6">
          <div className="space-y-4">
            <Input
              label="Category Name"
              name="name"
              value={categoryFormData.name}
              onChange={handleCategoryFormChange}
              error={categoryFormErrors.name}
              required
              placeholder="e.g., Office Supplies"
              helperText="Enter a descriptive name for the expense category"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category Type *
              </label>
              <Select 
                value={categoryFormData.category} 
                onValueChange={(value) => setCategoryFormData(prev => ({ ...prev, category: value as ExpenseCategory }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category type" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategoryOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {categoryFormErrors.category && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{categoryFormErrors.category}</p>
              )}
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Select the type of expense this category represents
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description (Optional)
              </label>
              <textarea
                name="description"
                value={categoryFormData.description}
                onChange={handleCategoryFormChange}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Brief description of what expenses this category covers..."
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button type="button" variant="outline" onClick={handleCloseCategoryModal}>
              Cancel
            </Button>
            <Button type="submit" loading={categoryFormLoading}>
              Create Category
            </Button>
          </div>
        </form>
      </Modal>
    )}
  </>
  );
};
