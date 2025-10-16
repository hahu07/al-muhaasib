"use client";

import { Auth } from "@/components/home/auth";
import { DashboardRouter } from "@/components/DashboardRouter";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default function Home() {
  return (
    <>
      <ThemeToggle />
      <Auth>
        <DashboardRouter />
      </Auth>
    </>
  );
}
