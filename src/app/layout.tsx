"use client";

import "./globals.css";
import { useEffect } from "react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { JunoProvider } from "@/components/JunoProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    // Set page metadata for client-side rendering
    document.title = "Al-Muhaasib | School Management Accounting System";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Comprehensive school financial management and accounting system built on Juno platform');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Comprehensive school financial management and accounting system built on Juno platform';
      document.head.appendChild(meta);
    }
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof document !== 'undefined') {
                  try {
                    // Use requestAnimationFrame to avoid conflicts with browser extensions
                    var applyTheme = function() {
                      var theme = localStorage.getItem('al-muhaasib-theme') || 'dark';
                      var html = document.documentElement;
                      if (html) {
                        // Remove existing theme classes
                        html.classList.remove('light', 'dark');
                        // Add the correct theme class
                        html.classList.add(theme);
                        html.style.colorScheme = theme;
                      }
                    };
                    
                    if (document.readyState === 'loading') {
                      document.addEventListener('DOMContentLoaded', applyTheme);
                    } else {
                      applyTheme();
                    }
                  } catch (e) {}
                }
              })();
            `,
          }}
        />
      </head>
      <body className="font-mono antialiased transition-colors duration-300" suppressHydrationWarning>
        <JunoProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </JunoProvider>
      </body>
    </html>
  );
}
