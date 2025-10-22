"use client";

import { useState, useEffect } from "react";
import {
  DollarSignIcon,
  UsersIcon,
  BookOpenIcon,
  CalendarIcon,
  TrendingUpIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  feeStructureService,
  studentFeeAssignmentService,
} from "@/services/feeService";
import { classService } from "@/services/classService";
import type { FeeStructure, SchoolClass } from "@/types";
import { useRouter } from "next/navigation";

interface OverviewStats {
  totalStructures: number;
  activeStructures: number;
  totalStudentsAssigned: number;
  totalRevenueAssigned: number;
  totalRevenuePaid: number;
  totalRevenueBalance: number;
  paymentSummary: {
    paidCount: number;
    partialCount: number;
    unpaidCount: number;
  };
}

interface ClassSummary {
  classId: string;
  className: string;
  feeStructure?: FeeStructure;
  studentsAssigned: number;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  paidStudents: number;
  partialStudents: number;
  unpaidStudents: number;
}

export function FeeOverviewDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<OverviewStats>({
    totalStructures: 0,
    activeStructures: 0,
    totalStudentsAssigned: 0,
    totalRevenueAssigned: 0,
    totalRevenuePaid: 0,
    totalRevenueBalance: 0,
    paymentSummary: {
      paidCount: 0,
      partialCount: 0,
      unpaidCount: 0,
    },
  });
  const [classSummaries, setClassSummaries] = useState<ClassSummary[]>([]);
  const [academicYear] = useState(
    new Date().getFullYear() + "/" + (new Date().getFullYear() + 1),
  );
  const [selectedTerm, setSelectedTerm] = useState<
    "first" | "second" | "third"
  >("first");

  useEffect(() => {
    fetchOverviewData();
  }, [selectedTerm]);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);

      // Fetch all fee structures, classes, and assignments
      const [structures, classes, assignments] = await Promise.all([
        feeStructureService.list(),
        classService.getActiveClasses(),
        studentFeeAssignmentService.list(),
      ]);

      // Filter data for current academic year
      const currentStructures = structures.filter(
        (s) => s.academicYear === academicYear,
      );
      const currentAssignments = assignments.filter(
        (a) => a.academicYear === academicYear && a.term === selectedTerm,
      );

      // Calculate overview stats
      const overviewStats: OverviewStats = {
        totalStructures: currentStructures.length,
        activeStructures: currentStructures.filter((s) => s.isActive).length,
        totalStudentsAssigned: currentAssignments.length,
        totalRevenueAssigned: currentAssignments.reduce(
          (sum, a) => sum + a.totalAmount,
          0,
        ),
        totalRevenuePaid: currentAssignments.reduce(
          (sum, a) => sum + a.amountPaid,
          0,
        ),
        totalRevenueBalance: currentAssignments.reduce(
          (sum, a) => sum + a.balance,
          0,
        ),
        paymentSummary: {
          paidCount: currentAssignments.filter((a) => a.status === "paid")
            .length,
          partialCount: currentAssignments.filter((a) => a.status === "partial")
            .length,
          unpaidCount: currentAssignments.filter((a) => a.status === "unpaid")
            .length,
        },
      };

      // Generate class summaries
      const summaries: ClassSummary[] = classes.map((cls) => {
        const classStructure = currentStructures.find(
          (s) => s.classId === cls.id && s.term === selectedTerm && s.isActive,
        );
        const classAssignments = currentAssignments.filter(
          (a) => a.classId === cls.id,
        );

        return {
          classId: cls.id,
          className: `${cls.name}${cls.section ? ` ${cls.section}` : ""}`,
          feeStructure: classStructure,
          studentsAssigned: classAssignments.length,
          totalAmount: classAssignments.reduce(
            (sum, a) => sum + a.totalAmount,
            0,
          ),
          paidAmount: classAssignments.reduce(
            (sum, a) => sum + a.amountPaid,
            0,
          ),
          balance: classAssignments.reduce((sum, a) => sum + a.balance, 0),
          paidStudents: classAssignments.filter((a) => a.status === "paid")
            .length,
          partialStudents: classAssignments.filter(
            (a) => a.status === "partial",
          ).length,
          unpaidStudents: classAssignments.filter((a) => a.status === "unpaid")
            .length,
        };
      });

      setStats(overviewStats);
      setClassSummaries(summaries);
    } catch (error) {
      console.error("Error fetching overview data:", error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({
    title,
    value,
    icon,
    color = "blue",
    subtitle,
  }: {
    title: string;
    value: string;
    icon: React.ReactNode;
    color?: string;
    subtitle?: string;
  }) => (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {subtitle}
            </p>
          )}
        </div>
        <div
          className={`rounded-lg p-2 bg-${color}-100 dark:bg-${color}-900/30`}
        >
          {icon}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-700"></div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-lg bg-gray-100 dark:bg-gray-700/50"
              ></div>
            ))}
          </div>
          <div className="h-64 rounded-lg bg-gray-100 dark:bg-gray-700/50"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Fee Structure Overview
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {academicYear} Academic Year
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedTerm}
            onChange={(e) =>
              setSelectedTerm(e.target.value as "first" | "second" | "third")
            }
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="first">First Term</option>
            <option value="second">Second Term</option>
            <option value="third">Third Term</option>
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue Assigned"
          value={`₦${stats.totalRevenueAssigned.toLocaleString()}`}
          icon={
            <DollarSignIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          }
          color="blue"
          subtitle={`${stats.totalStudentsAssigned} students`}
        />
        <StatCard
          title="Revenue Collected"
          value={`₦${stats.totalRevenuePaid.toLocaleString()}`}
          icon={
            <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
          }
          color="green"
          subtitle={`${stats.paymentSummary.paidCount} paid students`}
        />
        <StatCard
          title="Outstanding Balance"
          value={`₦${stats.totalRevenueBalance.toLocaleString()}`}
          icon={
            <ClockIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          }
          color="amber"
          subtitle={`${stats.paymentSummary.unpaidCount + stats.paymentSummary.partialCount} students`}
        />
        <StatCard
          title="Fee Structures"
          value={`${stats.activeStructures}`}
          icon={
            <BookOpenIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          }
          color="purple"
          subtitle={`${stats.totalStructures} total created`}
        />
      </div>

      {/* Payment Summary */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-gray-100">
          Payment Status Summary
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {stats.paymentSummary.paidCount} Students
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Fully Paid
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <ClockIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {stats.paymentSummary.partialCount} Students
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Partial Payment
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <AlertTriangleIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {stats.paymentSummary.unpaidCount} Students
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No Payment
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-gray-100">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Button
            variant="outline"
            onClick={() => router.push("/fees?tab=categories")}
            className="flex h-auto flex-col items-center gap-2 py-4"
          >
            <BookOpenIcon className="h-5 w-5" />
            <span className="text-sm">Manage Categories</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/fees?tab=structures")}
            className="flex h-auto flex-col items-center gap-2 py-4"
          >
            <TrendingUpIcon className="h-5 w-5" />
            <span className="text-sm">Manage Structures</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/fees?tab=assignments")}
            className="flex h-auto flex-col items-center gap-2 py-4"
          >
            <UsersIcon className="h-5 w-5" />
            <span className="text-sm">Assign Fees</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/students")}
            className="flex h-auto flex-col items-center gap-2 py-4"
          >
            <DollarSignIcon className="h-5 w-5" />
            <span className="text-sm">Record Payment</span>
          </Button>
        </div>
      </div>

      {/* Class-wise Summary */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="border-b border-gray-200 p-6 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Class-wise Fee Summary (
            {selectedTerm.charAt(0).toUpperCase() + selectedTerm.slice(1)} Term)
          </h3>
        </div>

        {classSummaries.length === 0 ? (
          <div className="py-8 text-center">
            <BookOpenIcon className="mx-auto mb-4 h-12 w-12 text-gray-400 dark:text-gray-500" />
            <p className="text-gray-600 dark:text-gray-400">
              No class data available
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                    Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                    Fee Structure
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                    Students
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                    Total Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                    Collected
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                    Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                    Payment Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {classSummaries.map((summary) => (
                  <tr
                    key={summary.classId}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {summary.className}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {summary.feeStructure ? (
                        <div className="flex items-center">
                          <CheckCircleIcon className="mr-2 h-4 w-4 text-green-500" />
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            ₦{summary.feeStructure.totalAmount.toLocaleString()}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <AlertTriangleIcon className="mr-2 h-4 w-4 text-amber-500" />
                          <span className="text-sm text-amber-600 dark:text-amber-400">
                            Not Set
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900 dark:text-gray-100">
                      {summary.studentsAssigned}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900 dark:text-gray-100">
                      ₦{summary.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-green-600 dark:text-green-400">
                      ₦{summary.paidAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-red-600 dark:text-red-400">
                      ₦{summary.balance.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-1 text-xs">
                        {summary.paidStudents > 0 && (
                          <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            {summary.paidStudents} paid
                          </span>
                        )}
                        {summary.partialStudents > 0 && (
                          <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                            {summary.partialStudents} partial
                          </span>
                        )}
                        {summary.unpaidStudents > 0 && (
                          <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                            {summary.unpaidStudents} unpaid
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
