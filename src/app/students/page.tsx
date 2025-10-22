"use client";

import { StudentList } from "@/components/students/StudentList";
import { Auth } from "@/components/home/auth";

export default function StudentsPage() {
  return (
    <Auth>
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 dark:bg-gray-950">
        <StudentList />
      </div>
    </Auth>
  );
}
