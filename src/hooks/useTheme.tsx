"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  createContext,
  useContext,
  ReactNode,
} from "react";

/**
 * Available theme modes
 */
export type ThemeMode = "light" | "dark" | "system";

/**
 * Resolved theme (what's actually applied)
 */
export type ResolvedTheme = "light" | "dark";

/**
 * Theme configuration interface
 */
export interface ThemeConfig {
  /** Storage key for persisting theme preference */
  storageKey?: string;
  /** Default theme mode */
  defaultTheme?: ThemeMode;
  /** Whether to disable transitions during theme change */
  disableTransitionOnChange?: boolean;
  /** Custom CSS properties to update */
  customProperties?: Record<ResolvedTheme, Record<string, string>>;
  /** CSS selector for theme application */
  themeSelector?: string;
  /** Callback fired when theme changes */
  onChange?: (theme: ResolvedTheme) => void;
}

/**
 * Theme state interface
 */
export interface ThemeState {
  /** Current theme mode setting */
  theme: ThemeMode;
  /** Resolved theme (light or dark) */
  resolvedTheme: ResolvedTheme;
  /** Whether system prefers dark mode */
  systemPrefersDark: boolean;
  /** Whether theme is being changed */
  isChanging: boolean;
}

/**
 * Theme actions interface
 */
export interface ThemeActions {
  /** Set theme mode */
  setTheme: (theme: ThemeMode) => void;
  /** Toggle between light and dark */
  toggleTheme: () => void;
  /** Reset to system preference */
  resetToSystem: () => void;
}

/**
 * Return type of useTheme hook
 */
export interface UseThemeReturn extends ThemeState, ThemeActions {}

/**
 * Default CSS custom properties for light and dark themes
 */
const DEFAULT_CUSTOM_PROPERTIES: Record<
  ResolvedTheme,
  Record<string, string>
> = {
  light: {
    "--color-background": "#ffffff",
    "--color-foreground": "#0f0f0f",
    "--color-primary": "#0969da",
    "--color-secondary": "#656d76",
    "--color-muted": "#f6f8fa",
    "--color-border": "#d1d9e0",
    "--color-success": "#1a7f37",
    "--color-warning": "#bf8700",
    "--color-error": "#d1242f",
    "--color-info": "#0969da",
  },
  dark: {
    "--color-background": "#0d1117",
    "--color-foreground": "#f0f6fc",
    "--color-primary": "#4493f8",
    "--color-secondary": "#8b949e",
    "--color-muted": "#161b22",
    "--color-border": "#30363d",
    "--color-success": "#3fb950",
    "--color-warning": "#d29922",
    "--color-error": "#f85149",
    "--color-info": "#4493f8",
  },
};

/**
 * Get the initial theme from storage or system preference
 */
function getInitialTheme(
  storageKey: string,
  defaultTheme: ThemeMode,
): ThemeMode {
  if (typeof window === "undefined") return defaultTheme;

  try {
    const stored = localStorage.getItem(storageKey);
    if (stored && ["light", "dark", "system"].includes(stored)) {
      return stored as ThemeMode;
    }
  } catch {
    // localStorage not available or error
  }

  return defaultTheme;
}

/**
 * Get system theme preference
 */
function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/**
 * Resolve the actual theme to apply
 */
function resolveTheme(
  theme: ThemeMode,
  systemPrefersDark: boolean,
): ResolvedTheme {
  if (theme === "system") {
    return systemPrefersDark ? "dark" : "light";
  }
  return theme;
}

/**
 * Apply CSS custom properties to the document
 */
function applyCSSProperties(
  theme: ResolvedTheme,
  customProperties: Record<ResolvedTheme, Record<string, string>>,
  selector: string,
) {
  if (typeof document === "undefined") return;

  const element =
    selector === ":root"
      ? document.documentElement
      : document.querySelector(selector);

  if (!element) return;

  const properties = customProperties[theme];

  Object.entries(properties).forEach(([property, value]) => {
    (element as HTMLElement).style.setProperty(property, value);
  });
}

/**
 * Disable CSS transitions temporarily during theme change
 */
function disableTransitions() {
  if (typeof document === "undefined") return () => {};

  const css = document.createElement("style");
  css.appendChild(
    document.createTextNode(
      "*, *::before, *::after { transition: none !important; animation-duration: 0.01ms !important; }",
    ),
  );
  document.head.appendChild(css);

  return () => {
    // Force reflow
    (() => window.getComputedStyle(css).opacity)();
    document.head.removeChild(css);
  };
}

/**
 * Production-grade theme management hook with comprehensive dark/light mode support,
 * system preference detection, persistence, and CSS custom properties integration.
 *
 * Features:
 * - Light, dark, and system theme modes
 * - System preference detection and auto-switching
 * - LocalStorage persistence
 * - CSS custom properties management
 * - Smooth transitions with optional disable
 * - TypeScript-first design
 * - SSR-safe implementation
 * - Theme change callbacks
 *
 * @param config Theme configuration options
 *
 * @example
 * ```tsx
 * const {
 *   theme,
 *   resolvedTheme,
 *   setTheme,
 *   toggleTheme
 * } = useTheme({
 *   defaultTheme: 'system',
 *   customProperties: {
 *     light: { '--primary-color': '#0066cc' },
 *     dark: { '--primary-color': '#4da6ff' }
 *   }
 * });
 *
 * return (
 *   <button onClick={toggleTheme}>
 *     Current theme: {resolvedTheme}
 *   </button>
 * );
 * ```
 */
export function useTheme(config: ThemeConfig = {}): UseThemeReturn {
  const {
    storageKey = "theme-preference",
    defaultTheme = "system",
    disableTransitionOnChange = true,
    customProperties = DEFAULT_CUSTOM_PROPERTIES,
    themeSelector = ":root",
    onChange,
  } = config;

  // State management
  const [theme, setThemeState] = useState<ThemeMode>(() =>
    getInitialTheme(storageKey, defaultTheme),
  );

  const [systemPrefersDark, setSystemPrefersDark] = useState(
    () => getSystemTheme() === "dark",
  );

  const [isChanging, setIsChanging] = useState(false);

  // Resolve the actual theme
  const resolvedTheme = useMemo(
    () => resolveTheme(theme, systemPrefersDark),
    [theme, systemPrefersDark],
  );

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPrefersDark(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Apply theme changes
  useEffect(() => {
    if (typeof document === "undefined") return;

    // Add theme class to html element
    const html = document.documentElement;
    const previousTheme = html.getAttribute("data-theme");

    if (previousTheme) {
      html.classList.remove(`theme-${previousTheme}`);
    }

    html.setAttribute("data-theme", resolvedTheme);
    html.classList.add(`theme-${resolvedTheme}`);

    // Apply custom CSS properties
    applyCSSProperties(resolvedTheme, customProperties, themeSelector);

    // Call onChange callback
    onChange?.(resolvedTheme);
  }, [resolvedTheme, customProperties, themeSelector, onChange]);

  // Persist theme preference
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      if (theme === defaultTheme) {
        localStorage.removeItem(storageKey);
      } else {
        localStorage.setItem(storageKey, theme);
      }
    } catch {
      // localStorage not available or error
    }
  }, [theme, storageKey, defaultTheme]);

  // Actions
  const setTheme = useCallback(
    (newTheme: ThemeMode) => {
      if (newTheme === theme) return;

      setIsChanging(true);

      let restoreTransitions: (() => void) | undefined;

      if (disableTransitionOnChange) {
        restoreTransitions = disableTransitions();
      }

      setThemeState(newTheme);

      // Restore transitions after a brief delay
      if (restoreTransitions) {
        setTimeout(() => {
          restoreTransitions!();
          setIsChanging(false);
        }, 50);
      } else {
        setIsChanging(false);
      }
    },
    [theme, disableTransitionOnChange],
  );

  const toggleTheme = useCallback(() => {
    if (theme === "system") {
      // If currently system, toggle to opposite of system preference
      setTheme(systemPrefersDark ? "light" : "dark");
    } else if (theme === "light") {
      setTheme("dark");
    } else {
      setTheme("light");
    }
  }, [theme, systemPrefersDark, setTheme]);

  const resetToSystem = useCallback(() => {
    setTheme("system");
  }, [setTheme]);

  // Return memoized result
  return useMemo(
    () => ({
      theme,
      resolvedTheme,
      systemPrefersDark,
      isChanging,
      setTheme,
      toggleTheme,
      resetToSystem,
    }),
    [
      theme,
      resolvedTheme,
      systemPrefersDark,
      isChanging,
      setTheme,
      toggleTheme,
      resetToSystem,
    ],
  );
}

/**
 * Hook for theme-aware component styling
 */
export function useThemeStyles<T extends Record<string, unknown>>(
  styles: Record<ResolvedTheme, T>,
): T {
  const { resolvedTheme } = useTheme();
  return styles[resolvedTheme];
}

/**
 * Hook for conditional theme rendering
 */
export function useThemeValue<T>(lightValue: T, darkValue: T): T {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === "dark" ? darkValue : lightValue;
}

/**
 * Provider component for theme context (if you prefer context pattern)
 */
const ThemeContext = createContext<UseThemeReturn | null>(null);

export interface ThemeProviderProps {
  children: ReactNode;
  config?: ThemeConfig;
}

export function ThemeProvider({ children, config }: ThemeProviderProps) {
  const theme = useTheme(config);

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}

export function useThemeContext(): UseThemeReturn {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeContext must be used within a ThemeProvider");
  }
  return context;
}

/**
 * Higher-order component for theme-aware components
 */
export function withTheme<P extends object>(
  Component: React.ComponentType<P & { theme: UseThemeReturn }>,
): React.ComponentType<P> {
  const WrappedComponent = (props: P) => {
    const theme = useTheme();
    return <Component {...props} theme={theme} />;
  };

  WrappedComponent.displayName = `withTheme(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

/**
 * Utility function to generate theme-aware CSS-in-JS styles
 */
export function createThemeStyles<T extends Record<string, unknown>>(
  lightStyles: T,
  darkStyles: T,
): Record<ResolvedTheme, T> {
  return {
    light: lightStyles,
    dark: darkStyles,
  };
}

/**
 * Hook for accessing CSS custom properties
 */
export function useThemeProperty(property: string): string {
  const { resolvedTheme } = useTheme();

  const [value, setValue] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const computedValue = getComputedStyle(document.documentElement)
      .getPropertyValue(property)
      .trim();

    setValue(computedValue);
  }, [property, resolvedTheme]);

  return value;
}

/**
 * School Management System specific theme presets
 */
export const SCHOOL_THEME_PRESETS: Record<
  ResolvedTheme,
  Record<string, string>
> = {
  light: {
    "--color-background": "#ffffff",
    "--color-foreground": "#1a1a1a",
    "--color-primary": "#3b82f6", // Blue
    "--color-primary-hover": "#2563eb",
    "--color-secondary": "#64748b", // Slate
    "--color-accent": "#10b981", // Emerald
    "--color-muted": "#f8fafc",
    "--color-border": "#e2e8f0",
    "--color-success": "#22c55e", // Green
    "--color-warning": "#f59e0b", // Amber
    "--color-error": "#ef4444", // Red
    "--color-info": "#3b82f6", // Blue

    // School-specific colors
    "--color-student": "#8b5cf6", // Purple
    "--color-teacher": "#06b6d4", // Cyan
    "--color-admin": "#f97316", // Orange
    "--color-parent": "#ec4899", // Pink
    "--color-course": "#10b981", // Emerald
    "--color-grade": "#84cc16", // Lime

    // Surface colors
    "--color-card": "#ffffff",
    "--color-header": "#f8fafc",
    "--color-sidebar": "#ffffff",
    "--color-nav": "#1e293b",

    // Text colors
    "--color-text-primary": "#1a1a1a",
    "--color-text-secondary": "#64748b",
    "--color-text-muted": "#94a3b8",
  },

  dark: {
    "--color-background": "#0f172a",
    "--color-foreground": "#f1f5f9",
    "--color-primary": "#60a5fa", // Blue
    "--color-primary-hover": "#3b82f6",
    "--color-secondary": "#94a3b8", // Slate
    "--color-accent": "#34d399", // Emerald
    "--color-muted": "#1e293b",
    "--color-border": "#334155",
    "--color-success": "#4ade80", // Green
    "--color-warning": "#fbbf24", // Amber
    "--color-error": "#f87171", // Red
    "--color-info": "#60a5fa", // Blue

    // School-specific colors
    "--color-student": "#a78bfa", // Purple
    "--color-teacher": "#22d3ee", // Cyan
    "--color-admin": "#fb923c", // Orange
    "--color-parent": "#f472b6", // Pink
    "--color-course": "#34d399", // Emerald
    "--color-grade": "#a3e635", // Lime

    // Surface colors
    "--color-card": "#1e293b",
    "--color-header": "#0f172a",
    "--color-sidebar": "#1e293b",
    "--color-nav": "#334155",

    // Text colors
    "--color-text-primary": "#f1f5f9",
    "--color-text-secondary": "#cbd5e1",
    "--color-text-muted": "#64748b",
  },
};

/**
 * School management system theme hook with presets
 */
export function useSchoolTheme(config?: Omit<ThemeConfig, "customProperties">) {
  return useTheme({
    ...config,
    customProperties: SCHOOL_THEME_PRESETS,
  });
}
