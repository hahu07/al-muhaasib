"use client";

import { useState, useEffect } from "react";
import {
  UsersIcon,
  UserIcon,
  CheckIcon,
  AlertCircleIcon,
  CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  feeStructureService,
  studentFeeAssignmentService,
} from "@/services/feeService";
import { classService } from "@/services/classService";
import { studentService, scholarshipService } from "@/services";
import type { FeeStructure, StudentProfile, SchoolClass, Scholarship } from "@/types";

interface FeeAssignmentData {
  structureId: string;
  structureName: string;
  studentIds: string[];
  dueDate?: string;
  scholarshipId?: string;
  selectedOptionalFees?: string[];
  // Per-student optional fees: map of studentId to array of selected categoryIds
  studentOptionalFees?: Record<string, string[]>;
}

export function FeeAssignment() {
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [assignmentType, setAssignmentType] = useState<"individual" | "bulk">(
    "individual",
  );
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<FeeAssignmentData>({
    structureId: "",
    structureName: "",
    studentIds: [],
    dueDate: "",
  });

  const [existingAssignments, setExistingAssignments] = useState<Set<string>>(
    new Set(),
  );

  const [filters, setFilters] = useState({
    classId: "",
    academicYear:
      new Date().getFullYear() + "/" + (new Date().getFullYear() + 1),
    term: "first" as "first" | "second" | "third",
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchFilteredStructures();
  }, [filters]);

  const fetchData = async () => {
    try {
      const [classesData, studentsData, scholarshipsData] = await Promise.all([
        classService.getActiveClasses(),
        studentService.list(),
        scholarshipService.getActiveScholarships(),
      ]);

      setClasses(classesData);
      setStudents(studentsData);
      setScholarships(scholarshipsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilteredStructures = async () => {
    try {
      let filteredStructures: FeeStructure[] = [];

      if (filters.classId) {
        // Get structures for specific class
        const structure = await feeStructureService.getByClassAndTerm(
          filters.classId,
          filters.academicYear,
          filters.term,
        );
        if (structure) {
          filteredStructures = [structure];
        }
      } else {
        // Get all structures for the academic year
        filteredStructures = await feeStructureService.getByAcademicYear(
          filters.academicYear,
        );
      }

      setStructures(filteredStructures);
    } catch (error) {
      console.error("Error fetching structures:", error);
    }
  };

  const getClassStudents = (classId: string) => {
    return students.filter((s) => s.classId === classId && s.isActive);
  };

  const getStructureStudents = (structureId: string) => {
    const structure = structures.find((s) => s.id === structureId);
    if (!structure) return [];
    return getClassStudents(structure.classId);
  };

  const handleStructureSelect = async (structureId: string) => {
    const structure = structures.find((s) => s.id === structureId);
    if (!structure) return;

    // Load existing assignments for this structure
    try {
      const assignments = await studentFeeAssignmentService.getByClassAndTerm(
        structure.classId,
        structure.academicYear,
        structure.term,
      );
      const existingStudentIds = new Set(assignments.map((a) => a.studentId));
      setExistingAssignments(existingStudentIds);
    } catch (error) {
      console.error("Error loading existing assignments:", error);
      setExistingAssignments(new Set());
    }

    if (assignmentType === "bulk") {
      // For bulk assignment, pre-select all students but allow deselection
      const classStudents = getClassStudents(structure.classId).filter(
        (s) => !existingStudentIds.has(s.id)
      );
      setFormData({
        structureId,
        structureName: `${structure.className} - ${structure.term.charAt(0).toUpperCase() + structure.term.slice(1)} Term`,
        studentIds: classStudents.map((s) => s.id),
        studentOptionalFees: {},
      });
    } else {
      setFormData({
        structureId,
        structureName: `${structure.className} - ${structure.term.charAt(0).toUpperCase() + structure.term.slice(1)} Term`,
        studentIds: [],
        studentOptionalFees: {},
      });
    }

    setShowModal(true);
  };

  const toggleStudent = (studentId: string) => {
    console.log('Toggle student clicked:', studentId);
    console.log('Current studentIds:', formData.studentIds);
    setFormData((prev) => {
      const newStudentIds = prev.studentIds.includes(studentId)
        ? prev.studentIds.filter((id) => id !== studentId)
        : [...prev.studentIds, studentId];
      console.log('New studentIds:', newStudentIds);
      return {
        ...prev,
        studentIds: newStudentIds,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.structureId || formData.studentIds.length === 0) return;

    setSaving(true);
    try {
      const structure = structures.find((s) => s.id === formData.structureId);
      if (!structure) throw new Error("Fee structure not found");

      // Check for existing assignments to prevent duplicates
      const existingAssignments =
        await studentFeeAssignmentService.getByClassAndTerm(
          structure.classId,
          structure.academicYear,
          structure.term,
        );

      const existingStudentIds = new Set(
        existingAssignments.map((a) => a.studentId),
      );
      const newStudentIds = formData.studentIds.filter(
        (id) => !existingStudentIds.has(id),
      );
      const duplicateCount = formData.studentIds.length - newStudentIds.length;

      if (duplicateCount > 0) {
        const proceed = confirm(
          `${duplicateCount} student${duplicateCount > 1 ? "s" : ""} already have${duplicateCount === 1 ? "s" : ""} this fee assignment. ` +
            `Do you want to proceed with assigning fees to the remaining ${newStudentIds.length} student${newStudentIds.length !== 1 ? "s" : ""}?`,
        );
        if (!proceed) {
          setSaving(false);
          return;
        }
      }

      if (newStudentIds.length === 0) {
        alert("All selected students already have this fee assignment.");
        setSaving(false);
        return;
      }

      // Assign fee structure to students without existing assignments
      let successCount = 0;
      for (const studentId of newStudentIds) {
        const student = students.find((s) => s.id === studentId);
        if (!student) continue;

        try {
          // Get student-specific optional fees or use general selection
          const studentOptionalFees = formData.studentOptionalFees?.[studentId] || formData.selectedOptionalFees || [];
          
          await studentFeeAssignmentService.assignFeesToStudent(
            studentId,
            `${student.firstname} ${student.surname}`,
            student.classId,
            student.className,
            structure.id,
            structure.academicYear,
            structure.term,
            structure.feeItems,
            formData.dueDate,
            {
              scholarshipId: formData.scholarshipId || undefined,
              selectedOptionalFees: studentOptionalFees,
            },
          );
          successCount++;
        } catch (error) {
          // Log individual assignment errors but continue with others
          console.error(
            `Error assigning fees to student ${student.firstname} ${student.surname}:`,
            error,
          );
        }
      }

      setShowModal(false);
      resetForm();

      // Show success message with details
      let message = `Successfully assigned fee structure to ${successCount} student${successCount > 1 ? "s" : ""}.`;
      if (duplicateCount > 0) {
        message += ` ${duplicateCount} student${duplicateCount > 1 ? "s were" : " was"} skipped (already assigned).`;
      }
      alert(message);
    } catch (error) {
      console.error("Error assigning fee structure:", error);
      alert("Error assigning fee structure. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      structureId: "",
      structureName: "",
      studentIds: [],
      dueDate: "",
      scholarshipId: "",
      selectedOptionalFees: [],
      studentOptionalFees: {},
    });
    setExistingAssignments(new Set());
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
                className="h-20 rounded bg-gray-100 dark:bg-gray-700/50"
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
              Fee Assignment
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Assign fee structures to students individually or in bulk
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setAssignmentType("individual")}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                assignmentType === "individual"
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              <UserIcon className="mr-2 inline-block h-4 w-4" />
              Individual
            </button>
            <button
              onClick={() => setAssignmentType("bulk")}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                assignmentType === "bulk"
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              <UsersIcon className="mr-2 inline-block h-4 w-4" />
              Bulk
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-gray-100">
          Filter Fee Structures
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Class (Optional)
            </label>
            <select
              value={filters.classId}
              onChange={(e) =>
                setFilters({ ...filters, classId: e.target.value })
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="">All Classes</option>
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
              Academic Year
            </label>
            <input
              type="text"
              value={filters.academicYear}
              onChange={(e) =>
                setFilters({ ...filters, academicYear: e.target.value })
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              placeholder="e.g., 2024/2025"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Term
            </label>
            <select
              value={filters.term}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  term: e.target.value as "first" | "second" | "third",
                })
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="first">First Term</option>
              <option value="second">Second Term</option>
              <option value="third">Third Term</option>
            </select>
          </div>
        </div>
      </div>

      {/* Fee Structures */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="border-b border-gray-200 p-6 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Available Fee Structures
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Click on a fee structure to assign it to students
          </p>
        </div>

        {structures.length === 0 ? (
          <div className="py-12 text-center">
            <AlertCircleIcon className="mx-auto mb-4 h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">
              No fee structures found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              No fee structures match your current filters. Try adjusting the
              filters or create new fee structures.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {structures.map((structure) => {
              const studentsCount = getStructureStudents(structure.id).length;
              return (
                <div key={structure.id} className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h4 className="mb-2 font-medium text-gray-900 dark:text-gray-100">
                        {structure.className} -{" "}
                        {structure.term.charAt(0).toUpperCase() +
                          structure.term.slice(1)}{" "}
                        Term
                      </h4>
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
                          <span className="font-medium">
                            Students in Class:
                          </span>{" "}
                          {studentsCount}
                        </div>
                        <div>
                          <span className="font-medium">Fee Items:</span>{" "}
                          {structure.feeItems.length} categories
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col gap-2">
                      <Button
                        onClick={() => handleStructureSelect(structure.id)}
                        disabled={studentsCount === 0}
                      >
                        Assign to Students
                      </Button>
                      {studentsCount === 0 && (
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          No students in this class
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Assignment Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            resetForm();
          }}
          title={`Assign Fee Structure - ${assignmentType === "bulk" ? "Bulk" : "Individual"}`}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className={`rounded-lg p-4 ${
              assignmentType === "bulk" 
                ? "bg-blue-50 dark:bg-blue-900/20" 
                : "bg-purple-50 dark:bg-purple-900/20"
            }`}>
              <h4 className={`mb-2 font-medium ${
                assignmentType === "bulk"
                  ? "text-blue-900 dark:text-blue-100"
                  : "text-purple-900 dark:text-purple-100"
              }`}>
                {formData.structureName}
              </h4>
              <p className={`text-sm ${
                assignmentType === "bulk"
                  ? "text-blue-700 dark:text-blue-300"
                  : "text-purple-700 dark:text-purple-300"
              }`}>
                {assignmentType === "bulk"
                  ? "All students are pre-selected. Uncheck any you don't want to assign fees to."
                  : "Select individual students below by checking their boxes. Fees will only be assigned to checked students."}
              </p>
              {assignmentType === "individual" && formData.studentIds.length === 0 && (
                <p className="mt-2 text-sm font-medium text-purple-900 dark:text-purple-100">
                  ⚠️ No students selected yet - check the boxes below
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Due Date (Optional)
              </label>
              <div className="relative">
                <CalendarIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, dueDate: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white py-2 pr-4 pl-10 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
            </div>

            {/* Scholarship Selection */}
            {scholarships.length > 0 && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Apply Scholarship (Optional)
                </label>
                <select
                  value={formData.scholarshipId || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, scholarshipId: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="">No Scholarship</option>
                  {scholarships.map((scholarship) => {
                    const label =
                      scholarship.type === "percentage"
                        ? `${scholarship.percentageOff}% Off`
                        : scholarship.type === "fixed_amount"
                          ? `₦${scholarship.fixedAmountOff?.toLocaleString()} Off`
                          : "Full Waiver";
                    return (
                      <option key={scholarship.id} value={scholarship.id}>
                        {scholarship.name} ({label})
                      </option>
                    );
                  })}
                </select>
                {formData.scholarshipId && (
                  <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                    ✓ Discount will be applied automatically to selected students
                  </p>
                )}
              </div>
            )}

            {/* Optional Fees Selection - Global (applies to all selected students) */}
            {(() => {
              const structure = structures.find(
                (s) => s.id === formData.structureId,
              );
              const optionalFees = structure?.feeItems.filter(
                (item) => item.isOptional,
              ) || [];
              
              if (optionalFees.length === 0 || assignmentType !== "bulk") return null;
              
              return (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Optional Fees (Apply to all students)
                  </label>
                  <div className="space-y-2 rounded-lg border border-gray-200 p-3 dark:border-gray-600">
                    {optionalFees.map((fee) => (
                      <label
                        key={fee.categoryId}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={(formData.selectedOptionalFees || []).includes(
                            fee.categoryId,
                          )}
                          onChange={(e) => {
                            const selected = formData.selectedOptionalFees || [];
                            setFormData({
                              ...formData,
                              selectedOptionalFees: e.target.checked
                                ? [...selected, fee.categoryId]
                                : selected.filter((id) => id !== fee.categoryId),
                            });
                          }}
                          className="rounded border-gray-300 dark:border-gray-600"
                        />
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {fee.categoryName} - ₦{fee.amount.toLocaleString()}
                        </span>
                      </label>
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    These optional fees will apply to all selected students. You can customize per student below.
                  </p>
                </div>
              );
            })()}

            {/* Student Selection */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select Students ({formData.studentIds.length} selected)
                </label>
                {assignmentType === "individual" && (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const allStudents = getStructureStudents(
                          formData.structureId,
                        );
                        setFormData((prev) => ({
                          ...prev,
                          studentIds: allStudents.map((s) => s.id),
                        }));
                      }}
                    >
                      Select All
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, studentIds: [] }))
                      }
                    >
                      Clear All
                    </Button>
                  </div>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-600">
                {getStructureStudents(formData.structureId).map((student) => {
                  const hasExistingAssignment = existingAssignments.has(
                    student.id,
                  );
                  const isSelected = formData.studentIds.includes(student.id);
                  const structure = structures.find((s) => s.id === formData.structureId);
                  const optionalFees = structure?.feeItems.filter((item) => item.isOptional) || [];
                  const studentOptionalFees = formData.studentOptionalFees?.[student.id] || formData.selectedOptionalFees || [];
                  
                  return (
                    <div
                      key={student.id}
                      className={`border-b border-gray-100 last:border-b-0 dark:border-gray-700 ${
                        hasExistingAssignment
                          ? "bg-amber-50 dark:bg-amber-900/10"
                          : ""
                      }`}
                    >
                      <div className="flex items-center p-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleStudent(student.id)}
                          disabled={hasExistingAssignment}
                          className="mr-3 rounded border-gray-300 dark:border-gray-600"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {student.firstname} {student.surname}
                            </p>
                            {hasExistingAssignment && (
                              <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                                Already Assigned
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {student.admissionNumber} • Current Balance: ₦{student.balance.toLocaleString()}
                            {isSelected && (() => {
                              const studentFees = formData.studentOptionalFees?.[student.id] || [];
                              const selectedFeeItems = structure?.feeItems.filter(
                                fee => fee.isMandatory || studentFees.includes(fee.categoryId)
                              ) || [];
                              const originalAmount = selectedFeeItems.reduce((sum, fee) => sum + fee.amount, 0);
                              
                              let discountAmount = 0;
                              const selectedScholarship = formData.scholarshipId 
                                ? scholarships.find(s => s.id === formData.scholarshipId)
                                : null;
                              
                              if (selectedScholarship) {
                                if (selectedScholarship.type === 'percentage' && selectedScholarship.percentageOff) {
                                  discountAmount = (originalAmount * selectedScholarship.percentageOff) / 100;
                                } else if (selectedScholarship.type === 'fixed_amount' && selectedScholarship.fixedAmountOff) {
                                  discountAmount = Math.min(selectedScholarship.fixedAmountOff, originalAmount);
                                } else if (selectedScholarship.type === 'full_waiver') {
                                  discountAmount = originalAmount;
                                }
                                if (selectedScholarship.maxDiscountPerStudent) {
                                  discountAmount = Math.min(discountAmount, selectedScholarship.maxDiscountPerStudent);
                                }
                              }
                              
                              const newAmount = originalAmount - discountAmount;
                              const newBalance = student.balance + newAmount;
                              
                              return originalAmount > 0 ? (
                                <span className="ml-1 font-medium text-blue-600 dark:text-blue-400">
                                  → ₦{newBalance.toLocaleString()}
                                </span>
                              ) : null;
                            })()}
                          </p>
                        </div>
                        {student.balance === 0 && student.totalPaid > 0 && (
                          <CheckIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                        )}
                      </div>
                      
                      {/* Per-Student Fee Selection */}
                      {isSelected && structure && structure.feeItems.length > 0 && (() => {
                        const studentFees = formData.studentOptionalFees?.[student.id] || [];
                        const selectedFeeItems = structure.feeItems.filter(
                          fee => fee.isMandatory || studentFees.includes(fee.categoryId)
                        );
                        const originalAmount = selectedFeeItems.reduce((sum, fee) => sum + fee.amount, 0);
                        
                        // Calculate scholarship discount if applied
                        let discountAmount = 0;
                        let totalAmount = originalAmount;
                        const selectedScholarship = formData.scholarshipId 
                          ? scholarships.find(s => s.id === formData.scholarshipId)
                          : null;
                        
                        if (selectedScholarship) {
                          if (selectedScholarship.type === 'percentage' && selectedScholarship.percentageOff) {
                            discountAmount = (originalAmount * selectedScholarship.percentageOff) / 100;
                          } else if (selectedScholarship.type === 'fixed_amount' && selectedScholarship.fixedAmountOff) {
                            discountAmount = Math.min(selectedScholarship.fixedAmountOff, originalAmount);
                          } else if (selectedScholarship.type === 'full_waiver') {
                            discountAmount = originalAmount;
                          }
                          
                          // Apply max discount per student if specified
                          if (selectedScholarship.maxDiscountPerStudent) {
                            discountAmount = Math.min(discountAmount, selectedScholarship.maxDiscountPerStudent);
                          }
                          
                          totalAmount = originalAmount - discountAmount;
                        }
                        
                        return (
                        <div className="border-t border-gray-100 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800/50">
                          <div className="mb-2 flex items-center justify-between">
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                              Select fees for {student.firstname}:
                            </p>
                            <div className="text-right text-xs">
                              {selectedScholarship ? (
                                <>
                                  <p className="text-gray-500 line-through dark:text-gray-400">
                                    ₦{originalAmount.toLocaleString()}
                                  </p>
                                  <p className="text-green-600 dark:text-green-400">
                                    -₦{discountAmount.toLocaleString()}
                                  </p>
                                  <p className="font-semibold text-blue-600 dark:text-blue-400">
                                    ₦{totalAmount.toLocaleString()}
                                  </p>
                                </>
                              ) : (
                                <p className="font-semibold text-blue-600 dark:text-blue-400">
                                  Total: ₦{totalAmount.toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            {structure.feeItems.map((fee) => {
                              const isOptional = fee.isOptional || !fee.isMandatory;
                              const studentFees = formData.studentOptionalFees?.[student.id] || [];
                              // Mandatory fees are always included, optional fees need to be selected
                              const isChecked = fee.isMandatory || studentFees.includes(fee.categoryId);
                              
                              return (
                                <label
                                  key={fee.categoryId}
                                  className={`flex items-center gap-2 rounded px-2 py-1.5 text-xs ${
                                    fee.isMandatory 
                                      ? 'bg-blue-50 dark:bg-blue-900/20' 
                                      : 'bg-white dark:bg-gray-700'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    disabled={fee.isMandatory}
                                    onChange={(e) => {
                                      const currentFees = formData.studentOptionalFees || {};
                                      const studentCurrentFees = currentFees[student.id] || [];
                                      const newStudentFees = e.target.checked
                                        ? [...studentCurrentFees, fee.categoryId]
                                        : studentCurrentFees.filter((id) => id !== fee.categoryId);
                                      
                                      setFormData({
                                        ...formData,
                                        studentOptionalFees: {
                                          ...currentFees,
                                          [student.id]: newStudentFees,
                                        },
                                      });
                                    }}
                                    className="h-3 w-3 rounded border-gray-300 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600"
                                  />
                                  <span className="flex-1 text-gray-900 dark:text-gray-100">
                                    {fee.categoryName}
                                  </span>
                                  <span className="font-medium text-gray-900 dark:text-gray-100">
                                    ₦{fee.amount.toLocaleString()}
                                  </span>
                                  {fee.isMandatory && (
                                    <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                      Required
                                    </span>
                                  )}
                                  {isOptional && !fee.isMandatory && (
                                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                                      Optional
                                    </span>
                                  )}
                                </label>
                              );
                            })}
                          </div>
                          <p className="mt-2 text-[10px] text-gray-500 dark:text-gray-400">
                            💡 Required fees are auto-selected. Uncheck optional fees student doesn't need.
                          </p>
                        </div>
                        );
                      })()}
                    </div>
                  );
                })}
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
              <Button
                type="submit"
                disabled={saving || formData.studentIds.length === 0}
              >
                {saving ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Assigning...
                  </>
                ) : (
                  `Assign to ${formData.studentIds.length} Student${formData.studentIds.length > 1 ? "s" : ""}`
                )}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
