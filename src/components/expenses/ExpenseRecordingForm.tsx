"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { expenseFormSchema, type ExpenseFormValues } from "@/validation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  expenseService,
  expenseCategoryService,
  budgetService,
} from "@/services";
import { useAuth } from "@/contexts/AuthContext";
import type { ExpenseCategoryDef, ExpenseCategory } from "@/types";
import {
  DollarSignIcon,
  FileTextIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  PlusIcon,
} from "lucide-react";

interface ExpenseRecordingFormProps {
  onSuccess?: (expenseId: string) => void;
  onCancel?: () => void;
  className?: string;
}

export const ExpenseRecordingForm: React.FC<ExpenseRecordingFormProps> = ({
  onSuccess,
  onCancel,
  className = "",
}) => {
  const { appUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categories, setCategories] = useState<ExpenseCategoryDef[]>([]);
  const [budgetCheck, setBudgetCheck] = useState<{
    available: boolean;
    remaining: number;
    message: string;
  } | null>(null);
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    category: "miscellaneous" as ExpenseCategory,
    description: "",
  });
  const [categoryFormLoading, setCategoryFormLoading] = useState(false);
  const [categoryFormErrors, setCategoryFormErrors] = useState<
    Record<string, string>
  >({});

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
    watch,
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      categoryId: "",
      amount: 0,
      description: "",
      purpose: "",
      paymentMethod: "cash",
      paymentDate: new Date().toISOString().split("T")[0],
      vendorName: "",
      vendorContact: "",
      notes: "",
    },
  });

  // Load expense categories on component mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Check budget availability when category or amount changes
  const watchCategoryId = watch("categoryId");
  const watchAmount = watch("amount");
  useEffect(() => {
    if (watchCategoryId && watchAmount && watchAmount > 0) {
      checkBudgetAvailability(watchCategoryId, watchAmount);
    } else {
      setBudgetCheck(null);
    }
  }, [watchCategoryId, watchAmount]);

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);

      // Initialize default categories if none exist
      await expenseCategoryService.initializeDefaultCategories();

      const activeCategories =
        await expenseCategoryService.getActiveCategories();
      setCategories(activeCategories);
    } catch (error) {
      console.error("Error loading expense categories:", error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const checkBudgetAvailability = async (
    categoryId: string,
    amount: number,
  ) => {
    try {
      if (!amount || amount <= 0) {
        setBudgetCheck(null);
        return;
      }

      const currentYear = new Date().getFullYear();
      const academicYear = `${currentYear}/${currentYear + 1}`;
      const term = "first"; // You might want to make this dynamic

      const result = await budgetService.checkBudgetAvailability(
        academicYear,
        categoryId,
        amount,
        term,
      );

      setBudgetCheck(result);
    } catch (error) {
      console.error("Error checking budget availability:", error);
      setBudgetCheck({
        available: false,
        remaining: 0,
        message: "Unable to check budget availability",
      });
    }
  };

  const onSubmit = async (values: ExpenseFormValues) => {
    if (!appUser) return;

    try {
      setLoading(true);

      const selectedCategory = categories.find(
        (c) => c.id === values.categoryId,
      );
      if (!selectedCategory) {
        throw new Error("Selected category not found");
      }

      // Create the expense
      const expense = await expenseService.createExpense({
        categoryId: values.categoryId,
        categoryName: selectedCategory.name,
        category: selectedCategory.category,
        amount: values.amount,
        description: values.description.trim(),
        purpose: values.purpose?.trim() || undefined,
        paymentMethod: values.paymentMethod,
        paymentDate: values.paymentDate,
        vendorName: values.vendorName?.trim() || undefined,
        vendorContact: values.vendorContact?.trim() || undefined,
        notes: values.notes?.trim() || undefined,
        recordedBy: appUser.id,
      });

      // Reset form
      reset({
        categoryId: "",
        amount: 0,
        description: "",
        purpose: "",
        paymentMethod: "cash",
        paymentDate: new Date().toISOString().split("T")[0],
        vendorName: "",
        vendorContact: "",
        notes: "",
      });

      onSuccess?.(expense.id);
    } catch (error) {
      console.error("Error recording expense:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      alert(`Failed to record expense: ${errorMessage}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setCategoryFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (categoryFormErrors[name as keyof typeof categoryFormErrors]) {
      setCategoryFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateCategoryForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!categoryFormData.name.trim()) {
      newErrors.name = "Category name is required";
    }

    if (!categoryFormData.category) {
      newErrors.category = "Category type is required";
    }

    // Check for duplicate names
    const isDuplicate = categories.some(
      (cat) => cat.name.toLowerCase() === categoryFormData.name.toLowerCase(),
    );

    if (isDuplicate) {
      newErrors.name = "Category name already exists";
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
        name: "",
        category: "miscellaneous",
        description: "",
      });
      setCategoryFormErrors({});
      setShowCreateCategoryModal(false);

      // Reload categories
      await loadCategories();

      // Select the newly created category
      setValue("categoryId", newCategory.id, { shouldValidate: true });

      alert("Category created successfully!");
    } catch (error) {
      console.error("Error creating category:", error);
      alert("Failed to create category. Please try again.");
    } finally {
      setCategoryFormLoading(false);
    }
  };

  const handleCloseCategoryModal = () => {
    setShowCreateCategoryModal(false);
    setCategoryFormData({
      name: "",
      category: "miscellaneous",
      description: "",
    });
    setCategoryFormErrors({});
  };

  const paymentMethods = [
    { value: "cash", label: "Cash" },
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "cheque", label: "Cheque" },
    { value: "pos", label: "POS" },
  ];

  // Get predefined categories from service
  const expenseCategoryOptions = expenseCategoryService
    .getPredefinedCategories()
    .map((cat) => ({
      value: cat.value,
      label: cat.label,
    }));

  return (
    <>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className={`space-y-6 ${className}`}
      >
        {/* Header */}
        <div className="border-b border-gray-200 pb-4 dark:border-gray-700">
          <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-gray-100">
            <DollarSignIcon className="h-5 w-5" />
            Record New Expense
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Enter expense details for approval and payment processing
          </p>
        </div>

        {/* Main Form Fields */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Category Selection */}
          <div className="md:col-span-1">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Expense Category *
                </label>
                <Controller
                  control={control}
                  name="categoryId"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={loadingCategories}
                    >
                      <SelectTrigger>
                        {field.value && categories.length > 0 ? (
                          <span>
                            {categories.find((c) => c.id === field.value)
                              ?.name || "Select category"}
                          </span>
                        ) : (
                          <SelectValue
                            placeholder={
                              loadingCategories
                                ? "Loading categories..."
                                : categories.length === 0
                                  ? "No categories available"
                                  : "Select category"
                            }
                          />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.categoryId && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.categoryId.message}
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCreateCategoryModal(true)}
                className="mb-0 h-10 px-3 py-2 whitespace-nowrap"
                title="Create new expense category"
              >
                <PlusIcon className="h-4 w-4" />
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
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              helperText="Enter the expense amount in Naira"
              required
              {...register("amount", { valueAsNumber: true })}
              error={errors.amount?.message}
            />
          </div>

          {/* Budget Check Display - Informational Only */}
          {budgetCheck && (
            <div className="md:col-span-2">
              <div
                className={`rounded-lg border p-3 ${
                  budgetCheck.available
                    ? "border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20"
                    : "border-amber-200 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20"
                }`}
              >
                <div className="flex items-center gap-2">
                  {budgetCheck.available ? (
                    <CheckCircleIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <AlertCircleIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  )}
                  <div className="flex-1">
                    <span
                      className={`text-sm font-medium ${
                        budgetCheck.available
                          ? "text-blue-800 dark:text-blue-300"
                          : "text-amber-800 dark:text-amber-300"
                      }`}
                    >
                      Budget Status: {budgetCheck.message}
                    </span>
                    {!budgetCheck.available && (
                      <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                        Note: You can still record this expense. Budget
                        monitoring is for informational purposes.
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
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description *
              </label>
              <textarea
                rows={3}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                placeholder="Brief description of the expense..."
                required
                {...register("description")}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.description.message}
                </p>
              )}
            </div>
          </div>

          {/* Purpose (Optional) */}
          <div className="md:col-span-2">
            <Input
              label="Purpose (Optional)"
              placeholder="Specific purpose or justification for this expense"
              helperText="Provide additional context for the expense"
              {...register("purpose")}
            />
          </div>

          {/* Payment Method */}
          <div className="md:col-span-1">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Payment Method *
            </label>
            <Controller
              control={control}
              name="paymentMethod"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Payment Date */}
          <div className="md:col-span-1">
            <Input
              label="Payment Date"
              type="date"
              required
              {...register("paymentDate")}
              error={errors.paymentDate?.message}
            />
          </div>

          {/* Vendor Information */}
          <div className="md:col-span-1">
            <Input
              label="Vendor/Supplier Name (Optional)"
              placeholder="Name of vendor or supplier"
              {...register("vendorName")}
            />
          </div>

          <div className="md:col-span-1">
            <Input
              label="Vendor Contact (Optional)"
              placeholder="Phone number or email"
              helperText="Contact information for the vendor"
              {...register("vendorContact")}
              error={errors.vendorContact?.message}
            />
          </div>

          {/* Notes */}
          <div className="md:col-span-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Additional Notes (Optional)
              </label>
              <textarea
                rows={2}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                placeholder="Any additional notes or comments..."
                {...register("notes")}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" loading={loading}>
            <FileTextIcon className="mr-2 h-4 w-4" />
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
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Category Type *
                </label>
                <Select
                  value={categoryFormData.category}
                  onValueChange={(value) =>
                    setCategoryFormData((prev) => ({
                      ...prev,
                      category: value as ExpenseCategory,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category type" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {categoryFormErrors.category && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {categoryFormErrors.category}
                  </p>
                )}
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Select the type of expense this category represents
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description (Optional)
                </label>
                <textarea
                  name="description"
                  value={categoryFormData.description}
                  onChange={handleCategoryFormChange}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  placeholder="Brief description of what expenses this category covers..."
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseCategoryModal}
              >
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
