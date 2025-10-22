"use client";

import React from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  GraduationCap,
  DollarSign,
  CreditCard,
  Receipt,
  UserCog,
  Building,
  TrendingDown,
  FileText,
  Settings,
  BookOpen,
  Calculator,
  BarChart3,
  Database,
  Shield,
  Wrench,
} from "lucide-react";

interface RouteLink {
  title: string;
  href: string;
  description: string;
  icon: React.ReactNode;
  permission?: string;
}

interface RouteSection {
  section: string;
  routes: RouteLink[];
}

export default function DevDashboard() {
  const allRoutes: RouteSection[] = [
    {
      section: "User Management",
      routes: [
        {
          title: "Users",
          href: "/dashboard/users",
          description: "Manage user accounts, roles, and permissions",
          icon: <Users className="h-5 w-5" />,
          permission: "users.view",
        },
      ],
    },
    {
      section: "Student Management",
      routes: [
        {
          title: "Students",
          href: "/dashboard/students",
          description: "View and manage student profiles",
          icon: <GraduationCap className="h-5 w-5" />,
          permission: "students.view",
        },
        {
          title: "Classes",
          href: "/dashboard/students/classes",
          description: "Manage school classes and sections",
          icon: <BookOpen className="h-5 w-5" />,
          permission: "students.view",
        },
      ],
    },
    {
      section: "Fee Management",
      routes: [
        {
          title: "Fee Structure",
          href: "/dashboard/fees",
          description: "Configure fee structures by class and term",
          icon: <DollarSign className="h-5 w-5" />,
          permission: "fees.view",
        },
        {
          title: "Fee Assignments",
          href: "/dashboard/fees/assignments",
          description: "Assign fees to students",
          icon: <Receipt className="h-5 w-5" />,
          permission: "fees.view",
        },
      ],
    },
    {
      section: "Payments",
      routes: [
        {
          title: "Payments",
          href: "/dashboard/payments",
          description: "Record and track student fee payments",
          icon: <CreditCard className="h-5 w-5" />,
          permission: "payments.view",
        },
      ],
    },
    {
      section: "Expenses",
      routes: [
        {
          title: "Expenses",
          href: "/dashboard/expenses",
          description: "Record and manage operational expenses",
          icon: <Receipt className="h-5 w-5" />,
          permission: "expenses.view",
        },
        {
          title: "Expense Approval",
          href: "/dashboard/expenses/approval",
          description: "Review and approve pending expenses",
          icon: <Shield className="h-5 w-5" />,
          permission: "expenses.approve",
        },
        {
          title: "Expense Categories",
          href: "/dashboard/expenses/categories",
          description: "Manage expense categories",
          icon: <Database className="h-5 w-5" />,
          permission: "expenses.view",
        },
      ],
    },
    {
      section: "Staff & Payroll",
      routes: [
        {
          title: "Staff",
          href: "/dashboard/staff",
          description: "Manage staff members and details",
          icon: <UserCog className="h-5 w-5" />,
          permission: "staff.view",
        },
        {
          title: "Salary Processing",
          href: "/dashboard/staff/salary",
          description: "Process monthly staff salaries",
          icon: <DollarSign className="h-5 w-5" />,
          permission: "staff.process_salary",
        },
      ],
    },
    {
      section: "Assets",
      routes: [
        {
          title: "Fixed Assets",
          href: "/dashboard/assets",
          description: "Manage school fixed assets and equipment",
          icon: <Building className="h-5 w-5" />,
          permission: "assets.view",
        },
        {
          title: "Depreciation",
          href: "/dashboard/assets/depreciation",
          description: "Calculate and post asset depreciation",
          icon: <TrendingDown className="h-5 w-5" />,
          permission: "assets.depreciate",
        },
        {
          title: "Asset Maintenance",
          href: "/dashboard/assets/maintenance",
          description: "Track asset maintenance and repairs",
          icon: <Wrench className="h-5 w-5" />,
          permission: "assets.view",
        },
      ],
    },
    {
      section: "Accounting",
      routes: [
        {
          title: "Chart of Accounts",
          href: "/dashboard/accounting/coa",
          description: "Manage chart of accounts",
          icon: <Database className="h-5 w-5" />,
          permission: "accounting.manage_coa",
        },
        {
          title: "Journal Entries",
          href: "/dashboard/accounting/journal",
          description: "View and create journal entries",
          icon: <BookOpen className="h-5 w-5" />,
          permission: "accounting.view",
        },
      ],
    },
    {
      section: "Reports",
      routes: [
        {
          title: "Financial Reports",
          href: "/dashboard/reports",
          description: "Generate financial and operational reports",
          icon: <BarChart3 className="h-5 w-5" />,
          permission: "reports.view",
        },
        {
          title: "Income Statement",
          href: "/dashboard/reports/income-statement",
          description: "View profit and loss statement",
          icon: <FileText className="h-5 w-5" />,
          permission: "reports.financial",
        },
        {
          title: "Balance Sheet",
          href: "/dashboard/reports/balance-sheet",
          description: "View balance sheet",
          icon: <Calculator className="h-5 w-5" />,
          permission: "reports.financial",
        },
      ],
    },
    {
      section: "Settings",
      routes: [
        {
          title: "School Settings",
          href: "/dashboard/settings",
          description: "Configure school information and preferences",
          icon: <Settings className="h-5 w-5" />,
          permission: "settings.view",
        },
      ],
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="rounded-r-lg border-l-4 border-yellow-500 bg-yellow-50 p-4 dark:bg-yellow-900/20">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Wrench className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
              Development Mode
            </h3>
            <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-400">
              <p>
                This is a development dashboard for testing and navigation. All
                permission checks are bypassed.
                <strong className="font-semibold">
                  {" "}
                  Remove this page in production!
                </strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Development Dashboard
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Quick access to all application pages
        </p>
      </div>

      {/* Route Sections */}
      {allRoutes.map((section) => (
        <div key={section.section} className="space-y-4">
          <h2 className="border-b pb-2 text-xl font-semibold text-gray-800 dark:text-gray-200">
            {section.section}
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {section.routes.map((route) => (
              <Link key={route.href} href={route.href}>
                <Card className="h-full cursor-pointer transition-shadow hover:border-blue-400 hover:shadow-lg">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-blue-100 p-2 text-blue-600 dark:bg-blue-900 dark:text-blue-400">
                        {route.icon}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base">
                          {route.title}
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">
                      {route.description}
                    </CardDescription>
                    {route.permission && (
                      <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                        Permission:{" "}
                        <code className="rounded bg-gray-100 px-1 py-0.5 dark:bg-gray-800">
                          {route.permission}
                        </code>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {/* Footer Notice */}
      <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
        <p className="text-sm text-red-800 dark:text-red-300">
          <strong>⚠️ Important:</strong> This development dashboard should be
          removed or disabled in production. Delete the file at{" "}
          <code className="rounded bg-red-100 px-1 py-0.5 dark:bg-red-900">
            src/app/dashboard/dev/page.tsx
          </code>{" "}
          before deployment.
        </p>
      </div>
    </div>
  );
}
