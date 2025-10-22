"use client";

import { useEffect } from "react";
import { ThemeProvider } from "@/contexts/ThemeContext";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Apply initial dark theme class to prevent flash
    document.documentElement.classList.add("dark");
    document.body.classList.add("dark");
  }, []);

  return <ThemeProvider>{children}</ThemeProvider>;
}
