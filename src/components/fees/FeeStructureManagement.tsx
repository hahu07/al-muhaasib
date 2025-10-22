"use client";

import { useState, useEffect } from "react";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CopyIcon,
  BookOpenIcon,
  AlertCircleIcon,
  RefreshCwIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { feeStructureService, feeCategoryService } from "@/services/feeService";
import { classService } from "@/services/classService";
import { UpdateStudentFeesModal } from "./UpdateStudentFeesModal";
import type { FeeStructure, FeeCategory, SchoolClass, FeeItem } from "@/types";

interface FeeStructureFormData {
  classId: string;
  className: string;
  academicYear: string;
  term: "first" | "second" | "third";
  feeItems: FeeItem[];
}

export function FeeStructureManagement() {
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [categories, setCategories] = useState<FeeCategory[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStructure, setEditingStructure] = useState<FeeStructure | null>(
    null,
  );
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloneSourceId, setCloneSourceId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showUpdateStudentsModal, setShowUpdateStudentsModal] = useState(false);
  const [updateStructureId, setUpdateStructureId] = useState<string>("");

  const [formData, setFormData] = useState<FeeStructureFormData>({
    classId: "",
    className: "",
    academicYear:
      new Date().getFullYear() + "/" + (new Date().getFullYear() + 1),
    term: "first",
    feeItems: [],
  });

  const [cloneData, setCloneData] = useState({
    targetClassId: "",
    targetAcademicYear:
      new Date().getFullYear() + "/" + (new Date().getFullYear() + 1),
    targetTerm: "first" as "first" | "second" | "third",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [structuresData, categoriesData, classesData] = await Promise.all([
        feeStructureService.list(),
        feeCategoryService.getActiveFeeCategories(),
        classService.getActiveClasses(),
      ]);

      setStructures(structuresData);
      setCategories(categoriesData);
      setClasses(classesData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      classId: "",
      className: "",
      academicYear:
        new Date().getFullYear() + "/" + (new Date().getFullYear() + 1),
      term: "first",
      feeItems: [],
    });
    setEditingStructure(null);
  };

  const handleAddNew = () => {
    resetForm();
    // Initialize with all active categories as fee items with zero amounts
    const initialFeeItems: FeeItem[] = categories.map((category) => ({
      categoryId: category.id,
      categoryName: category.name,
      type: category.type,
      amount: 0,
      isMandatory: true,
      description: category.description,
    }));
    setFormData((prev) => ({ ...prev, feeItems: initialFeeItems }));
    setShowModal(true);
  };

  const handleEdit = (structure: FeeStructure) => {
    setFormData({
      classId: structure.classId,
      className: structure.className,
      academicYear: structure.academicYear,
      term: structure.term,
      feeItems: structure.feeItems,
    });
    setEditingStructure(structure);
    setShowModal(true);
  };

  const handleClone = (sourceId: string) => {
    setCloneSourceId(sourceId);
    setCloneData({
      targetClassId: "",
      targetAcademicYear:
        new Date().getFullYear() + "/" + (new Date().getFullYear() + 1),
      targetTerm: "first" as "first" | "second" | "third",
    });
    setShowCloneModal(true);
  };

  const handleClassChange = (classId: string) => {
    const selectedClass = classes.find((c) => c.id === classId);
    if (selectedClass) {
      setFormData((prev) => ({
        ...prev,
        classId,
        className:
          selectedClass.name +
          (selectedClass.section ? ` ${selectedClass.section}` : ""),
      }));
    }
  };

  const updateFeeItem = (index: number, updates: Partial<FeeItem>) => {
    setFormData((prev) => ({
      ...prev,
      feeItems: prev.feeItems.map((item, i) =>
        i === index ? { ...item, ...updates } : item,
      ),
    }));
  };

  const addFeeItem = () => {
    if (categories.length === 0) return;

    // Find the first category not already in the fee items
    const usedCategoryIds = formData.feeItems.map((item) => item.categoryId);
    const availableCategory = categories.find(
      (cat) => !usedCategoryIds.includes(cat.id),
    );

    if (availableCategory) {
      const newItem: FeeItem = {
        categoryId: availableCategory.id,
        categoryName: availableCategory.name,
        type: availableCategory.type,
        amount: 0,
        isMandatory: true,
        description: availableCategory.description,
      };
      setFormData((prev) => ({
        ...prev,
        feeItems: [...prev.feeItems, newItem],
      }));
    } else {
      // If all categories are used, add the first category as a duplicate
      // This allows for multiple fee items with the same category but different amounts
      if (categories.length > 0) {
        const firstCategory = categories[0];
        const newItem: FeeItem = {
          categoryId: firstCategory.id,
          categoryName: firstCategory.name,
          type: firstCategory.type,
          amount: 0,
          isMandatory: true,
          description: firstCategory.description,
        };
        setFormData((prev) => ({
          ...prev,
          feeItems: [...prev.feeItems, newItem],
        }));
      }
    }
  };

  const removeFeeItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      feeItems: prev.feeItems.filter((_, i) => i !== index),
    }));
  };

  const getTotalAmount = () => {
    return formData.feeItems.reduce((sum, item) => sum + item.amount, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.classId || formData.feeItems.length === 0) return;

    setSaving(true);
    try {
      if (editingStructure) {
        console.log("Updating fee structure:", editingStructure.id, formData);
        const updated = await feeStructureService.updateFeeStructure(
          editingStructure.id,
          {
            classId: formData.classId,
            className: formData.className,
            academicYear: formData.academicYear,
            term: formData.term,
            feeItems: formData.feeItems,
          },
        );
        console.log("Fee structure updated successfully:", updated);
      } else {
        console.log("Creating fee structure:", formData);
        const created = await feeStructureService.createFeeStructure({
          classId: formData.classId,
          className: formData.className,
          academicYear: formData.academicYear,
          term: formData.term,
          feeItems: formData.feeItems,
          isActive: true,
        });
        console.log("Fee structure created successfully:", created);
      }

      await fetchData();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error("Error saving fee structure:", error);
      alert(
        `Failed to ${editingStructure ? "update" : "create"} fee structure: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCloneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloneData.targetClassId || !cloneSourceId) return;

    setSaving(true);
    try {
      const targetClass = classes.find((c) => c.id === cloneData.targetClassId);
      if (!targetClass) throw new Error("Target class not found");

      await feeStructureService.cloneFeeStructure(
        cloneSourceId,
        cloneData.targetClassId,
        cloneData.targetAcademicYear,
        cloneData.targetTerm,
      );

      await fetchData();
      setShowCloneModal(false);
    } catch (error) {
      console.error("Error cloning fee structure:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await feeStructureService.delete(id);
      await fetchData();
    } catch (error) {
      console.error("Error deleting fee structure:", error);
    } finally {
      setDeleting(null);
    }
  };

  const toggleStatus = async (structure: FeeStructure) => {
    try {
      await feeStructureService.update(structure.id, {
        isActive: !structure.isActive,
      });
      await fetchData();
    } catch (error) {
      console.error("Error updating structure status:", error);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 rounded bg-gray-200 dark:bg-gray-700"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-24 rounded bg-gray-100 dark:bg-gray-700/50"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Fee Structures
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Create and manage fee structures for different classes and terms
            </p>
          </div>
          <div className="flex gap-2">
            {categories.length === 0 && (
              <div className="mr-4 flex items-center text-sm text-amber-600 dark:text-amber-400">
                <AlertCircleIcon className="mr-1 h-4 w-4" />
                Create fee categories first
              </div>
            )}
            <Button
              onClick={handleAddNew}
              disabled={categories.length === 0 || classes.length === 0}
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Structure
            </Button>
          </div>
        </div>
      </div>

      {/* Fee Structures List */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        {structures.length === 0 ? (
          <div className="py-12 text-center">
            <BookOpenIcon className="mx-auto mb-4 h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">
              No fee structures yet
            </h3>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
              Create your first fee structure to set fees for different classes
            </p>
            {categories.length > 0 && classes.length > 0 && (
              <Button onClick={handleAddNew}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Structure
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {structures.map((structure) => (
              <div key={structure.id} className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">
                        {structure.className} -{" "}
                        {structure.term.charAt(0).toUpperCase() +
                          structure.term.slice(1)}{" "}
                        Term
                      </h3>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          structure.isActive
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400"
                        } `}
                      >
                        {structure.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <div>
                        <span className="font-medium">Academic Year:</span>{" "}
                        {structure.academicYear}
                      </div>
                      <div>
                        <span className="font-medium">Total Amount:</span> ₦
                        {structure.totalAmount.toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium">Fee Items:</span>{" "}
                        {structure.feeItems.length} categories
                      </div>
                    </div>

                    {/* Fee Items Summary */}
                    <div className="mt-3">
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {structure.feeItems.slice(0, 6).map((item, index) => (
                          <div
                            key={index}
                            className="flex justify-between rounded bg-gray-50 px-2 py-1 text-xs dark:bg-gray-700/50"
                          >
                            <span className="truncate">
                              {item.categoryName}
                            </span>
                            <span className="font-medium">
                              ₦{item.amount.toLocaleString()}
                            </span>
                          </div>
                        ))}
                        {structure.feeItems.length > 6 && (
                          <div className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
                            +{structure.feeItems.length - 6} more
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setUpdateStructureId(structure.id);
                        setShowUpdateStudentsModal(true);
                      }}
                      title="Update student assignments"
                    >
                      <RefreshCwIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleStatus(structure)}
                    >
                      {structure.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleClone(structure.id)}
                      title="Clone to another class/term"
                    >
                      <CopyIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(structure)}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(structure.id)}
                      disabled={deleting === structure.id}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      {deleting === structure.id ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                      ) : (
                        <TrashIcon className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            resetForm();
          }}
          title={editingStructure ? "Edit Fee Structure" : "Add Fee Structure"}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Class
                </label>
                <select
                  value={formData.classId}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  required
                >
                  <option value="">Select a class</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                      {cls.section ? ` ${cls.section}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Term
                </label>
                <select
                  value={formData.term}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      term: e.target.value as "first" | "second" | "third",
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  required
                >
                  <option value="first">First Term</option>
                  <option value="second">Second Term</option>
                  <option value="third">Third Term</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Academic Year
                </label>
                <input
                  type="text"
                  value={formData.academicYear}
                  onChange={(e) =>
                    setFormData({ ...formData, academicYear: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="e.g., 2024/2025"
                  required
                />
              </div>
            </div>

            {/* Fee Items */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Fee Items
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addFeeItem}
                  disabled={categories.length === 0}
                >
                  <PlusIcon className="mr-1 h-4 w-4" />
                  Add Item
                </Button>
              </div>

              <div className="max-h-64 space-y-3 overflow-y-auto">
                {formData.feeItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-600"
                  >
                    <div className="flex-1">
                      <select
                        value={item.categoryId}
                        onChange={(e) => {
                          const category = categories.find(
                            (c) => c.id === e.target.value,
                          );
                          if (category) {
                            updateFeeItem(index, {
                              categoryId: category.id,
                              categoryName: category.name,
                              type: category.type,
                            });
                          }
                        }}
                        className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                      >
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-32">
                      <input
                        type="number"
                        value={item.amount}
                        onChange={(e) =>
                          updateFeeItem(index, {
                            amount: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                        placeholder="Amount"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={item.isMandatory}
                        onChange={(e) =>
                          updateFeeItem(index, {
                            isMandatory: e.target.checked,
                          })
                        }
                        className="rounded border-gray-300 dark:border-gray-600"
                      />
                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                        Required
                      </span>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeFeeItem(index)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="mt-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    Total Amount:
                  </span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    ₦{getTotalAmount().toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving || !formData.classId}>
                {saving ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {editingStructure ? "Updating..." : "Creating..."}
                  </>
                ) : editingStructure ? (
                  "Update Structure"
                ) : (
                  "Create Structure"
                )}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Update Student Fees Modal */}
      {showUpdateStudentsModal && (
        <UpdateStudentFeesModal
          isOpen={showUpdateStudentsModal}
          onClose={() => setShowUpdateStudentsModal(false)}
          structureId={updateStructureId}
          onSuccess={fetchData}
        />
      )}

      {/* Clone Modal */}
      {showCloneModal && (
        <Modal
          isOpen={showCloneModal}
          onClose={() => setShowCloneModal(false)}
          title="Clone Fee Structure"
          size="md"
        >
          <form onSubmit={handleCloneSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Target Class
              </label>
              <select
                value={cloneData.targetClassId}
                onChange={(e) =>
                  setCloneData({ ...cloneData, targetClassId: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                required
              >
                <option value="">Select target class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                    {cls.section ? ` ${cls.section}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Target Term
              </label>
              <select
                value={cloneData.targetTerm}
                onChange={(e) =>
                  setCloneData({
                    ...cloneData,
                    targetTerm: e.target.value as "first" | "second" | "third",
                  })
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                required
              >
                <option value="first">First Term</option>
                <option value="second">Second Term</option>
                <option value="third">Third Term</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Target Academic Year
              </label>
              <input
                type="text"
                value={cloneData.targetAcademicYear}
                onChange={(e) =>
                  setCloneData({
                    ...cloneData,
                    targetAcademicYear: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                placeholder="e.g., 2024/2025"
                required
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCloneModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving || !cloneData.targetClassId}
              >
                {saving ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Cloning...
                  </>
                ) : (
                  "Clone Structure"
                )}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
