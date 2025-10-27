"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUpIcon,
  TrendingDownIcon,
  AlertCircleIcon,
  RefreshCwIcon,
  DollarSignIcon,
  CalendarIcon,
  ActivityIcon,
} from "lucide-react";
import { cashFlowProjectionService } from "@/services/bankingService";
import { useSchool } from "@/contexts/SchoolContext";
import type { CashFlowProjection } from "@/types";

export function CashFlowDashboard() {
  const [projections, setProjections] = useState<CashFlowProjection[]>([]);
  const [loading, setLoading] = useState(true);
  const { formatCurrency } = useSchool();

  useEffect(() => {
    loadProjections();
  }, []);

  async function loadProjections() {
    try {
      setLoading(true);
      const allProjections = await cashFlowProjectionService.list();
      const sorted = allProjections.sort((a, b) =>
        b.projectionDate.localeCompare(a.projectionDate)
      );
      setProjections(sorted);
    } catch (error) {
      console.error("Error loading cash flow projections:", error);
    } finally {
      setLoading(false)
;
    }
  }

  const latestProjection = projections[0];

  const getLiquidityColor = (status: CashFlowProjection["liquidityStatus"]) => {
    switch (status) {
      case "healthy":
        return "text-green-600 bg-green-100 dark:bg-green-900/20";
      case "adequate":
        return "text-blue-600 bg-blue-100 dark:bg-blue-900/20";
      case "tight":
        return "text-orange-600 bg-orange-100 dark:bg-orange-900/20";
      case "critical":
        return "text-red-600 bg-red-100 dark:bg-red-900/20";
      default:
        return "text-gray-600 bg-gray-100 dark:bg-gray-900/20";
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCwIcon className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Cash Flow Dashboard
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Monitor liquidity and cash position
          </p>
        </div>
        <button
          onClick={loadProjections}
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <RefreshCwIcon className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {projections.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 py-16 text-center dark:border-gray-600 dark:bg-gray-900/50">
          <ActivityIcon className="mx-auto mb-4 h-16 w-16 text-gray-400 dark:text-gray-500" />
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            No Cash Flow Projections
          </h3>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Create cash flow projections to monitor liquidity
          </p>
        </div>
      ) : (
        <>
          {/* Latest Projection Summary */}
          {latestProjection && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {/* Projected Closing Balance */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Projected Balance
                  </p>
                  <DollarSignIcon className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(latestProjection.projectedClosingBalance)}
                </p>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  As of {new Date(latestProjection.projectionDate).toLocaleDateString()}
                </p>
              </div>

              {/* Net Cash Flow */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Net Cash Flow
                  </p>
                  {latestProjection.projectedNetCashFlow >= 0 ? (
                    <TrendingUpIcon className="h-5 w-5 text-green-600" />
                  ) : (
                    <TrendingDownIcon className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <p
                  className={`text-3xl font-bold ${
                    latestProjection.projectedNetCashFlow >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {formatCurrency(latestProjection.projectedNetCashFlow)}
                </p>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {latestProjection.periodStart} to {latestProjection.periodEnd}
                </p>
              </div>

              {/* Days of Cash */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Days of Cash
                  </p>
                  <CalendarIcon className="h-5 w-5 text-purple-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {latestProjection.daysOfCashOnHand}
                </p>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Days of operations covered
                </p>
              </div>

              {/* Liquidity Status */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Liquidity Status
                  </p>
                  <AlertCircleIcon className="h-5 w-5 text-orange-600" />
                </div>
                <span
                  className={`inline-block rounded-full px-4 py-2 text-sm font-semibold capitalize ${getLiquidityColor(
                    latestProjection.liquidityStatus
                  )}`}
                >
                  {latestProjection.liquidityStatus}
                </span>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Current assessment
                </p>
              </div>
            </div>
          )}

          {/* Projection History */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Projection History
            </h3>
            <div className="space-y-4">
              {projections.map((projection) => (
                <div
                  key={projection.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {new Date(projection.projectionDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {projection.periodStart} to {projection.periodEnd}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 dark:text-white">
                      {formatCurrency(projection.projectedClosingBalance)}
                    </p>
                    <span
                      className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${getLiquidityColor(
                        projection.liquidityStatus
                      )}`}
                    >
                      {projection.liquidityStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
