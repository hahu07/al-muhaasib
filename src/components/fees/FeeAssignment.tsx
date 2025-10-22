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
import { studentService } from "@/services";
import type { FeeStructure, StudentProfile, SchoolClass } from "@/types";

interface FeeAssignmentData {
  structureId: string;
  structureName: string;
  studentIds: string[];
  dueDate?: string;
}

export function FeeAssignment() {
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
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
      const [classesData, studentsData] = await Promise.all([
        classService.getActiveClasses(),
        studentService.list(),
      ]);

      setClasses(classesData);
      setStudents(studentsData);
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
      // For bulk assignment, select all students from the class (excluding those with existing assignments)
      const classStudents = getClassStudents(structure.classId);
      setFormData({
        structureId,
        structureName: `${structure.className} - ${structure.term.charAt(0).toUpperCase() + structure.term.slice(1)} Term`,
        studentIds: classStudents.map((s) => s.id),
      });
    } else {
      setFormData({
        structureId,
        structureName: `${structure.className} - ${structure.term.charAt(0).toUpperCase() + structure.term.slice(1)} Term`,
        studentIds: [],
      });
    }

    setShowModal(true);
  };

  const toggleStudent = (studentId: string) => {
    setFormData((prev) => ({
      ...prev,
      studentIds: prev.studentIds.includes(studentId)
        ? prev.studentIds.filter((id) => id !== studentId)
        : [...prev.studentIds, studentId],
    }));
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
            <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
              <h4 className="mb-2 font-medium text-blue-900 dark:text-blue-100">
                {formData.structureName}
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {assignmentType === "bulk"
                  ? "This will assign the fee structure to all active students in the class."
                  : "Select individual students to assign this fee structure to."}
              </p>
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

              <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-600">
                {getStructureStudents(formData.structureId).map((student) => {
                  const hasExistingAssignment = existingAssignments.has(
                    student.id,
                  );
                  return (
                    <div
                      key={student.id}
                      className={`flex items-center border-b border-gray-100 p-3 last:border-b-0 dark:border-gray-700 ${
                        hasExistingAssignment
                          ? "bg-amber-50 dark:bg-amber-900/10"
                          : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.studentIds.includes(student.id)}
                        onChange={() => toggleStudent(student.id)}
                        disabled={
                          assignmentType === "bulk" || hasExistingAssignment
                        }
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
                          {student.admissionNumber} • Balance: ₦
                          {student.balance.toLocaleString()}
                        </p>
                      </div>
                      {student.balance === 0 && student.totalPaid > 0 && (
                        <CheckIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                      )}
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
