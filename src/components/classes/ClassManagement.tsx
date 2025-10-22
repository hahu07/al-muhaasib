"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  PlusIcon,
  Edit2Icon,
  TrashIcon,
  UsersIcon,
  BookOpenIcon,
  SearchIcon,
  AlertCircle,
  ArrowLeftIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ClassForm } from "./ClassForm";
import { classService } from "@/services";
import type { SchoolClass } from "@/types";

export function ClassManagement() {
  const router = useRouter();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    let filtered = [...classes];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          String(c.name || "")
            .toLowerCase()
            .includes(term) ||
          String(c.section || "")
            .toLowerCase()
            .includes(term) ||
          String(c.room || "")
            .toLowerCase()
            .includes(term),
      );
    }

    // Level filter
    if (levelFilter !== "all") {
      filtered = filtered.filter((c) => c.level === levelFilter);
    }

    setFilteredClasses(filtered);
  }, [classes, searchTerm, levelFilter]);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const data = await classService.list();
      setClasses(data);
    } catch (error) {
      console.error("Error loading classes:", error);
      alert("Failed to load classes");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    loadClasses();
  };

  const handleEditSuccess = () => {
    setEditingClass(null);
    loadClasses();
  };

  const handleDelete = async (classItem: SchoolClass) => {
    if (classItem.currentEnrollment > 0) {
      alert(
        "Cannot delete class with enrolled students. Please move students first.",
      );
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete ${classItem.name}${classItem.section ? ` ${classItem.section}` : ""}?`,
      )
    ) {
      return;
    }

    try {
      await classService.delete(classItem.id);
      loadClasses();
    } catch (error) {
      console.error("Error deleting class:", error);
      alert("Failed to delete class");
    }
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case "nursery":
        return "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300";
      case "primary":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "jss":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "sss":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const getCapacityColor = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage >= 90) return "text-red-600 dark:text-red-400";
    if (percentage >= 75) return "text-yellow-600 dark:text-yellow-400";
    return "text-green-600 dark:text-green-400";
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push("/students")}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back to Students
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-blue-100">
                Class Management
              </h1>
              <p className="mt-1 text-gray-600 dark:text-blue-300">
                Create and manage school classes
              </p>
            </div>
          </div>
          <Button onClick={() => setShowCreateModal(true)} variant="primary">
            <PlusIcon className="mr-2 h-4 w-4" />
            Create Class
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <BookOpenIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-blue-300">
                  Total Classes
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-blue-100">
                  {classes.length}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <UsersIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-blue-300">
                  Total Capacity
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-blue-100">
                  {classes.reduce((sum, c) => sum + (c.capacity || 0), 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <UsersIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-blue-300">
                  Enrolled
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-blue-100">
                  {classes.reduce((sum, c) => sum + c.currentEnrollment, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-blue-300">
                  Available
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-blue-100">
                  {(() => {
                    const total = classes.reduce((sum, c) => {
                      const available =
                        (c.capacity || Infinity) - c.currentEnrollment;
                      return sum + available;
                    }, 0);
                    return total === Infinity ? "∞" : total;
                  })()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="relative">
              <SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
              <input
                type="text"
                placeholder="Search classes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pr-4 pl-10 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="all">All Levels</option>
              <option value="nursery">Nursery</option>
              <option value="primary">Primary</option>
              <option value="jss">JSS</option>
              <option value="sss">SSS</option>
            </select>
          </div>
        </div>

        {/* Classes Grid */}
        {filteredClasses.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
            <BookOpenIcon className="mx-auto mb-4 h-16 w-16 text-gray-400 dark:text-gray-600" />
            <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">
              {searchTerm || levelFilter !== "all"
                ? "No classes found"
                : "No classes yet"}
            </h3>
            <p className="mb-4 text-gray-600 dark:text-blue-300">
              {searchTerm || levelFilter !== "all"
                ? "Try adjusting your filters"
                : "Get started by creating your first class"}
            </p>
            {!searchTerm && levelFilter === "all" && (
              <Button
                onClick={() => setShowCreateModal(true)}
                variant="primary"
              >
                <PlusIcon className="mr-2 h-4 w-4" />
                Create First Class
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredClasses.map((classItem) => (
              <div
                key={classItem.id}
                className="rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-blue-100">
                      {classItem.name}
                      {classItem.section && (
                        <span className="ml-2 text-gray-500 dark:text-gray-400">
                          {classItem.section}
                        </span>
                      )}
                    </h3>
                    <span
                      className={`mt-2 inline-block rounded-full px-2 py-1 text-xs font-medium ${getLevelBadgeColor(classItem.level)}`}
                    >
                      {classItem.level.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingClass(classItem)}
                      className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/30"
                      title="Edit"
                    >
                      <Edit2Icon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(classItem)}
                      className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-900/30"
                      title="Delete"
                      disabled={classItem.currentEnrollment > 0}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-blue-300">
                      Enrollment
                    </span>
                    <span
                      className={`text-sm font-semibold ${classItem.capacity ? getCapacityColor(classItem.currentEnrollment, classItem.capacity) : "text-blue-600 dark:text-blue-400"}`}
                    >
                      {classItem.currentEnrollment} /{" "}
                      {classItem.capacity || "∞"}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        !classItem.capacity
                          ? "bg-blue-500"
                          : (classItem.currentEnrollment / classItem.capacity) *
                                100 >=
                              90
                            ? "bg-red-500"
                            : (classItem.currentEnrollment /
                                  classItem.capacity) *
                                  100 >=
                                75
                              ? "bg-yellow-500"
                              : "bg-green-500"
                      }`}
                      style={{
                        width: !classItem.capacity
                          ? "20%"
                          : `${Math.min((classItem.currentEnrollment / classItem.capacity) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>

                  {classItem.room && (
                    <div className="flex items-center justify-between border-t border-gray-200 pt-2 dark:border-gray-700">
                      <span className="text-sm text-gray-600 dark:text-blue-300">
                        Room
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-blue-100">
                        {classItem.room}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-blue-300">
                      Academic Year
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-blue-100">
                      {classItem.academicYear}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-blue-300">
                      Status
                    </span>
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        classItem.isActive
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
                      }`}
                    >
                      {classItem.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create New Class"
          size="md"
        >
          <ClassForm
            onSuccess={handleCreateSuccess}
            onCancel={() => setShowCreateModal(false)}
          />
        </Modal>
      )}

      {/* Edit Modal */}
      {editingClass && (
        <Modal
          isOpen={!!editingClass}
          onClose={() => setEditingClass(null)}
          title="Edit Class"
          size="md"
        >
          <ClassForm
            classData={editingClass}
            onSuccess={handleEditSuccess}
            onCancel={() => setEditingClass(null)}
          />
        </Modal>
      )}
    </div>
  );
}
