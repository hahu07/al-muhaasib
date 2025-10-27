"use client";

/**
 * BRANDING PREVIEW
 *
 * Real-time preview of how branding changes will look throughout the app.
 * Shows navigation, buttons, cards, and reports with live updates.
 */

import React from "react";
import { Card } from "@/components/ui/card";
import {
  Home,
  Users,
  DollarSign,
  Settings,
  Menu,
  Bell,
  Search,
} from "lucide-react";

interface BrandingPreviewProps {
  schoolName: string;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

export function BrandingPreview({
  schoolName,
  logo,
  primaryColor,
  secondaryColor,
  accentColor,
}: BrandingPreviewProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Live Preview</h3>

      {/* Navigation Preview */}
      <Card className="overflow-hidden p-0">
        <div className="bg-white p-4 dark:bg-gray-900">
          <p className="mb-3 text-sm font-medium text-gray-600 dark:text-gray-400">
            Navigation
          </p>
          <div className="flex items-center justify-between rounded-lg border bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-3">
              {logo ? (
                <img
                  src={logo}
                  alt="Logo"
                  className="h-8 w-8 object-contain"
                />
              ) : (
                <div
                  className="flex h-8 w-8 items-center justify-center rounded"
                  style={{ backgroundColor: primaryColor }}
                >
                  <span className="text-xs font-bold text-white">
                    {schoolName.charAt(0)}
                  </span>
                </div>
              )}
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {schoolName}
              </span>
            </div>
            <div className="flex gap-2">
              <Bell className="h-5 w-5 text-gray-600" />
              <Menu className="h-5 w-5 text-gray-600" />
            </div>
          </div>
        </div>
      </Card>

      {/* Menu Items Preview */}
      <Card className="p-4">
        <p className="mb-3 text-sm font-medium text-gray-600 dark:text-gray-400">
          Menu Items
        </p>
        <div className="space-y-2">
          {[
            { icon: Home, label: "Dashboard", active: true },
            { icon: Users, label: "Students", active: false },
            { icon: DollarSign, label: "Payments", active: false },
            { icon: Settings, label: "Settings", active: false },
          ].map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 rounded-lg p-2 transition-colors"
              style={{
                backgroundColor: item.active
                  ? `${primaryColor}15`
                  : "transparent",
                color: item.active ? primaryColor : "inherit",
              }}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Buttons Preview */}
      <Card className="p-4">
        <p className="mb-3 text-sm font-medium text-gray-600 dark:text-gray-400">
          Buttons
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: primaryColor }}
          >
            Primary Button
          </button>
          <button
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: secondaryColor }}
          >
            Secondary Button
          </button>
          <button
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: accentColor }}
          >
            Accent Button
          </button>
        </div>
      </Card>

      {/* Cards and Content Preview */}
      <Card className="p-4">
        <p className="mb-3 text-sm font-medium text-gray-600 dark:text-gray-400">
          Content Cards
        </p>
        <div className="space-y-3">
          {/* Metric Card */}
          <div
            className="rounded-lg border-2 p-4"
            style={{
              borderColor: primaryColor,
              backgroundColor: `${primaryColor}08`,
            }}
          >
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Total Students
            </p>
            <p
              className="text-2xl font-bold"
              style={{ color: primaryColor }}
            >
              1,234
            </p>
          </div>

          {/* Alert/Badge */}
          <div className="flex items-center gap-2">
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold text-white"
              style={{ backgroundColor: accentColor }}
            >
              New
            </span>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              5 pending approvals
            </span>
          </div>

          {/* Link */}
          <a
            href="#"
            className="text-sm font-medium hover:underline"
            style={{ color: primaryColor }}
          >
            View detailed report →
          </a>
        </div>
      </Card>

      {/* Table Preview */}
      <Card className="overflow-hidden p-0">
        <div className="p-4">
          <p className="mb-3 text-sm font-medium text-gray-600 dark:text-gray-400">
            Tables & Reports
          </p>
        </div>
        <table className="w-full">
          <thead
            style={{
              backgroundColor: `${primaryColor}10`,
            }}
          >
            <tr>
              <th
                className="px-4 py-2 text-left text-sm font-semibold"
                style={{ color: primaryColor }}
              >
                Student Name
              </th>
              <th
                className="px-4 py-2 text-left text-sm font-semibold"
                style={{ color: primaryColor }}
              >
                Class
              </th>
              <th
                className="px-4 py-2 text-right text-sm font-semibold"
                style={{ color: primaryColor }}
              >
                Fee Status
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              { name: "John Doe", class: "Grade 10", status: "Paid" },
              { name: "Jane Smith", class: "Grade 9", status: "Pending" },
            ].map((row, idx) => (
              <tr key={idx} className="border-t">
                <td className="px-4 py-2 text-sm">{row.name}</td>
                <td className="px-4 py-2 text-sm">{row.class}</td>
                <td className="px-4 py-2 text-right text-sm">
                  <span
                    className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                      row.status === "Paid"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Form Elements Preview */}
      <Card className="p-4">
        <p className="mb-3 text-sm font-medium text-gray-600 dark:text-gray-400">
          Form Elements
        </p>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Search Students
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Type to search..."
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm transition-colors dark:border-gray-600 dark:bg-gray-800"
                onFocus={(e) => {
                  e.target.style.borderColor = primaryColor;
                  e.target.style.outline = `2px solid ${primaryColor}30`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "";
                  e.target.style.outline = "";
                }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Color Swatches */}
      <Card className="p-4">
        <p className="mb-3 text-sm font-medium text-gray-600 dark:text-gray-400">
          Color Palette
        </p>
        <div className="flex gap-3">
          {[
            { color: primaryColor, label: "Primary" },
            { color: secondaryColor, label: "Secondary" },
            { color: accentColor, label: "Accent" },
          ].map((swatch, idx) => (
            <div key={idx} className="flex-1">
              <div
                className="h-16 rounded-lg border shadow-sm"
                style={{ backgroundColor: swatch.color }}
              />
              <p className="mt-2 text-center text-xs font-medium text-gray-600">
                {swatch.label}
              </p>
              <p className="text-center text-xs text-gray-400">
                {swatch.color}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
