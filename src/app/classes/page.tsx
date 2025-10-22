"use client";

import React from "react";
import { ClassManagement } from "@/components/classes/ClassManagement";
import { Auth } from "@/components/home/auth";

export default function ClassesPage() {
  return (
    <Auth>
      <ClassManagement />
    </Auth>
  );
}
