"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { classService } from "@/services";
import type { SchoolClass } from "@/types";

interface ClassFormProps {
  classData?: SchoolClass;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ClassForm({ classData, onSuccess, onCancel }: ClassFormProps) {
  const isEditing = !!classData;
  const currentYear = new Date().getFullYear();

  const [formData, setFormData] = useState<{
    name: string;
    section: string;
    level: "nursery" | "primary" | "jss" | "sss";
    capacity: string;
    room: string;
    academicYear: string;
    isActive: boolean;
  }>({
    name: String(classData?.name || ""),
    section: String(classData?.section || ""),
    level: classData?.level || "primary",
    capacity: String(classData?.capacity || ""),
    room: String(classData?.room || ""),
    academicYear: String(
      classData?.academicYear || `${currentYear}/${currentYear + 1}`,
    ),
    isActive: Boolean(classData?.isActive ?? true),
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!(formData.name || "").trim()) {
      newErrors.name = "Class name is required";
    }

    if (!formData.level) {
      newErrors.level = "Level is required";
    }

    // Only validate capacity if provided
    if (formData.capacity) {
      const capacity = parseInt(formData.capacity);
      if (isNaN(capacity) || capacity < 1) {
        newErrors.capacity = "Capacity must be at least 1 if specified";
      } else if (
        isEditing &&
        classData &&
        capacity < classData.currentEnrollment
      ) {
        newErrors.capacity = `Capacity cannot be less than current enrollment (${classData.currentEnrollment})`;
      }
    }

    if (!(formData.academicYear || "").trim()) {
      newErrors.academicYear = "Academic year is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);

      const classPayload = {
        name: (formData.name || "").trim(),
        section: (formData.section || "").trim() || undefined,
        level: formData.level,
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
        room: (formData.room || "").trim() || undefined,
        academicYear: (formData.academicYear || "").trim(),
        isActive: formData.isActive,
        currentEnrollment: classData?.currentEnrollment || 0,
        teacherId: classData?.teacherId,
      };

      if (isEditing && classData) {
        await classService.update(classData.id, classPayload);
      } else {
        await classService.create(
          classPayload as Omit<SchoolClass, "id" | "createdAt" | "updatedAt">,
        );
      }

      onSuccess?.();
    } catch (error) {
      console.error("Error saving class:", error);
      alert(
        `Failed to ${isEditing ? "update" : "create"} class. Please try again.`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Class Details */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Class Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            placeholder="e.g., Primary 1, JSS 1"
            required
            helperText="The main class name"
          />

          <Input
            label="Section (Optional)"
            name="section"
            value={formData.section}
            onChange={handleChange}
            error={errors.section}
            placeholder="e.g., A, B, Science, Arts"
            helperText="Section or stream if applicable"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="w-full">
            <Label htmlFor="level">
              Level
              <span className="ml-1 text-red-500">*</span>
            </Label>
            <Select
              value={formData.level}
              onValueChange={(value) => {
                setFormData((prev) => ({
                  ...prev,
                  level: value as "nursery" | "primary" | "jss" | "sss",
                }));
                if (errors.level) {
                  setErrors((prev) => ({ ...prev, level: "" }));
                }
              }}
            >
              <SelectTrigger className={errors.level ? "border-red-500" : ""}>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nursery">Nursery</SelectItem>
                <SelectItem value="primary">Primary</SelectItem>
                <SelectItem value="jss">JSS (Junior Secondary)</SelectItem>
                <SelectItem value="sss">SSS (Senior Secondary)</SelectItem>
              </SelectContent>
            </Select>
            {errors.level && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.level}
              </p>
            )}
          </div>

          <Input
            label="Capacity (Optional)"
            name="capacity"
            type="number"
            value={formData.capacity}
            onChange={handleChange}
            error={errors.capacity}
            min="1"
            placeholder="Leave empty for unlimited"
            helperText={
              isEditing && classData
                ? `Current enrollment: ${classData.currentEnrollment}. Leave empty for unlimited capacity.`
                : "Maximum number of students. Leave empty for unlimited capacity."
            }
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Room/Location (Optional)"
            name="room"
            value={formData.room}
            onChange={handleChange}
            error={errors.room}
            placeholder="e.g., Room A1, Block B"
            helperText="Physical location of the class"
          />

          <Input
            label="Academic Year"
            name="academicYear"
            value={formData.academicYear}
            onChange={handleChange}
            error={errors.academicYear}
            placeholder="e.g., 2025/2026"
            required
            helperText="Format: YYYY/YYYY"
          />
        </div>

        {/* Active Status Toggle */}
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50">
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
            Active Class
          </label>
          <span className="text-xs text-gray-600 dark:text-gray-400">
            (Inactive classes won&apos;t appear in student registration)
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? (
            <>
              <span className="mr-2 animate-spin">⏳</span>
              {isEditing ? "Updating..." : "Creating..."}
            </>
          ) : (
            <>{isEditing ? "Update Class" : "Create Class"}</>
          )}
        </Button>
      </div>
    </form>
  );
}
