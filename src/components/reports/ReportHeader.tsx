"use client";

/**
 * REPORT HEADER COMPONENT
 *
 * Displays school information at the top of reports.
 * Automatically pulls data from SchoolContext.
 */

import React from "react";
import { useSchool } from "@/contexts/SchoolContext";

interface ReportHeaderProps {
  reportTitle: string;
  reportSubtitle?: string;
  className?: string;
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({
  reportTitle,
  reportSubtitle,
  className = "",
}) => {
  const { config } = useSchool();

  return (
    <div className={`text-center ${className}`}>
      {/* School Logo */}
      {config?.branding?.logo && (
        <div className="mb-4 flex justify-center">
          <img
            src={config.branding.logo}
            alt={`${config.schoolName} Logo`}
            className="h-16 w-16 object-contain"
          />
        </div>
      )}

      {/* School Name */}
      <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
        {config?.schoolName || "School Name"}
      </h1>

      {/* School Address */}
      {config?.address && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {config.address}, {config.city}, {config.state}
        </p>
      )}

      {/* Contact Information */}
      <div className="mb-4 flex justify-center gap-4 text-sm text-gray-600 dark:text-gray-400">
        {config?.phone && <span>Tel: {config.phone}</span>}
        {config?.email && <span>Email: {config.email}</span>}
      </div>

      {/* Report Title */}
      <div className="mt-6 border-t border-gray-300 pt-4 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {reportTitle}
        </h2>
        {reportSubtitle && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {reportSubtitle}
          </p>
        )}
      </div>
    </div>
  );
};
