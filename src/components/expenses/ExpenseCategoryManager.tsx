'use client';

import React, { useState, useEffect } from 'react';
import { expenseCategoryService } from '@/services';
import { useAuth } from '@/contexts/AuthContext';
import type { ExpenseCategoryDef, ExpenseCategory } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import {
  PlusIcon,
  Edit2Icon,
  TrashIcon,
  FolderIcon,
  SettingsIcon,
  CheckCircleIcon,
  XCircleIcon,
} from 'lucide-react';

interface CategoryFormData {
  name: string;
  category: ExpenseCategory;
  description: string;
  budgetCode: string;
  isActive: boolean;
}

export const ExpenseCategoryManager: React.FC = () => {
  const { appUser } = useAuth();
  const [categories, setCategories] = useState<ExpenseCategoryDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategoryDef | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    category: 'miscellaneous',
    description: '',
    budgetCode: '',
    isActive: true,
  });

  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await expenseCategoryService.list();
      setCategories(data.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error('Error loading expense categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'miscellaneous',
      description: '',
      budgetCode: '',
      isActive: true,
    });
    setCustomCategoryInput('');
    setShowCustomCategoryInput(false);
    setErrors({});
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    }

    if (!formData.category && !customCategoryInput) {
      newErrors.category = 'Category type is required';
    }

    if (showCustomCategoryInput && !customCategoryInput.trim()) {
      newErrors.category = 'Custom category name is required';
    }

    if (showCustomCategoryInput && customCategoryInput.trim() && !/^[a-z][a-z0-9_]*[a-z0-9]$/.test(customCategoryInput.trim())) {
      newErrors.category = 'Custom category must be lowercase with underscores (e.g., "marketing_materials")';
    }

    // Check for duplicate names (excluding current editing item)
    const isDuplicate = categories.some(cat => 
      cat.name.toLowerCase() === formData.name.toLowerCase() &&
      (!editingCategory || cat.id !== editingCategory.id)
    );

    if (isDuplicate) {
      newErrors.name = 'Category name already exists';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate() || !appUser) return;

    try {
      setFormLoading(true);

      const categoryData = {
        name: formData.name.trim(),
        category: showCustomCategoryInput && customCategoryInput ? customCategoryInput : formData.category,
        description: formData.description.trim() || undefined,
        budgetCode: formData.budgetCode.trim() || undefined,
      };

      if (editingCategory) {
        await expenseCategoryService.updateCategory(editingCategory.id, categoryData);
      } else {
        await expenseCategoryService.createCategory(categoryData);
      }

      resetForm();
      setShowCreateModal(false);
      setEditingCategory(null);
      loadCategories();
      
      alert(`Category ${editingCategory ? 'updated' : 'created'} successfully!`);
    } catch (error) {
      console.error('Error saving category:', error);
      alert(`Failed to ${editingCategory ? 'update' : 'create'} category. Please try again.`);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (category: ExpenseCategoryDef) => {
    const isCustomCategory = !expenseCategoryOptions.some(opt => opt.value === category.category);
    
    setFormData({
      name: category.name,
      category: isCustomCategory ? 'miscellaneous' : category.category,
      description: category.description || '',
      budgetCode: category.budgetCode || '',
      isActive: category.isActive,
    });
    
    if (isCustomCategory) {
      setShowCustomCategoryInput(true);
      setCustomCategoryInput(category.category);
    } else {
      setShowCustomCategoryInput(false);
      setCustomCategoryInput('');
    }
    
    setEditingCategory(category);
    setShowCreateModal(true);
  };

  const handleDelete = async (category: ExpenseCategoryDef) => {
    if (!confirm(`Are you sure you want to deactivate the category "${category.name}"? This will hide it from new expense forms but preserve historical data.`)) {
      return;
    }

    try {
      await expenseCategoryService.deactivateCategory(category.id);
      loadCategories();
      alert('Category deactivated successfully!');
    } catch (error) {
      console.error('Error deactivating category:', error);
      alert('Failed to deactivate category.');
    }
  };

  const handleToggleStatus = async (category: ExpenseCategoryDef) => {
    try {
      if (category.isActive) {
        await expenseCategoryService.deactivateCategory(category.id);
      } else {
        await expenseCategoryService.activateCategory(category.id);
      }
      loadCategories();
    } catch (error) {
      console.error('Error updating category status:', error);
      alert('Failed to update category status.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setEditingCategory(null);
    resetForm();
  };


  // Get predefined categories from service
  const expenseCategoryOptions = expenseCategoryService.getPredefinedCategories();
  
  // Group options by category
  const groupedOptions = expenseCategoryOptions.reduce((acc, option) => {
    if (!acc[option.group]) {
      acc[option.group] = [];
    }
    acc[option.group].push({ value: option.value, label: option.label });
    return acc;
  }, {} as Record<string, { value: string; label: string }[]>);

  const getCategoryLabel = (category: ExpenseCategory) => {
    const predefinedOption = expenseCategoryOptions.find(opt => opt.value === category);
    if (predefinedOption) {
      return predefinedOption.label;
    }
    // For custom categories, format the string nicely
    return category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getCategoryColor = (category: ExpenseCategory) => {
    const colorMap: Record<string, string> = {
      'salaries': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'utilities': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'maintenance': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      'teaching_materials': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      'stationery': 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
      'equipment_purchase': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
      'miscellaneous': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
    };

    // Get the base category (first part before underscore)
    const baseCategory = category.split('_')[0];
    return colorMap[baseCategory] || colorMap['miscellaneous'];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            Expense Categories
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage expense categories and budget allocation
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} variant="primary">
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Category List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {categories.length === 0 ? (
          <div className="text-center py-12">
            <FolderIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No expense categories created yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Category Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Budget Code
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {category.name}
                        </p>
                        {category.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(category.category)}`}>
                        {getCategoryLabel(category.category)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {category.budgetCode || 'N/A'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleStatus(category)}
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full transition-colors ${
                          category.isActive
                            ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50'
                            : 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50'
                        }`}
                      >
                        {category.isActive ? (
                          <>
                            <CheckCircleIcon className="w-3 h-3" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircleIcon className="w-3 h-3" />
                            Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(category)}
                        >
                          <Edit2Icon className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(category)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <TrashIcon className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={handleModalClose}
          title={editingCategory ? 'Edit Category' : 'Create Category'}
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <Input
                label="Category Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
                required
                placeholder="e.g., Office Supplies"
                helperText="Enter a descriptive name for the expense category"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category Type *
                </label>
                <div className="space-y-3">
                  {/* Predefined categories */}
                  <div>
                    <select
                      name="category"
                      value={showCustomCategoryInput ? 'custom' : formData.category}
                      onChange={(e) => {
                        if (e.target.value === 'custom') {
                          setShowCustomCategoryInput(true);
                          setFormData(prev => ({ ...prev, category: 'miscellaneous' }));
                        } else {
                          setShowCustomCategoryInput(false);
                          handleChange(e);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      disabled={showCustomCategoryInput}
                    >
                      <option value="">Select category type...</option>
                      {Object.entries(groupedOptions).map(([group, options]) => (
                        <optgroup key={group} label={group}>
                          {options.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                      <option value="custom">✨ Create Custom Category</option>
                    </select>
                  </div>
                  
                  {/* Custom category input */}
                  {showCustomCategoryInput && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Creating Custom Category</span>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCustomCategoryInput(false);
                            setCustomCategoryInput('');
                          }}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100"
                        >
                          <XCircleIcon className="w-4 h-4" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={customCategoryInput}
                        onChange={(e) => setCustomCategoryInput(e.target.value)}
                        placeholder="Enter custom category name (e.g., 'conference_fees')"
                        className="w-full px-3 py-2 rounded-lg border border-blue-300 dark:border-blue-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                      <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                        Use lowercase with underscores (e.g., &quot;conference_fees&quot;, &quot;marketing_materials&quot;)
                      </p>
                    </div>
                  )}
                </div>
                {errors.category && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.category}</p>
                )}
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Select the type of expense this category represents
                </p>
              </div>

              <Input
                label="Budget Code (Optional)"
                name="budgetCode"
                value={formData.budgetCode}
                onChange={handleChange}
                placeholder="e.g., ADM-001"
                helperText="Internal budget code for tracking and reporting"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Brief description of what expenses this category covers..."
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer">
                  Active Category
                </label>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  (Inactive categories won&apos;t appear in expense forms)
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="outline" onClick={handleModalClose}>
                Cancel
              </Button>
              <Button type="submit" loading={formLoading}>
                {editingCategory ? 'Update Category' : 'Create Category'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};