"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  UserCheckIcon,
  UsersIcon,
  DollarSignIcon,
  ArrowLeftIcon,
  PlusIcon,
  SearchIcon,
  FileTextIcon,
  DownloadIcon,
  CreditCardIcon,
  TrendingUpIcon,
  ClockIcon,
} from "lucide-react";
import StaffDashboard from "./StaffDashboard";
import PayrollDashboard from "./PayrollDashboard";

type StaffView = "menu" | "dashboard" | "management" | "payroll";

export default function StaffRouter() {
  const [activeView, setActiveView] = useState<StaffView>("menu");

  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return (
          <div>
            <div className="mb-6 flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => setActiveView("menu")}
                className="flex items-center gap-2"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Back to Staff Menu
              </Button>
            </div>
            <StaffDashboard />
          </div>
        );

      case "management":
        return (
          <div>
            <div className="mb-6 flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => setActiveView("menu")}
                className="flex items-center gap-2"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Back to Staff Menu
              </Button>
            </div>
            <StaffDashboard />
          </div>
        );

      case "payroll":
        return (
          <div>
            <div className="mb-6 flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => setActiveView("menu")}
                className="flex items-center gap-2"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Back to Staff Menu
              </Button>
            </div>
            <PayrollDashboard />
          </div>
        );

      case "menu":
      default:
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Staff Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage staff information, payroll, and employment records
              </p>
            </div>

            {/* Main Navigation Cards */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Staff Dashboard Card */}
              <Card className="cursor-pointer border-2 border-transparent transition-shadow hover:border-blue-200 hover:shadow-lg dark:hover:border-blue-700">
                <CardHeader className="pb-2 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <UserCheckIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-xl">Staff Dashboard</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="mb-4 text-gray-600 dark:text-gray-400">
                    View comprehensive staff information, manage employee
                    records, and track staff performance metrics.
                  </p>
                  <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded bg-blue-50 p-2 dark:bg-blue-900/20">
                      <p className="font-semibold text-blue-600 dark:text-blue-400">
                        Staff Overview
                      </p>
                    </div>
                    <div className="rounded bg-green-50 p-2 dark:bg-green-900/20">
                      <p className="font-semibold text-green-600 dark:text-green-400">
                        Quick Actions
                      </p>
                    </div>
                    <div className="rounded bg-purple-50 p-2 dark:bg-purple-900/20">
                      <p className="font-semibold text-purple-600 dark:text-purple-400">
                        Search & Filter
                      </p>
                    </div>
                    <div className="rounded bg-orange-50 p-2 dark:bg-orange-900/20">
                      <p className="font-semibold text-orange-600 dark:text-orange-400">
                        Reports
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setActiveView("dashboard")}
                    className="w-full"
                  >
                    Open Staff Dashboard
                  </Button>
                </CardContent>
              </Card>

              {/* Staff Management Card */}
              <Card className="cursor-pointer border-2 border-transparent transition-shadow hover:border-green-200 hover:shadow-lg dark:hover:border-green-700">
                <CardHeader className="pb-2 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                    <UsersIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <CardTitle className="text-xl">Staff Management</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="mb-4 text-gray-600 dark:text-gray-400">
                    Add new staff members, edit existing records, manage
                    employment details, and handle staff documentation.
                  </p>
                  <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center justify-center rounded bg-blue-50 p-2 dark:bg-blue-900/20">
                      <PlusIcon className="mr-1 h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        Add Staff
                      </span>
                    </div>
                    <div className="flex items-center justify-center rounded bg-green-50 p-2 dark:bg-green-900/20">
                      <SearchIcon className="mr-1 h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        Search
                      </span>
                    </div>
                    <div className="flex items-center justify-center rounded bg-purple-50 p-2 dark:bg-purple-900/20">
                      <FileTextIcon className="mr-1 h-4 w-4 text-purple-600 dark:text-purple-400" />
                      <span className="font-semibold text-purple-600 dark:text-purple-400">
                        Records
                      </span>
                    </div>
                    <div className="flex items-center justify-center rounded bg-orange-50 p-2 dark:bg-orange-900/20">
                      <DownloadIcon className="mr-1 h-4 w-4 text-orange-600 dark:text-orange-400" />
                      <span className="font-semibold text-orange-600 dark:text-orange-400">
                        Export
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => setActiveView("management")}
                    className="w-full"
                    variant="secondary"
                  >
                    Manage Staff Records
                  </Button>
                </CardContent>
              </Card>

              {/* Payroll Dashboard Card */}
              <Card className="cursor-pointer border-2 border-transparent transition-shadow hover:border-purple-200 hover:shadow-lg dark:hover:border-purple-700">
                <CardHeader className="pb-2 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                    <DollarSignIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle className="text-xl">Payroll Dashboard</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="mb-4 text-gray-600 dark:text-gray-400">
                    Process salary payments, manage payroll cycles, generate
                    payslips, and track payment analytics.
                  </p>
                  <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center justify-center rounded bg-green-50 p-2 dark:bg-green-900/20">
                      <CreditCardIcon className="mr-1 h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        Process
                      </span>
                    </div>
                    <div className="flex items-center justify-center rounded bg-blue-50 p-2 dark:bg-blue-900/20">
                      <TrendingUpIcon className="mr-1 h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        Analytics
                      </span>
                    </div>
                    <div className="flex items-center justify-center rounded bg-yellow-50 p-2 dark:bg-yellow-900/20">
                      <ClockIcon className="mr-1 h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                        Approvals
                      </span>
                    </div>
                    <div className="flex items-center justify-center rounded bg-red-50 p-2 dark:bg-red-900/20">
                      <FileTextIcon className="mr-1 h-4 w-4 text-red-600 dark:text-red-400" />
                      <span className="font-semibold text-red-600 dark:text-red-400">
                        Payslips
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => setActiveView("payroll")}
                    className="w-full"
                    style={{
                      backgroundColor: "rgb(147, 51, 234)",
                      color: "white",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "rgb(126, 34, 206)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "rgb(147, 51, 234)";
                    }}
                  >
                    Open Payroll Dashboard
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-700 dark:bg-blue-900/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      Total Staff
                    </p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      --
                    </p>
                  </div>
                  <UserCheckIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                  Active employees
                </p>
              </div>

              <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-700 dark:bg-green-900/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">
                      This Month
                    </p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                      --
                    </p>
                  </div>
                  <TrendingUpIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <p className="mt-2 text-xs text-green-600 dark:text-green-400">
                  Salary payments
                </p>
              </div>

              <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-700 dark:bg-purple-900/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                      Departments
                    </p>
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                      --
                    </p>
                  </div>
                  <UsersIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="mt-2 text-xs text-purple-600 dark:text-purple-400">
                  Active departments
                </p>
              </div>

              <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-700 dark:bg-orange-900/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                      Pending
                    </p>
                    <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                      --
                    </p>
                  </div>
                  <ClockIcon className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                </div>
                <p className="mt-2 text-xs text-orange-600 dark:text-orange-400">
                  Awaiting approval
                </p>
              </div>
            </div>

            {/* Integration Note */}
            <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-yellow-500">
                    <span className="text-sm font-bold text-white">!</span>
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-yellow-800 dark:text-yellow-300">
                      Staff Management Integration
                    </h3>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">
                      The staff components (StaffForm, StaffDashboard,
                      PayrollDashboard) have been created and are ready for
                      integration. The navigation system is now in place to
                      access all staff management features from the Accounting
                      Dashboard.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 dark:bg-gray-950">
      {renderView()}
    </div>
  );
}
