"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  ArrowLeft,
  Edit,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import {
  StudentProfile as StudentProfileType,
  Payment,
  StudentFeeAssignment,
} from "@/types";
import {
  studentService,
  paymentService,
  studentFeeAssignmentService,
} from "@/services";
import { useSchool } from "@/contexts/SchoolContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PaymentRecordingForm } from "@/components/payments/PaymentRecordingForm";
import { useRouter } from "next/navigation";

interface StudentProfileProps {
  studentId?: string;
  studentData?: StudentProfileType;
}

export default function StudentProfile({
  studentId,
  studentData,
}: StudentProfileProps) {
  const router = useRouter();
  const { formatCurrency } = useSchool();
  const [student, setStudent] = useState<StudentProfileType | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [feeAssignments, setFeeAssignments] = useState<StudentFeeAssignment[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<StudentProfileType>>(
    {},
  );

  useEffect(() => {
    if (studentData) {
      // Use provided student data
      setStudent(studentData);
      loadRelatedData(studentData.id);
    } else if (studentId) {
      // Fetch student data by ID
      loadStudentData();
    }
  }, [studentId, studentData]);

  const loadStudentData = async () => {
    if (!studentId) return;

    try {
      setLoading(true);
      setError(null);

      // Load student details
      const studentData = await studentService.getById(studentId);
      if (!studentData) {
        setError("Student not found");
        return;
      }
      setStudent(studentData);

      // Load related data
      await loadRelatedData(studentId);
    } catch (err) {
      console.error("Error loading student data:", err);
      setError("Failed to load student data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedData = async (id: string) => {
    try {
      // Load payments
      const paymentsData = await paymentService.getByStudentId(id);
      setPayments(paymentsData);

      // Load fee assignments
      const feesData = await studentFeeAssignmentService.getByStudentId(id);
      setFeeAssignments(feesData);
    } catch (err) {
      console.error("Error loading related data:", err);
      // Don't set error state for related data - just log it
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentForm(false);
    // Refresh data based on what we have
    if (studentData) {
      loadRelatedData(studentData.id);
    } else if (studentId) {
      loadStudentData();
    }
  };

  const handleEditClick = () => {
    if (student) {
      setEditFormData({
        firstname: student.firstname,
        surname: student.surname,
        middlename: student.middlename,
        guardianFirstname: student.guardianFirstname,
        guardianSurname: student.guardianSurname,
        guardianPhone: student.guardianPhone,
        guardianEmail: student.guardianEmail,
        guardianAddress: student.guardianAddress,
        guardianRelationship: student.guardianRelationship,
        dateOfBirth: student.dateOfBirth,
        gender: student.gender,
        bloodGroup: student.bloodGroup,
      });
      setIsEditing(true);
    }
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditFormData({});
  };

  const handleEditSave = async () => {
    if (!student || !editFormData) return;

    try {
      setLoading(true);
      const updatedStudent = await studentService.update(
        student.id,
        editFormData,
      );
      setStudent(updatedStudent);
      setIsEditing(false);
      setEditFormData({});
      alert("Student information updated successfully!");
    } catch (error) {
      console.error("Error updating student:", error);
      alert("Failed to update student information. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditChange = (field: keyof StudentProfileType, value: string) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));
  };

  const renderEditableField = (
    label: string,
    field: keyof StudentProfileType,
    currentValue: string | undefined,
    type: "text" | "email" | "tel" | "date" | "select" = "text",
    options?: { value: string; label: string }[],
  ) => {
    const editValue = (editFormData[field] as string) ?? currentValue ?? "";

    return (
      <div>
        <label className="text-sm font-medium text-gray-500 dark:text-blue-400">
          {label}
        </label>
        {isEditing ? (
          type === "select" ? (
            <Select
              value={editValue || ""}
              onValueChange={(value) => handleEditChange(field, value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select option" />
              </SelectTrigger>
              <SelectContent>
                {(options || []).map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              type={type}
              value={editValue || ""}
              onChange={(e) => handleEditChange(field, e.target.value)}
              className="mt-1"
            />
          )
        ) : (
          <p className="font-medium text-gray-900 dark:text-blue-100">
            {currentValue || "Not specified"}
          </p>
        )}
      </div>
    );
  };

  const getPaymentStatusBadge = () => {
    if (!student) return null;

    const { totalFeesAssigned, totalPaid } = student;
    const balance = totalFeesAssigned - totalPaid;

    if (balance <= 0) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
          <CheckCircle className="h-4 w-4" />
          Paid
        </span>
      );
    } else if (totalPaid > 0) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
          <Clock className="h-4 w-4" />
          Partial
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800 dark:bg-red-900/30 dark:text-red-300">
          <AlertCircle className="h-4 w-4" />
          Pending
        </span>
      );
    }
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-600 dark:text-blue-300">
            Loading student profile...
          </p>
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
          <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-blue-100">
            {error || "Student not found"}
          </h2>
          <Button onClick={() => router.push("/students")} variant="primary">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Students
          </Button>
        </div>
      </div>
    );
  }

  const balance = student.balance;

  return (
    <div className="space-y-6">
      <div className="w-full">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              {isEditing ? (
                <div className="mb-4 space-y-3">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <Input
                      label="First Name"
                      value={editFormData.firstname || ""}
                      onChange={(e) =>
                        handleEditChange("firstname", e.target.value)
                      }
                    />
                    <Input
                      label="Surname"
                      value={editFormData.surname || ""}
                      onChange={(e) =>
                        handleEditChange("surname", e.target.value)
                      }
                    />
                    <Input
                      label="Middle Name (Optional)"
                      value={editFormData.middlename || ""}
                      onChange={(e) =>
                        handleEditChange("middlename", e.target.value)
                      }
                    />
                  </div>
                </div>
              ) : (
                <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-blue-100">
                  {student.surname} {student.firstname} {student.middlename}
                </h1>
              )}
              <div className="flex items-center gap-3">
                <span className="text-gray-600 dark:text-blue-300">
                  {student.admissionNumber}
                </span>
                {getPaymentStatusBadge()}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={handleEditCancel}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={handleEditSave}>
                    Save Changes
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={handleEditClick}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  {balance > 0 && (
                    <Button
                      variant="primary"
                      onClick={() => setShowPaymentForm(true)}
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      Record Payment
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column - Student Info */}
          <div className="space-y-6 lg:col-span-1">
            {/* Student Details Card */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-blue-100">
                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Student Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-blue-400">
                    Class
                  </label>
                  <p className="font-medium text-gray-900 dark:text-blue-100">
                    {student.className}
                  </p>
                </div>
                {renderEditableField(
                  "Gender",
                  "gender",
                  student.gender,
                  "select",
                  [
                    { value: "", label: "Not specified" },
                    { value: "male", label: "Male" },
                    { value: "female", label: "Female" },
                  ],
                )}
                {renderEditableField(
                  "Date of Birth",
                  "dateOfBirth",
                  student.dateOfBirth,
                  "date",
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-blue-400">
                    Admission Date
                  </label>
                  <p className="text-gray-900 dark:text-blue-100">
                    {student.admissionDate
                      ? formatDate(student.admissionDate)
                      : "Not specified"}
                  </p>
                </div>
                {renderEditableField(
                  "Blood Group",
                  "bloodGroup",
                  student.bloodGroup,
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-blue-400">
                    Status
                  </label>
                  <p className="text-gray-900 capitalize dark:text-blue-100">
                    {student.isActive ? "Active" : "Inactive"}
                  </p>
                </div>
              </div>
            </div>

            {/* Guardian Details Card */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-blue-100">
                <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                Guardian Details
              </h2>
              <div className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <Input
                        label="Guardian First Name"
                        value={editFormData.guardianFirstname || ""}
                        onChange={(e) =>
                          handleEditChange("guardianFirstname", e.target.value)
                        }
                      />
                      <Input
                        label="Guardian Surname"
                        value={editFormData.guardianSurname || ""}
                        onChange={(e) =>
                          handleEditChange("guardianSurname", e.target.value)
                        }
                      />
                    </div>
                    <Input
                      label="Guardian Phone"
                      type="tel"
                      value={editFormData.guardianPhone || ""}
                      onChange={(e) =>
                        handleEditChange("guardianPhone", e.target.value)
                      }
                    />
                    <Input
                      label="Guardian Email (Optional)"
                      type="email"
                      value={editFormData.guardianEmail || ""}
                      onChange={(e) =>
                        handleEditChange("guardianEmail", e.target.value)
                      }
                    />
                    <textarea
                      placeholder="Guardian Address (Optional)"
                      value={editFormData.guardianAddress || ""}
                      onChange={(e) =>
                        handleEditChange("guardianAddress", e.target.value)
                      }
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                      rows={3}
                    />
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Relationship
                      </label>
                      <Select
                        value={editFormData.guardianRelationship || ""}
                        onValueChange={(value) =>
                          handleEditChange("guardianRelationship", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select relationship" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="father">Father</SelectItem>
                          <SelectItem value="mother">Mother</SelectItem>
                          <SelectItem value="guardian">Guardian</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-blue-400">
                        Name
                      </label>
                      <p className="font-medium text-gray-900 dark:text-blue-100">
                        {student.guardianSurname} {student.guardianFirstname}
                      </p>
                    </div>
                    <div>
                      <label className="flex items-center gap-1 text-sm font-medium text-gray-500 dark:text-blue-400">
                        <Phone className="h-3 w-3" />
                        Phone
                      </label>
                      <p className="text-gray-900 dark:text-blue-100">
                        {student.guardianPhone}
                      </p>
                    </div>
                    {student.guardianEmail && (
                      <div>
                        <label className="flex items-center gap-1 text-sm font-medium text-gray-500 dark:text-blue-400">
                          <Mail className="h-3 w-3" />
                          Email
                        </label>
                        <p className="break-words text-gray-900 dark:text-blue-100">
                          {student.guardianEmail}
                        </p>
                      </div>
                    )}
                    {student.guardianAddress && (
                      <div>
                        <label className="flex items-center gap-1 text-sm font-medium text-gray-500 dark:text-blue-400">
                          <MapPin className="h-3 w-3" />
                          Address
                        </label>
                        <p className="text-gray-900 dark:text-blue-100">
                          {student.guardianAddress}
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-blue-400">
                        Relationship
                      </label>
                      <p className="text-gray-900 capitalize dark:text-blue-100">
                        {student.guardianRelationship || "Not specified"}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Payments & Fees */}
          <div className="space-y-6 lg:col-span-2">
            {/* Financial Summary Card */}
            <div className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white shadow-lg">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
                <DollarSign className="h-5 w-5" />
                Financial Summary
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
                  <p className="mb-1 text-sm text-blue-100">Total Fees</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(student.totalFeesAssigned)}
                  </p>
                </div>
                <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
                  <p className="mb-1 text-sm text-blue-100">Amount Paid</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(student.totalPaid)}
                  </p>
                </div>
                <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
                  <p className="mb-1 text-sm text-blue-100">Balance</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(balance)}
                  </p>
                </div>
              </div>
            </div>

            {/* Fee Assignments Card */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-blue-100">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Fee Assignments
              </h2>
              {feeAssignments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-700 uppercase dark:text-blue-300">
                          Fee Type
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-700 uppercase dark:text-blue-300">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium tracking-wider text-gray-700 uppercase dark:text-blue-300">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {feeAssignments.map((assignment) => (
                        <tr
                          key={assignment.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        >
                          <td className="px-4 py-3 text-gray-900 dark:text-blue-100">
                            {assignment.term} Term Fees
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-blue-100">
                            {formatCurrency(assignment.totalAmount)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                assignment.status === "paid"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                  : assignment.status === "partial"
                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                              }`}
                            >
                              {assignment.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <FileText className="mx-auto mb-3 h-12 w-12 text-gray-400 dark:text-gray-600" />
                  <p className="text-gray-600 dark:text-blue-300">
                    No fee assignments yet
                  </p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-blue-400">
                    Fee assignments will appear here once configured
                  </p>
                </div>
              )}
            </div>

            {/* Payment History Card */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-blue-100">
                <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
                Payment History
              </h2>
              {payments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-700 uppercase dark:text-blue-300">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-700 uppercase dark:text-blue-300">
                          Receipt #
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-700 uppercase dark:text-blue-300">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium tracking-wider text-gray-700 uppercase dark:text-blue-300">
                          Method
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-700 uppercase dark:text-blue-300">
                          Reference
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {payments.map((payment) => (
                        <tr
                          key={payment.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        >
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-blue-100">
                            {formatDate(payment.paymentDate)}
                          </td>
                          <td className="px-4 py-3 font-mono text-sm text-gray-600 dark:text-blue-300">
                            {payment.reference}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-blue-100">
                            {formatCurrency(payment.amount)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                              {payment.paymentMethod}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-sm text-gray-600 dark:text-blue-300">
                            {payment.transactionId || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Calendar className="mx-auto mb-3 h-12 w-12 text-gray-400 dark:text-gray-600" />
                  <p className="text-gray-600 dark:text-blue-300">
                    No payments recorded yet
                  </p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-blue-400">
                    Payment history will appear here
                  </p>
                  {balance > 0 && (
                    <Button
                      variant="primary"
                      className="mt-4"
                      onClick={() => setShowPaymentForm(true)}
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      Record First Payment
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Recording Modal */}
      {showPaymentForm && (
        <PaymentRecordingForm
          student={student}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setShowPaymentForm(false)}
        />
      )}
    </div>
  );
}
