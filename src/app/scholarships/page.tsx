"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  PlusIcon,
  Edit2Icon,
  TrashIcon,
  AwardIcon,
  UsersIcon,
  CalendarIcon,
  TrendingUpIcon,
  ArrowLeftIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ScholarshipForm } from "@/components/scholarships/ScholarshipForm";
import { scholarshipService } from "@/services";
import { PERMISSIONS, type Scholarship } from "@/types";
import { useSchool } from "@/contexts/SchoolContext";
import { useAuth } from "@/contexts/AuthContext";

export default function ScholarshipsPage() {
  const router = useRouter();
  const { hasPermission, loading: authLoading } = useAuth();
  const { formatCurrency } = useSchool();
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingScholarship, setEditingScholarship] = useState<
    Scholarship | undefined
  >();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const canViewScholarships = hasPermission(PERMISSIONS.SCHOLARSHIPS_VIEW);
  const canCreateScholarships = hasPermission(PERMISSIONS.SCHOLARSHIPS_CREATE);
  const canEditScholarships = hasPermission(PERMISSIONS.SCHOLARSHIPS_EDIT);
  const canDeleteScholarships = hasPermission(PERMISSIONS.SCHOLARSHIPS_DELETE);

  const loadScholarships = useCallback(async () => {
    try {
      setLoading(true);
      const data = await scholarshipService.list();
      setScholarships(data);
    } catch (error) {
      console.error("Error loading scholarships:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canViewScholarships) {
      return;
    }
    void loadScholarships();
  }, [canViewScholarships, loadScholarships]);

  const handleDelete = async (id: string) => {
    if (!canDeleteScholarships) {
      alert("You do not have permission to delete scholarships.");
      return;
    }

    if (!confirm("Are you sure you want to delete this scholarship?")) return;

    try {
      setDeletingId(id);
      await scholarshipService.delete(id);
      await loadScholarships();
    } catch (error) {
      console.error("Error deleting scholarship:", error);
      alert("Failed to delete scholarship");
    } finally {
      setDeletingId(null);
    }
  };

  const getScholarshipBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "suspended":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "expired":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const getScholarshipTypeLabel = (scholarship: Scholarship) => {
    if (scholarship.type === "percentage") {
      return `${scholarship.percentageOff}% Off`;
    } else if (scholarship.type === "fixed_amount") {
      return `${formatCurrency(scholarship.fixedAmountOff || 0)} Off`;
    } else {
      return "Full Waiver";
    }
  };

  const getApplicabilityLabel = (scholarship: Scholarship) => {
    if (scholarship.applicableTo === "all") return "All Students";
    if (scholarship.applicableTo === "specific_classes") return "Specific Classes";
    return "Specific Students";
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading your permissions...
          </p>
        </div>
      </div>
    );
  }

  if (!canViewScholarships) {
    return (
      <div className="container mx-auto py-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/accounting")}
          className="mb-4"
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to Accounting Dashboard
        </Button>
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12 text-center dark:border-gray-700 dark:bg-gray-900/50">
          <AwardIcon className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Permission Required
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            You do not have permission to view scholarships. Please contact your
            administrator if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push("/dashboard/accounting")}
        className="mb-4"
      >
        <ArrowLeftIcon className="mr-2 h-4 w-4" />
        Back to Accounting Dashboard
      </Button>

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Scholarships & Discounts
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage fee waivers, discounts, and financial aid
          </p>
        </div>
        {canCreateScholarships && (
          <Button onClick={() => setShowCreateModal(true)}>
            <PlusIcon className="mr-2 h-4 w-4" />
            New Scholarship
          </Button>
        )}
      </div>

      {/* Statistics */}
      {!loading && scholarships.length > 0 && (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900/20">
                <AwardIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Scholarships
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {scholarships.length}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-3 dark:bg-green-900/20">
                <TrendingUpIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Active
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {scholarships.filter((s) => s.status === "active").length}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-3 dark:bg-purple-900/20">
                <UsersIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Beneficiaries
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {scholarships.reduce(
                    (sum, s) => sum + (s.currentBeneficiaries || 0),
                    0
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-100 p-3 dark:bg-orange-900/20">
                <CalendarIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Expiring Soon
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {
                    scholarships.filter((s) => {
                      if (!s.endDate) return false;
                      const daysUntilEnd = Math.floor(
                        (new Date(s.endDate).getTime() - Date.now()) /
                          (1000 * 60 * 60 * 24)
                      );
                      return daysUntilEnd >= 0 && daysUntilEnd <= 30;
                    }).length
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scholarships List */}
      {loading ? (
        <div className="py-12 text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading scholarships...
          </p>
        </div>
      ) : scholarships.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 py-12 text-center dark:border-gray-700 dark:bg-gray-900/50">
          <AwardIcon className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
            No scholarships yet
          </h3>
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            {canCreateScholarships
              ? "Create your first scholarship to provide financial aid to students"
              : "You can review scholarships once an authorized user creates them."}
          </p>
          {canCreateScholarships && (
            <Button onClick={() => setShowCreateModal(true)}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Create Scholarship
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {scholarships.map((scholarship) => (
            <div
              key={scholarship.id}
              className="rounded-lg border bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
            >
              {/* Header */}
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {scholarship.name}
                  </h3>
                  <span
                    className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${getScholarshipBadgeColor(scholarship.status)}`}
                  >
                    {scholarship.status.charAt(0).toUpperCase() +
                      scholarship.status.slice(1)}
                  </span>
                </div>
              </div>

              {/* Description */}
              {scholarship.description && (
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                  {scholarship.description}
                </p>
              )}

              {/* Details */}
              <div className="mb-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Discount:
                  </span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {getScholarshipTypeLabel(scholarship)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Applies to:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {getApplicabilityLabel(scholarship)}
                  </span>
                </div>

                {scholarship.maxBeneficiaries && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Beneficiaries:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {scholarship.currentBeneficiaries || 0} /{" "}
                      {scholarship.maxBeneficiaries}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Valid:
                  </span>
                  <span className="text-xs text-gray-900 dark:text-gray-100">
                    {new Date(scholarship.startDate).toLocaleDateString()}
                    {scholarship.endDate && (
                      <> - {new Date(scholarship.endDate).toLocaleDateString()}</>
                    )}
                  </span>
                </div>

                {scholarship.sponsor && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Sponsor:
                    </span>
                    <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                      {scholarship.sponsor}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              {(canEditScholarships || canDeleteScholarships) && (
                <div className="flex gap-2 border-t pt-4 dark:border-gray-800">
                  {canEditScholarships && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setEditingScholarship(scholarship)}
                    >
                      <Edit2Icon className="mr-1 h-3 w-3" />
                      Edit
                    </Button>
                  )}
                  {canDeleteScholarships && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                      onClick={() => handleDelete(scholarship.id)}
                      disabled={deletingId === scholarship.id}
                    >
                      <TrashIcon className="mr-1 h-3 w-3" />
                      {deletingId === scholarship.id ? "..." : "Delete"}
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {canCreateScholarships && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create New Scholarship"
          size="lg"
        >
          <ScholarshipForm
            onSuccess={() => {
              setShowCreateModal(false);
              void loadScholarships();
            }}
            onCancel={() => setShowCreateModal(false)}
          />
        </Modal>
      )}

      {/* Edit Modal */}
      {canEditScholarships && (
        <Modal
          isOpen={!!editingScholarship}
          onClose={() => setEditingScholarship(undefined)}
          title="Edit Scholarship"
          size="lg"
        >
          {editingScholarship && (
            <ScholarshipForm
              scholarship={editingScholarship}
              onSuccess={() => {
                setEditingScholarship(undefined);
                void loadScholarships();
              }}
              onCancel={() => setEditingScholarship(undefined)}
            />
          )}
        </Modal>
      )}
    </div>
  );
}
