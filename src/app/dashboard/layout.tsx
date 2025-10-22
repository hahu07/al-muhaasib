"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { RoleSwitcher } from "@/components/dev/RoleSwitcher";
// import { SetupGuard } from '@/components/SetupGuard';
import {
  Users,
  GraduationCap,
  DollarSign,
  CreditCard,
  Receipt,
  UserCog,
  Building,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Home,
  BookOpen,
  Calculator,
  Palette,
  Calendar,
  MapPin,
  Grid,
  Wallet,
  ArrowLeft,
  Database,
  FileText,
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  permission?: string;
  badge?: string;
  children?: NavItem[];
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { appUser, hasPermission, signOut, loading } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  // Determine current section
  const getCurrentSection = () => {
    if (pathname.startsWith("/dashboard/settings")) return "settings";
    if (pathname.startsWith("/dashboard/accounting")) return "accounting";
    if (pathname.startsWith("/dashboard/users")) return "users";
    if (pathname.startsWith("/dashboard/students")) return "students";
    if (pathname.startsWith("/dashboard/fees")) return "fees";
    if (pathname.startsWith("/dashboard/payments")) return "payments";
    if (pathname.startsWith("/dashboard/expenses")) return "expenses";
    if (pathname.startsWith("/dashboard/staff")) return "staff";
    if (pathname.startsWith("/dashboard/assets")) return "assets";
    if (pathname.startsWith("/dashboard/reports")) return "reports";
    return "overview";
  };

  const currentSection = getCurrentSection();

  // Context-specific navigation
  const getNavigationForSection = (): NavItem[] => {
    // Settings Dashboard - has its own tab navigation in the page
    if (currentSection === "settings") {
      return [
        {
          title: "← Back to Dashboard",
          href: "/dashboard",
          icon: <ArrowLeft className="h-5 w-5" />,
        },
        {
          title: "School Settings",
          href: "/dashboard/settings",
          icon: <Settings className="h-5 w-5" />,
        },
      ];
    }

    // Accounting Dashboard
    if (currentSection === "accounting") {
      return [
        {
          title: "← Back to Dashboard",
          href: "/dashboard",
          icon: <ArrowLeft className="h-5 w-5" />,
        },
        {
          title: "Overview",
          href: "/dashboard/accounting",
          icon: <Calculator className="h-5 w-5" />,
        },
        {
          title: "Setup",
          href: "/dashboard/accounting/setup",
          icon: <Database className="h-5 w-5" />,
          permission: "accounting.view",
        },
        {
          title: "Chart of Accounts",
          href: "/dashboard/accounting/coa",
          icon: <BookOpen className="h-5 w-5" />,
          permission: "accounting.manage_coa",
        },
        {
          title: "Journal Entries",
          href: "/dashboard/accounting/journal",
          icon: <FileText className="h-5 w-5" />,
          permission: "accounting.view",
        },
      ];
    }

    // Users Dashboard
    if (currentSection === "users") {
      return [
        {
          title: "← Back to Dashboard",
          href: "/dashboard",
          icon: <ArrowLeft className="h-5 w-5" />,
        },
        {
          title: "All Users",
          href: "/dashboard/users",
          icon: <Users className="h-5 w-5" />,
          permission: "users.view",
        },
      ];
    }

    // Main Dashboard - show only main 4 sections
    return [
      {
        title: "Overview",
        href: "/dashboard",
        icon: <Home className="h-5 w-5" />,
      },
      {
        title: "Users",
        href: "/dashboard/users",
        icon: <Users className="h-5 w-5" />,
        permission: "users.view",
      },
      {
        title: "Accounting",
        href: "/dashboard/accounting",
        icon: <Calculator className="h-5 w-5" />,
        permission: "accounting.view",
      },
      {
        title: "Settings",
        href: "/dashboard/settings",
        icon: <Settings className="h-5 w-5" />,
        permission: "settings.view",
      },
    ];
  };

  const navigation = getNavigationForSection();

  const toggleMenu = (title: string) => {
    setExpandedMenus((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title],
    );
  };

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  const canAccess = (item: NavItem) => {
    if (!item.permission) return true;
    return hasPermission(item.permission);
  };

  // Show loading state while auth is loading
  if (loading || !appUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    // Temporarily disabled SetupGuard to avoid IC signature errors during development
    // <SetupGuard>
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-gray-200 bg-white transition-transform duration-200 ease-in-out dark:border-gray-700 dark:bg-gray-800 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b border-gray-200 px-6 dark:border-gray-700">
            <Link href="/dashboard/dev" className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-blue-600" />
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Al-Muhaasib
              </span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-500 hover:text-gray-700 lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
            {navigation.map((item) => {
              if (!canAccess(item)) return null;

              const itemActive = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    itemActive
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  {item.icon}
                  <span>{item.title}</span>
                  {item.badge && (
                    <span className="ml-auto rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="border-t border-gray-200 p-4 dark:border-gray-700">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 font-semibold text-white">
                {appUser.firstname?.[0]}
                {appUser.surname?.[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                  {appUser.firstname} {appUser.surname}
                </p>
                <p className="truncate text-xs text-gray-500 capitalize dark:text-gray-400">
                  {appUser.role.replace("_", " ")}
                </p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile menu button */}
      <div className="fixed top-0 right-0 left-0 z-40 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:hidden dark:border-gray-700 dark:bg-gray-800">
        <button
          onClick={() => setSidebarOpen(true)}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <Menu className="h-6 w-6" />
        </button>
        <Link href="/dashboard/dev" className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-blue-600" />
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Al-Muhaasib
          </span>
        </Link>
        <div className="w-6" /> {/* Spacer */}
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="bg-opacity-50 fixed inset-0 z-40 bg-black lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="min-h-screen pt-16 lg:ml-64 lg:pt-0">{children}</main>

      {/* Development Role Switcher */}
      <RoleSwitcher />
    </div>
    // </SetupGuard>
  );
}
