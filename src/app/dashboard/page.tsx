"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Users,
  Settings,
  Calculator,
  Wrench,
  ArrowRight,
  Info,
  Shield,
  Lock,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { chartOfAccountsService } from "@/services";

export default function DashboardPage() {
  const { appUser, isSuperAdmin, isBursar } = useAuth();
  const [coaInitialized, setCoaInitialized] = useState(true);
  const [checkingCOA, setCheckingCOA] = useState(true);

  useEffect(() => {
    const checkCOA = async () => {
      try {
        const accounts = await chartOfAccountsService.list();
        setCoaInitialized(accounts.length > 0);
      } catch (error) {
        console.error("Error checking COA:", error);
      } finally {
        setCheckingCOA(false);
      }
    };
    checkCOA();
  }, []);

  const subDashboards = [
    {
      title: "User Management",
      description: "Manage user accounts, roles, and permissions",
      icon: <Users className="h-12 w-12" />,
      href: "/dashboard/users",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      borderColor: "border-blue-200 dark:border-blue-800",
      restricted: !(isSuperAdmin || isBursar),
      features: [
        "View all users",
        "Create & edit users",
        "Assign roles & permissions",
        "Activate/deactivate accounts",
      ],
    },
    {
      title: "School Settings",
      description: "Configure your school information and preferences",
      icon: <Settings className="h-12 w-12" />,
      href: "/dashboard/settings",
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      borderColor: "border-purple-200 dark:border-purple-800",
      restricted: false,
      features: [
        "School information",
        "Branding & colors",
        "Academic calendar",
        "Payment settings",
      ],
    },
    {
      title: "Accounting Dashboard",
      description: "Access full accounting and financial management",
      icon: <Calculator className="h-12 w-12" />,
      href: "/dashboard/accounting",
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      borderColor: "border-green-200 dark:border-green-800",
      restricted: false,
      features: [
        "Students & fees",
        "Payments & expenses",
        "Staff & payroll",
        "Reports & analytics",
      ],
    },
    {
      title: "Development Tools",
      description: "Quick access to all pages for testing (Dev only)",
      icon: <Wrench className="h-12 w-12" />,
      href: "/dashboard/dev",
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      borderColor: "border-orange-200 dark:border-orange-800",
      restricted: false,
      features: [
        "Quick navigation",
        "All pages overview",
        "Development testing",
        "Feature discovery",
      ],
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Welcome back, {appUser?.firstname}! 👋
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Choose a section below to get started with Al-Muhaasib
        </p>
      </div>

      {/* Chart of Accounts Setup Alert - CRITICAL */}
      {!checkingCOA && !coaInitialized && (
        <Alert className="border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/30">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-300">
            <div className="space-y-3">
              <div>
                <strong className="text-lg">⚠️ Critical Setup Required!</strong>
                <p className="mt-1">
                  Your <strong>Chart of Accounts</strong> has not been
                  initialized. This is required before you can:
                </p>
                <ul className="mt-2 ml-2 list-inside list-disc space-y-1 text-sm">
                  <li>Record payments and expenses</li>
                  <li>Generate financial reports</li>
                  <li>Track transactions properly</li>
                </ul>
              </div>
              <Link href="/dashboard/accounting/setup">
                <Button
                  size="sm"
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  Initialize Chart of Accounts Now →
                </Button>
              </Link>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* New User Guide */}
      <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 dark:text-blue-300">
          <strong>New to Al-Muhaasib?</strong> Follow these steps:
          <ol className="mt-2 list-inside list-decimal space-y-1 text-sm">
            <li>
              <strong>Initialize Chart of Accounts</strong> (if not done) via
              Accounting → Setup
            </li>
            <li>
              Configure <strong>Settings</strong> with your school information
            </li>
            <li>
              Use <strong>Accounting Dashboard</strong> for daily operations
            </li>
            <li>
              Explore all features via <strong>Development Tools</strong>
            </li>
          </ol>
        </AlertDescription>
      </Alert>

      {/* Sub-Dashboards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {subDashboards.map((dashboard) => (
          <Link key={dashboard.title} href={dashboard.href}>
            <Card
              className={`h-full cursor-pointer border-2 transition-all hover:shadow-xl ${dashboard.borderColor} ${dashboard.bgColor} ${dashboard.restricted ? "opacity-75" : ""}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="mb-2 text-xl">
                        {dashboard.title}
                      </CardTitle>
                      {dashboard.restricted && (
                        <Lock className="h-4 w-4 text-gray-500" />
                      )}
                    </div>
                    <CardDescription className="text-base">
                      {dashboard.description}
                      {dashboard.restricted && (
                        <span className="mt-1 block text-xs text-yellow-600 dark:text-yellow-500">
                          ⚠️ Admin access required
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div
                    className={`rounded-xl bg-gradient-to-br p-3 ${dashboard.color} text-white ${dashboard.restricted ? "opacity-60" : ""}`}
                  >
                    {dashboard.icon}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Features:
                  </p>
                  <ul className="space-y-2">
                    {dashboard.features.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                      >
                        <div className="h-1.5 w-1.5 rounded-full bg-gray-400"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center gap-2 pt-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                    <span>Open {dashboard.title}</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Access Info for non-admins */}
      {!isSuperAdmin && !isBursar && (
        <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
          <Shield className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-300">
            <strong>Note:</strong> Sections marked with a lock icon (🔒) are
            restricted based on your role ({appUser?.role.replace("_", " ")}).
            You can view them but need admin permission to access. Contact your
            administrator if you need access.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
