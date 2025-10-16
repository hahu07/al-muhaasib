"use client";

import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, TagIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { feeCategoryService } from '@/services/feeService';
import type { FeeCategory, FeeType } from '@/types';

const FEE_TYPES: { value: FeeType; label: string; description: string }[] = [
  { value: 'tuition', label: 'Tuition', description: 'Academic fees for teaching and instruction' },
  { value: 'uniform', label: 'Uniform', description: 'School uniform and clothing costs' },
  { value: 'feeding', label: 'Feeding', description: 'Meal and nutrition program fees' },
  { value: 'transport', label: 'Transport', description: 'Transportation and bus service fees' },
  { value: 'books', label: 'Books & Materials', description: 'Textbooks and learning materials' },
  { value: 'sports', label: 'Sports', description: 'Sports and athletics program fees' },
  { value: 'development', label: 'Development', description: 'School development and improvement fees' },
  { value: 'examination', label: 'Examination', description: 'External and internal examination fees' },
  { value: 'pta', label: 'PTA', description: 'Parent-Teacher Association fees' },
  { value: 'computer', label: 'Computer', description: 'Computer lab and ICT fees' },
  { value: 'library', label: 'Library', description: 'Library services and maintenance fees' },
  { value: 'laboratory', label: 'Laboratory', description: 'Science laboratory fees and equipment' },
  { value: 'lesson', label: 'Extra Lessons', description: 'After-school and additional lesson fees' },
  { value: 'other', label: 'Other', description: 'Miscellaneous fees not covered above' },
];

interface FeeCategoryFormData {
  name: string;
  type: FeeType;
  description: string;
}

export function FeeCategoriesManagement() {
  const [categories, setCategories] = useState<FeeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FeeCategory | null>(null);
  const [formData, setFormData] = useState<FeeCategoryFormData>({
    name: '',
    type: 'tuition',
    description: '',
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await feeCategoryService.list();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching fee categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'tuition',
      description: '',
    });
    setEditingCategory(null);
  };

  const handleAddNew = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (category: FeeCategory) => {
    setFormData({
      name: category.name,
      type: category.type,
      description: category.description || '',
    });
    setEditingCategory(category);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingCategory) {
        await feeCategoryService.update(editingCategory.id, {
          name: formData.name,
          type: formData.type,
          description: formData.description || undefined,
        });
      } else {
        await feeCategoryService.create({
          name: formData.name,
          type: formData.type,
          description: formData.description || undefined,
          isActive: true,
        });
      }

      await fetchCategories();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving fee category:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await feeCategoryService.delete(id);
      await fetchCategories();
    } catch (error) {
      console.error('Error deleting fee category:', error);
    } finally {
      setDeleting(null);
    }
  };

  const toggleStatus = async (category: FeeCategory) => {
    try {
      await feeCategoryService.update(category.id, {
        isActive: !category.isActive,
      });
      await fetchCategories();
    } catch (error) {
      console.error('Error updating category status:', error);
    }
  };

  const getTypeInfo = (type: FeeType) => {
    return FEE_TYPES.find(t => t.value === type) || { value: type, label: type, description: '' };
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700/50 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Fee Categories
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage fee categories used in fee structures
            </p>
          </div>
          <Button onClick={handleAddNew}>
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </div>
      </div>

      {/* Categories List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {categories.length === 0 ? (
          <div className="text-center py-12">
            <TagIcon className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No fee categories yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create your first fee category to start building fee structures
            </p>
            <Button onClick={handleAddNew}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {categories.map((category) => {
              const typeInfo = getTypeInfo(category.type);
              return (
                <div key={category.id} className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100">
                          {category.name}
                        </h3>
                        <span className={`
                          inline-flex px-2 py-1 text-xs font-medium rounded-full
                          ${category.isActive 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                          }
                        `}>
                          {category.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <div>
                          <span className="font-medium">Type:</span> {typeInfo.label}
                        </div>
                        {category.description && (
                          <div>
                            <span className="font-medium">Description:</span> {category.description}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleStatus(category)}
                      >
                        {category.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(category)}
                      >
                        <PencilIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(category.id)}
                        disabled={deleting === category.id}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        {deleting === category.id ? (
                          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <TrashIcon className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
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
          title={editingCategory ? 'Edit Fee Category' : 'Add Fee Category'}
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., School Fees, Uniform Fee"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fee Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as FeeType })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {FEE_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {formData.type && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {getTypeInfo(formData.type).description}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Additional details about this fee category..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    {editingCategory ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  editingCategory ? 'Update Category' : 'Create Category'
                )}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}