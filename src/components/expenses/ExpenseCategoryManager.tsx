"use client";

import React, { useState, useEffect } from "react";
import { expenseCategoryService } from "@/services";
import { useAuth } from "@/contexts/AuthContext";
import type { ExpenseCategoryDef, ExpenseCategory } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  PlusIcon,
  Edit2Icon,
  TrashIcon,
  FolderIcon,
  SettingsIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "lucide-react";

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
  const [editingCategory, setEditingCategory] =
    useState<ExpenseCategoryDef | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    category: "miscellaneous",
    description: "",
    budgetCode: "",
    isActive: true,
  });

  const [customCategoryInput, setCustomCategoryInput] = useState("");
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
      console.error("Error loading expense categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      category: "miscellaneous",
      description: "",
      budgetCode: "",
      isActive: true,
    });
    setCustomCategoryInput("");
    setShowCustomCategoryInput(false);
    setErrors({});
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Category name is required";
    }

    if (!formData.category && !customCategoryInput) {
      newErrors.category = "Category type is required";
    }

    if (showCustomCategoryInput && !customCategoryInput.trim()) {
      newErrors.category = "Custom category name is required";
    }

    if (
      showCustomCategoryInput &&
      customCategoryInput.trim() &&
      !/^[a-z][a-z0-9_]*[a-z0-9]$/.test(customCategoryInput.trim())
    ) {
      newErrors.category =
        'Custom category must be lowercase with underscores (e.g., "marketing_materials")';
    }

    // Check for duplicate names (excluding current editing item)
    const isDuplicate = categories.some(
      (cat) =>
        cat.name.toLowerCase() === formData.name.toLowerCase() &&
        (!editingCategory || cat.id !== editingCategory.id),
    );

    if (isDuplicate) {
      newErrors.name = "Category name already exists";
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
        category:
          showCustomCategoryInput && customCategoryInput
            ? customCategoryInput
            : formData.category,
        description: formData.description.trim() || undefined,
        budgetCode: formData.budgetCode.trim() || undefined,
      };

      if (editingCategory) {
        await expenseCategoryService.updateCategory(
          editingCategory.id,
          categoryData,
        );
      } else {
        await expenseCategoryService.createCategory(categoryData);
      }

      resetForm();
      setShowCreateModal(false);
      setEditingCategory(null);
      loadCategories();

      alert(
        `Category ${editingCategory ? "updated" : "created"} successfully!`,
      );
    } catch (error) {
      console.error("Error saving category:", error);
      alert(
        `Failed to ${editingCategory ? "update" : "create"} category. Please try again.`,
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (category: ExpenseCategoryDef) => {
    const isCustomCategory = !expenseCategoryOptions.some(
      (opt) => opt.value === category.category,
    );

    setFormData({
      name: category.name,
      category: isCustomCategory ? "miscellaneous" : category.category,
      description: category.description || "",
      budgetCode: category.budgetCode || "",
      isActive: category.isActive,
    });

    if (isCustomCategory) {
      setShowCustomCategoryInput(true);
      setCustomCategoryInput(category.category);
    } else {
      setShowCustomCategoryInput(false);
      setCustomCategoryInput("");
    }

    setEditingCategory(category);
    setShowCreateModal(true);
  };

  const handleDelete = async (category: ExpenseCategoryDef) => {
    if (
      !confirm(
        `Are you sure you want to deactivate the category "${category.name}"? This will hide it from new expense forms but preserve historical data.`,
      )
    ) {
      return;
    }

    try {
      await expenseCategoryService.deactivateCategory(category.id);
      loadCategories();
      alert("Category deactivated successfully!");
    } catch (error) {
      console.error("Error deactivating category:", error);
      alert("Failed to deactivate category.");
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
      console.error("Error updating category status:", error);
      alert("Failed to update category status.");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setEditingCategory(null);
    resetForm();
  };

  // Get predefined categories from service
  const expenseCategoryOptions =
    expenseCategoryService.getPredefinedCategories();

  // Group options by category
  const groupedOptions = expenseCategoryOptions.reduce(
    (acc, option) => {
      if (!acc[option.group]) {
        acc[option.group] = [];
      }
      acc[option.group].push({ value: option.value, label: option.label });
      return acc;
    },
    {} as Record<string, { value: string; label: string }[]>,
  );

  const getCategoryLabel = (category: ExpenseCategory) => {
    const predefinedOption = expenseCategoryOptions.find(
      (opt) => opt.value === category,
    );
    if (predefinedOption) {
      return predefinedOption.label;
    }
    // For custom categories, format the string nicely
    return category
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getCategoryColor = (category: ExpenseCategory) => {
    const colorMap: Record<string, string> = {
      salaries:
        "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      utilities:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      maintenance:
        "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
      teaching_materials:
        "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
      stationery:
        "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
      equipment_purchase:
        "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
      miscellaneous:
        "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
    };

    // Get the base category (first part before underscore)
    const baseCategory = category.split("_")[0];
    return colorMap[baseCategory] || colorMap["miscellaneous"];
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-gray-100">
            <SettingsIcon className="h-5 w-5" />
            Expense Categories
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage expense categories and budget allocation
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} variant="primary">
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Category List */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        {categories.length === 0 ? (
          <div className="py-12 text-center">
            <FolderIcon className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">
              No expense categories created yet
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-700 uppercase dark:text-gray-300">
                    Category Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-700 uppercase dark:text-gray-300">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-700 uppercase dark:text-gray-300">
                    Budget Code
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-700 uppercase dark:text-gray-300">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-700 uppercase dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {categories.map((category) => (
                  <tr
                    key={category.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
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
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getCategoryColor(category.category)}`}
                      >
                        {getCategoryLabel(category.category)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {category.budgetCode || "N/A"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleStatus(category)}
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition-colors ${
                          category.isActive
                            ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50"
                            : "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
                        }`}
                      >
                        {category.isActive ? (
                          <>
                            <CheckCircleIcon className="h-3 w-3" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircleIcon className="h-3 w-3" />
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
                          <Edit2Icon className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(category)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <TrashIcon className="h-3 w-3" />
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
          title={editingCategory ? "Edit Category" : "Create Category"}
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
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Category Type *
                </label>
                <div className="space-y-3">
                  {/* Predefined categories */}
                  <div>
                    <select
                      name="category"
                      value={
                        showCustomCategoryInput ? "custom" : formData.category
                      }
                      onChange={(e) => {
                        if (e.target.value === "custom") {
                          setShowCustomCategoryInput(true);
                          setFormData((prev) => ({
                            ...prev,
                            category: "miscellaneous",
                          }));
                        } else {
                          setShowCustomCategoryInput(false);
                          handleChange(e);
                        }
                      }}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                      required
                      disabled={showCustomCategoryInput}
                    >
                      <option value="">Select category type...</option>
                      {Object.entries(groupedOptions).map(
                        ([group, options]) => (
                          <optgroup key={group} label={group}>
                            {options.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </optgroup>
                        ),
                      )}
                      <option value="custom">✨ Create Custom Category</option>
                    </select>
                  </div>

                  {/* Custom category input */}
                  {showCustomCategoryInput && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          Creating Custom Category
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCustomCategoryInput(false);
                            setCustomCategoryInput("");
                          }}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100"
                        >
                          <XCircleIcon className="h-4 w-4" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={customCategoryInput}
                        onChange={(e) => setCustomCategoryInput(e.target.value)}
                        placeholder="Enter custom category name (e.g., 'conference_fees')"
                        className="w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-blue-600 dark:bg-gray-800 dark:text-gray-100"
                        required
                      />
                      <p className="mt-1 text-xs text-blue-600 dark:text-blue-300">
                        Use lowercase with underscores (e.g.,
                        &quot;conference_fees&quot;,
                        &quot;marketing_materials&quot;)
                      </p>
                    </div>
                  )}
                </div>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.category}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
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
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description (Optional)
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
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
                  className="h-4 w-4 rounded border-gray-300 bg-gray-100 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-blue-600"
                />
                <label
                  htmlFor="isActive"
                  className="cursor-pointer text-sm font-medium text-gray-900 dark:text-gray-100"
                >
                  Active Category
                </label>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  (Inactive categories won&apos;t appear in expense forms)
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={handleModalClose}
              >
                Cancel
              </Button>
              <Button type="submit" loading={formLoading}>
                {editingCategory ? "Update Category" : "Create Category"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
