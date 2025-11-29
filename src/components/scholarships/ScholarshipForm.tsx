"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { scholarshipService, classService, studentService } from "@/services";
import {
  PERMISSIONS,
  type Scholarship,
  type FeeType,
  type Class,
  type Student,
} from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { Checkbox } from "@/components/ui/checkbox";

interface ScholarshipFormProps {
  scholarship?: Scholarship;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const FEE_TYPES: { value: FeeType; label: string }[] = [
  { value: "tuition", label: "Tuition" },
  { value: "uniform", label: "Uniform" },
  { value: "feeding", label: "Feeding" },
  { value: "transport", label: "Transport" },
  { value: "books", label: "Books" },
  { value: "sports", label: "Sports" },
  { value: "development", label: "Development" },
  { value: "examination", label: "Examination" },
  { value: "pta", label: "PTA" },
  { value: "computer", label: "Computer" },
  { value: "library", label: "Library" },
  { value: "laboratory", label: "Laboratory" },
  { value: "lesson", label: "Extra Lessons" },
  { value: "other", label: "Other" },
];

export function ScholarshipForm({
  scholarship,
  onSuccess,
  onCancel,
}: ScholarshipFormProps) {
  const { user, hasPermission } = useAuth();
  const isEditing = !!scholarship;
  const canCreateScholarships = hasPermission(PERMISSIONS.SCHOLARSHIPS_CREATE);
  const canEditScholarships = hasPermission(PERMISSIONS.SCHOLARSHIPS_EDIT);
  const canManageScholarship = isEditing
    ? canEditScholarships
    : canCreateScholarships;

  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>(
    scholarship?.classIds || []
  );
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(
    scholarship?.studentIds || []
  );
  const [applicableFeeTypes, setApplicableFeeTypes] = useState<FeeType[]>(
    scholarship?.applicableToFeeTypes || []
  );
  const [excludedFeeTypes, setExcludedFeeTypes] = useState<FeeType[]>(
    scholarship?.excludedFeeTypes || []
  );
  const [formData, setFormData] = useState({
    name: scholarship?.name || "",
    description: scholarship?.description || "",
    type: scholarship?.type || "percentage",
    percentageOff: scholarship?.percentageOff?.toString() || "",
    fixedAmountOff: scholarship?.fixedAmountOff?.toString() || "",
    applicableTo: scholarship?.applicableTo || "all",
    startDate: scholarship?.startDate || "",
    endDate: scholarship?.endDate || "",
    academicYear: scholarship?.academicYear || "",
    maxBeneficiaries: scholarship?.maxBeneficiaries?.toString() || "",
    maxDiscountPerStudent: scholarship?.maxDiscountPerStudent?.toString() || "",
    sponsor: scholarship?.sponsor || "",
    status: scholarship?.status || "active",
  });

  const loadClassesAndStudents = useCallback(async () => {
    if (!canManageScholarship) {
      return;
    }
    try {
      const [classesData, studentsData] = await Promise.all([
        classService.list(),
        studentService.list(),
      ]);
      setClasses(classesData);
      setStudents(studentsData);
    } catch (error) {
      console.error("Error loading classes and students:", error);
    }
  }, [canManageScholarship]);

  useEffect(() => {
    void loadClassesAndStudents();
  }, [loadClassesAndStudents]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!canManageScholarship) {
      alert(
        `You do not have permission to ${isEditing ? "edit" : "create"} scholarships.`
      );
      return;
    }

    setLoading(true);
    try {
      const data: any = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        type: formData.type,
        applicableTo: formData.applicableTo,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        academicYear: formData.academicYear || undefined,
        status: formData.status,
        sponsor: formData.sponsor.trim() || undefined,
      };

      // Add type-specific fields
      if (formData.type === "percentage") {
        data.percentageOff = parseFloat(formData.percentageOff);
      } else if (formData.type === "fixed_amount") {
        data.fixedAmountOff = parseFloat(formData.fixedAmountOff);
      }

      // Add optional fields
      if (formData.maxBeneficiaries) {
        data.maxBeneficiaries = parseInt(formData.maxBeneficiaries);
      }
      if (formData.maxDiscountPerStudent) {
        data.maxDiscountPerStudent = parseFloat(formData.maxDiscountPerStudent);
      }

      // Add class/student selection
      if (formData.applicableTo === "specific_classes" && selectedClassIds.length > 0) {
        data.classIds = selectedClassIds;
      }
      if (formData.applicableTo === "specific_students" && selectedStudentIds.length > 0) {
        data.studentIds = selectedStudentIds;
      }

      // Add fee type restrictions
      if (applicableFeeTypes.length > 0) {
        data.applicableToFeeTypes = applicableFeeTypes;
      }
      if (excludedFeeTypes.length > 0) {
        data.excludedFeeTypes = excludedFeeTypes;
      }

      if (isEditing) {
        await scholarshipService.update(scholarship.id, data);
      } else {
        data.createdBy = user.key;
        data.currentBeneficiaries = 0;
        await scholarshipService.create(data);
      }

      onSuccess?.();
    } catch (error) {
      console.error("Error saving scholarship:", error);
      alert(
        `Failed to ${isEditing ? "update" : "create"} scholarship: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  };

  if (!canManageScholarship) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          You do not have permission to {isEditing ? "edit" : "create"} scholarships.
        </p>
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Close
          </Button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Scholarship Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Excellence Award 2024"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Brief description of the scholarship"
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="sponsor">Sponsor (Optional)</Label>
          <Input
            id="sponsor"
            value={formData.sponsor}
            onChange={(e) =>
              setFormData({ ...formData, sponsor: e.target.value })
            }
            placeholder="e.g., ABC Foundation"
          />
        </div>
      </div>

      {/* Scholarship Type */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
          Discount Type
        </h3>

        <div>
          <Label htmlFor="type">Type *</Label>
          <Select
            value={formData.type}
            onValueChange={(value) =>
              setFormData({ ...formData, type: value as any })
            }
          >
            <SelectTrigger id="type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Percentage Off</SelectItem>
              <SelectItem value="fixed_amount">Fixed Amount Off</SelectItem>
              <SelectItem value="full_waiver">Full Waiver (100%)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.type === "percentage" && (
          <div>
            <Label htmlFor="percentageOff">Percentage Off (%) *</Label>
            <Input
              id="percentageOff"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={formData.percentageOff}
              onChange={(e) =>
                setFormData({ ...formData, percentageOff: e.target.value })
              }
              placeholder="e.g., 25"
              required={formData.type === "percentage"}
            />
            <p className="mt-1 text-sm text-gray-500">
              Enter a value between 0 and 100
            </p>
          </div>
        )}

        {formData.type === "fixed_amount" && (
          <div>
            <Label htmlFor="fixedAmountOff">Fixed Amount Off (₦) *</Label>
            <Input
              id="fixedAmountOff"
              type="number"
              min="0"
              step="0.01"
              value={formData.fixedAmountOff}
              onChange={(e) =>
                setFormData({ ...formData, fixedAmountOff: e.target.value })
              }
              placeholder="e.g., 50000"
              required={formData.type === "fixed_amount"}
            />
          </div>
        )}
      </div>

      {/* Applicability */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
          Who Can Receive This?
        </h3>

        <div>
          <Label htmlFor="applicableTo">Applicable To *</Label>
          <Select
            value={formData.applicableTo}
            onValueChange={(value) =>
              setFormData({ ...formData, applicableTo: value as any })
            }
          >
            <SelectTrigger id="applicableTo">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Students</SelectItem>
              <SelectItem value="specific_classes">Specific Classes</SelectItem>
              <SelectItem value="specific_students">
                Specific Students
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Class Selection */}
        {formData.applicableTo === "specific_classes" && (
          <div>
            <Label>Select Classes</Label>
            <div className="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
              {classes.length === 0 ? (
                <p className="text-sm text-gray-500">No classes available</p>
              ) : (
                classes.map((cls) => (
                  <div key={cls.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`class-${cls.id}`}
                      checked={selectedClassIds.includes(cls.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedClassIds([...selectedClassIds, cls.id]);
                        } else {
                          setSelectedClassIds(
                            selectedClassIds.filter((id) => id !== cls.id)
                          );
                        }
                      }}
                    />
                    <label
                      htmlFor={`class-${cls.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {cls.name}
                    </label>
                  </div>
                ))
              )}
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {selectedClassIds.length} class(es) selected
            </p>
          </div>
        )}

        {/* Student Selection */}
        {formData.applicableTo === "specific_students" && (
          <div>
            <Label>Select Students</Label>
            <div className="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
              {students.length === 0 ? (
                <p className="text-sm text-gray-500">No students available</p>
              ) : (
                students.map((student) => (
                  <div key={student.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`student-${student.id}`}
                      checked={selectedStudentIds.includes(student.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedStudentIds([...selectedStudentIds, student.id]);
                        } else {
                          setSelectedStudentIds(
                            selectedStudentIds.filter((id) => id !== student.id)
                          );
                        }
                      }}
                    />
                    <label
                      htmlFor={`student-${student.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {student.surname} {student.firstname}
                      {student.currentClass && (
                        <span className="ml-2 text-xs text-gray-500">
                          ({student.currentClass})
                        </span>
                      )}
                    </label>
                  </div>
                ))
              )}
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {selectedStudentIds.length} student(s) selected
            </p>
          </div>
        )}
      </div>

      {/* Fee Type Restrictions */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
          Fee Type Restrictions (Optional)
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Leave both empty to apply to all fee types
        </p>

        {/* Applicable Fee Types */}
        <div>
          <Label>Apply Only To These Fee Types</Label>
          <div className="mt-2 grid grid-cols-2 gap-2 rounded-md border p-3 sm:grid-cols-3">
            {FEE_TYPES.map((feeType) => (
              <div key={feeType.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`applicable-${feeType.value}`}
                  checked={applicableFeeTypes.includes(feeType.value)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setApplicableFeeTypes([...applicableFeeTypes, feeType.value]);
                      // Remove from excluded if present
                      setExcludedFeeTypes(
                        excludedFeeTypes.filter((t) => t !== feeType.value)
                      );
                    } else {
                      setApplicableFeeTypes(
                        applicableFeeTypes.filter((t) => t !== feeType.value)
                      );
                    }
                  }}
                />
                <label
                  htmlFor={`applicable-${feeType.value}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {feeType.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Excluded Fee Types */}
        <div>
          <Label>Exclude These Fee Types</Label>
          <div className="mt-2 grid grid-cols-2 gap-2 rounded-md border p-3 sm:grid-cols-3">
            {FEE_TYPES.map((feeType) => (
              <div key={feeType.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`excluded-${feeType.value}`}
                  checked={excludedFeeTypes.includes(feeType.value)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setExcludedFeeTypes([...excludedFeeTypes, feeType.value]);
                      // Remove from applicable if present
                      setApplicableFeeTypes(
                        applicableFeeTypes.filter((t) => t !== feeType.value)
                      );
                    } else {
                      setExcludedFeeTypes(
                        excludedFeeTypes.filter((t) => t !== feeType.value)
                      );
                    }
                  }}
                />
                <label
                  htmlFor={`excluded-${feeType.value}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {feeType.label}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Validity Period */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
          Validity Period
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="startDate">Start Date *</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) =>
                setFormData({ ...formData, startDate: e.target.value })
              }
              required
            />
          </div>

          <div>
            <Label htmlFor="endDate">End Date (Optional)</Label>
            <Input
              id="endDate"
              type="date"
              value={formData.endDate}
              onChange={(e) =>
                setFormData({ ...formData, endDate: e.target.value })
              }
              min={formData.startDate}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="academicYear">Academic Year (Optional)</Label>
          <Input
            id="academicYear"
            value={formData.academicYear}
            onChange={(e) =>
              setFormData({ ...formData, academicYear: e.target.value })
            }
            placeholder="e.g., 2024/2025"
          />
        </div>
      </div>

      {/* Limits */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
          Limits (Optional)
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="maxBeneficiaries">Max Beneficiaries</Label>
            <Input
              id="maxBeneficiaries"
              type="number"
              min="1"
              value={formData.maxBeneficiaries}
              onChange={(e) =>
                setFormData({ ...formData, maxBeneficiaries: e.target.value })
              }
              placeholder="e.g., 10"
            />
            <p className="mt-1 text-sm text-gray-500">
              Maximum number of students who can use this scholarship
            </p>
          </div>

          <div>
            <Label htmlFor="maxDiscountPerStudent">
              Max Discount Per Student (₦)
            </Label>
            <Input
              id="maxDiscountPerStudent"
              type="number"
              min="0"
              step="0.01"
              value={formData.maxDiscountPerStudent}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maxDiscountPerStudent: e.target.value,
                })
              }
              placeholder="e.g., 100000"
            />
          </div>
        </div>
      </div>

      {/* Status */}
      <div>
        <Label htmlFor="status">Status *</Label>
        <Select
          value={formData.status}
          onValueChange={(value) =>
            setFormData({ ...formData, status: value as any })
          }
        >
          <SelectTrigger id="status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading
            ? isEditing
              ? "Updating..."
              : "Creating..."
            : isEditing
              ? "Update Scholarship"
              : "Create Scholarship"}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
