"use client";

import React, { useState, useEffect } from "react";
import {
  SearchIcon,
  FilterIcon,
  PlusIcon,
  UserIcon,
  ArrowRightIcon,
  BookOpenIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { StudentRegistrationForm } from "./StudentRegistrationForm";
import { PaymentRecordingForm } from "../payments/PaymentRecordingForm";
import StudentProfileComponent from "./StudentProfile";
import { studentService, classService } from "@/services";
import type { StudentProfile, SchoolClass } from "@/types";

export const StudentList: React.FC = () => {
  const router = useRouter();
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentProfile[]>(
    [],
  );
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [selectedStudentForPayment, setSelectedStudentForPayment] =
    useState<StudentProfile | null>(null);
  const [selectedStudentForProfile, setSelectedStudentForProfile] =
    useState<StudentProfile | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "paid" | "partial" | "pending"
  >("all");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [students, searchTerm, classFilter, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [studentsData, classesData] = await Promise.all([
        studentService.list(),
        classService.getActiveClasses(),
      ]);
      setStudents(studentsData);
      setClasses(classesData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...students];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (student) =>
          `${student.firstname} ${student.surname}`
            .toLowerCase()
            .includes(term) ||
          student.admissionNumber.toLowerCase().includes(term) ||
          student.guardianPhone.includes(term),
      );
    }

    // Class filter
    if (classFilter) {
      filtered = filtered.filter((student) => student.classId === classFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((student) => {
        const status = getPaymentStatus(student);
        return status === statusFilter;
      });
    }

    setFilteredStudents(filtered);
  };

  const getPaymentStatus = (
    student: StudentProfile,
  ): "paid" | "partial" | "pending" => {
    if (student.balance === 0 && student.totalPaid > 0) return "paid";
    if (student.totalPaid > 0 && student.balance > 0) return "partial";
    return "pending";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "partial":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "pending":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const handleRegistrationSuccess = () => {
    setShowRegistrationModal(false);
    loadData();
  };

  const handlePaymentSuccess = () => {
    setSelectedStudentForPayment(null);
    loadData();
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
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Students
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {filteredStudents.length} of {students.length} students
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => router.push("/dashboard/accounting")}
            variant="outline"
          >
            <ArrowRightIcon className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
          <Button onClick={() => router.push("/fees")} variant="outline">
            <BookOpenIcon className="mr-2 h-4 w-4" />
            Fee Management
          </Button>
          <Button onClick={() => setShowRegistrationModal(true)}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Register Student
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, admission number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pr-4 pl-10 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Classes</SelectItem>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {`${c.name}${c.section ? ` ${c.section}` : ""}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as typeof statusFilter)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm("");
              setClassFilter("");
              setStatusFilter("all");
            }}
          >
            <FilterIcon className="mr-2 h-4 w-4" />
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Student List */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        {filteredStudents.length === 0 ? (
          <div className="py-12 text-center">
            <UserIcon className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || classFilter || statusFilter !== "all"
                ? "No students found matching your filters"
                : "No students registered yet"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-700 uppercase dark:text-gray-300">
                    Student
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-700 uppercase dark:text-gray-300">
                    Class
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-700 uppercase dark:text-gray-300">
                    Guardian
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-700 uppercase dark:text-gray-300">
                    Fees
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
                {filteredStudents.map((student) => {
                  const status = getPaymentStatus(student);
                  return (
                    <tr
                      key={student.id}
                      className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {student.firstname} {student.surname}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {student.admissionNumber}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-900 dark:text-gray-100">
                          {student.className}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm text-gray-900 dark:text-gray-100">
                            {student.guardianFirstname}{" "}
                            {student.guardianSurname}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {student.guardianPhone}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            ₦{student.totalPaid.toLocaleString()}
                          </p>
                          {student.balance > 0 && (
                            <p className="text-xs text-red-600 dark:text-red-400">
                              Balance: ₦{student.balance.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(status)}`}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setSelectedStudentForProfile(student)
                            }
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() =>
                              setSelectedStudentForPayment(student)
                            }
                            disabled={student.balance === 0}
                            title={
                              student.balance === 0
                                ? "No outstanding balance"
                                : `Pay ₦${student.balance.toLocaleString()}`
                            }
                          >
                            Pay
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Registration Modal */}
      <Modal
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
        title="Register New Student"
        size="lg"
      >
        <StudentRegistrationForm
          onSuccess={handleRegistrationSuccess}
          onCancel={() => setShowRegistrationModal(false)}
        />
      </Modal>

      {/* Payment Modal */}
      {selectedStudentForPayment && (
        <Modal
          isOpen={!!selectedStudentForPayment}
          onClose={() => setSelectedStudentForPayment(null)}
          title="Record Payment"
          size="md"
        >
          <PaymentRecordingForm
            student={selectedStudentForPayment}
            onSuccess={handlePaymentSuccess}
            onCancel={() => setSelectedStudentForPayment(null)}
          />
        </Modal>
      )}

      {/* Student Profile Modal */}
      {selectedStudentForProfile && (
        <Modal
          isOpen={!!selectedStudentForProfile}
          onClose={() => setSelectedStudentForProfile(null)}
          title={`${selectedStudentForProfile.firstname} ${selectedStudentForProfile.surname}`}
          size="xl"
        >
          <StudentProfileComponent studentData={selectedStudentForProfile} />
        </Modal>
      )}
    </div>
  );
};
