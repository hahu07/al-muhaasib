"use client";

import { useState, useEffect } from "react";
import { AlertCircleIcon, CheckCircleIcon, XCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { feeStructureService } from "@/services/feeService";

interface AffectedStudent {
  assignmentId: string;
  studentId: string;
  studentName: string;
  currentTotal: number;
  newTotal: number;
  difference: number;
  hasPaid: boolean;
  amountPaid: number;
}

interface UpdateStudentFeesModalProps {
  isOpen: boolean;
  onClose: () => void;
  structureId: string;
  onSuccess?: () => void;
}

export function UpdateStudentFeesModal({
  isOpen,
  onClose,
  structureId,
  onSuccess,
}: UpdateStudentFeesModalProps) {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [affectedStudents, setAffectedStudents] = useState<AffectedStudent[]>(
    [],
  );
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(
    new Set(),
  );
  const [updatePaidStudents, setUpdatePaidStudents] = useState(false);
  const [updateResult, setUpdateResult] = useState<{
    updated: number;
    skipped: number;
    errors: Array<{ studentId: string; error: string }>;
  } | null>(null);

  useEffect(() => {
    if (isOpen && structureId) {
      loadAffectedStudents();
    }
  }, [isOpen, structureId]);

  const loadAffectedStudents = async () => {
    try {
      setLoading(true);
      const students =
        await feeStructureService.getAffectedStudents(structureId);
      setAffectedStudents(students);

      // Auto-select students who haven't paid
      const unpaidIds = new Set(
        students.filter((s) => !s.hasPaid).map((s) => s.studentId),
      );
      setSelectedStudents(unpaidIds);
    } catch (error) {
      console.error("Error loading affected students:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const handleSelectAll = () => {
    const filteredStudents = affectedStudents.filter(
      (s) => updatePaidStudents || !s.hasPaid,
    );
    setSelectedStudents(new Set(filteredStudents.map((s) => s.studentId)));
  };

  const handleDeselectAll = () => {
    setSelectedStudents(new Set());
  };

  const handleUpdate = async () => {
    if (selectedStudents.size === 0) return;

    setUpdating(true);
    try {
      const result = await feeStructureService.updateStudentAssignments(
        structureId,
        Array.from(selectedStudents),
        {
          updatePaidStudents,
          preservePayments: true,
        },
      );

      setUpdateResult(result);

      if (result.errors.length === 0 && onSuccess) {
        // Wait a bit to show success message, then close
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error("Error updating student assignments:", error);
      alert("Failed to update student assignments");
    } finally {
      setUpdating(false);
    }
  };

  const filteredStudents = affectedStudents.filter(
    (s) => updatePaidStudents || !s.hasPaid,
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Student Fee Assignments"
      size="lg"
    >
      {loading ? (
        <div className="py-8 text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading affected students...
          </p>
        </div>
      ) : updateResult ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
            <div className="mb-2 flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
              <h3 className="font-semibold text-green-900 dark:text-green-100">
                Update Complete
              </h3>
            </div>
            <div className="text-sm text-green-800 dark:text-green-200">
              <p>✓ Updated: {updateResult.updated} students</p>
              {updateResult.skipped > 0 && (
                <p>⊘ Skipped: {updateResult.skipped} students</p>
              )}
            </div>
          </div>

          {updateResult.errors.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
              <div className="mb-2 flex items-center gap-2">
                <XCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                <h3 className="font-semibold text-red-900 dark:text-red-100">
                  Errors
                </h3>
              </div>
              <ul className="space-y-1 text-sm text-red-800 dark:text-red-200">
                {updateResult.errors.map((err, idx) => (
                  <li key={idx}>
                    • {err.studentId}: {err.error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Button onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {affectedStudents.length === 0 ? (
            <div className="py-8 text-center">
              <AlertCircleIcon className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400">
                No students are assigned to this fee structure yet.
              </p>
            </div>
          ) : (
            <>
              {/* Info Banner */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                <div className="flex items-start gap-2">
                  <AlertCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
                  <div className="text-sm text-blue-900 dark:text-blue-100">
                    <p className="mb-1 font-semibold">
                      Update Student Assignments
                    </p>
                    <p>
                      Select which students should have their fee assignments
                      updated to match the new structure. Existing payment
                      records will be preserved.
                    </p>
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={updatePaidStudents}
                    onChange={(e) => {
                      setUpdatePaidStudents(e.target.checked);
                      if (!e.target.checked) {
                        // Remove paid students from selection
                        const newSelected = new Set(
                          Array.from(selectedStudents).filter(
                            (id) =>
                              !affectedStudents.find((s) => s.studentId === id)
                                ?.hasPaid,
                          ),
                        );
                        setSelectedStudents(newSelected);
                      }
                    }}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Include students who have already paid
                  </span>
                </label>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeselectAll}
                  >
                    Deselect All
                  </Button>
                </div>
              </div>

              {/* Students List */}
              <div className="max-h-96 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="p-3 text-left font-medium">
                        <input
                          type="checkbox"
                          checked={
                            selectedStudents.size === filteredStudents.length &&
                            filteredStudents.length > 0
                          }
                          onChange={(e) =>
                            e.target.checked
                              ? handleSelectAll()
                              : handleDeselectAll()
                          }
                          className="rounded border-gray-300"
                        />
                      </th>
                      <th className="p-3 text-left font-medium">Student</th>
                      <th className="p-3 text-right font-medium">Current</th>
                      <th className="p-3 text-right font-medium">New</th>
                      <th className="p-3 text-right font-medium">Difference</th>
                      <th className="p-3 text-center font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredStudents.map((student) => (
                      <tr
                        key={student.studentId}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${
                          student.hasPaid ? "opacity-60" : ""
                        }`}
                      >
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedStudents.has(student.studentId)}
                            onChange={() =>
                              handleToggleStudent(student.studentId)
                            }
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="p-3">{student.studentName}</td>
                        <td className="p-3 text-right">
                          ₦{student.currentTotal.toLocaleString()}
                        </td>
                        <td className="p-3 text-right">
                          ₦{student.newTotal.toLocaleString()}
                        </td>
                        <td
                          className={`p-3 text-right font-medium ${
                            student.difference > 0
                              ? "text-red-600 dark:text-red-400"
                              : student.difference < 0
                                ? "text-green-600 dark:text-green-400"
                                : "text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          {student.difference > 0 ? "+" : ""}₦
                          {student.difference.toLocaleString()}
                        </td>
                        <td className="p-3 text-center">
                          {student.hasPaid ? (
                            <span className="inline-flex rounded bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                              Paid ₦{student.amountPaid.toLocaleString()}
                            </span>
                          ) : (
                            <span className="inline-flex rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                              Unpaid
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">{selectedStudents.size}</span>{" "}
                  student(s) selected for update
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
                <Button variant="outline" onClick={onClose} disabled={updating}>
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdate}
                  disabled={updating || selectedStudents.size === 0}
                >
                  {updating ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Updating...
                    </>
                  ) : (
                    `Update ${selectedStudents.size} Student(s)`
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}
