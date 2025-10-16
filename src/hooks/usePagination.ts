"use client";

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

/**
 * Configuration options for pagination
 */
export interface PaginationConfig {
  /** Initial page number (1-based) */
  initialPage?: number;
  /** Initial page size */
  initialPageSize?: number;
  /** Available page size options */
  pageSizeOptions?: number[];
  /** Maximum number of pages to show in pagination controls */
  siblingCount?: number;
  /** Whether to sync pagination state with URL */
  syncWithUrl?: boolean;
  /** URL parameter name for page */
  pageParam?: string;
  /** URL parameter name for page size */
  pageSizeParam?: string;
  /** Whether pagination is server-side */
  serverSide?: boolean;
  /** Callback fired when pagination changes (for server-side) */
  onPaginationChange?: (page: number, pageSize: number) => void;
}

/**
 * Pagination state interface
 */
export interface PaginationState {
  /** Current page number (1-based) */
  currentPage: number;
  /** Current page size */
  pageSize: number;
  /** Total number of items */
  totalItems: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there's a previous page */
  hasPrevious: boolean;
  /** Whether there's a next page */
  hasNext: boolean;
  /** Start index of current page items (0-based) */
  startIndex: number;
  /** End index of current page items (0-based) */
  endIndex: number;
  /** Current page items (for client-side pagination) */
  items: unknown[];
}

/**
 * Pagination actions interface
 */
export interface PaginationActions {
  /** Go to specific page */
  goToPage: (page: number) => void;
  /** Go to next page */
  goToNext: () => void;
  /** Go to previous page */
  goToPrevious: () => void;
  /** Go to first page */
  goToFirst: () => void;
  /** Go to last page */
  goToLast: () => void;
  /** Change page size */
  changePageSize: (newPageSize: number) => void;
  /** Reset pagination to initial state */
  reset: () => void;
  /** Set total items count (for server-side) */
  setTotalItems: (total: number) => void;
}

/**
 * Return type of usePagination hook
 */
export interface UsePaginationReturn extends PaginationState, PaginationActions {
  /** Page numbers to display in pagination controls */
  pageNumbers: number[];
  /** Whether pagination controls should be shown */
  showPagination: boolean;
}

/**
 * Generate page numbers for pagination controls
 */
function generatePageNumbers(
  currentPage: number,
  totalPages: number,
  siblingCount: number = 1
): number[] {
  if (totalPages <= 1) return [];

  // Calculate the range of pages to show
  const startPage = Math.max(1, currentPage - siblingCount);
  const endPage = Math.min(totalPages, currentPage + siblingCount);

  const pages: number[] = [];

  // Always show first page
  if (startPage > 1) {
    pages.push(1);
    if (startPage > 2) {
      pages.push(-1); // Ellipsis marker
    }
  }

  // Show the calculated range
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  // Always show last page
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      pages.push(-1); // Ellipsis marker
    }
    pages.push(totalPages);
  }

  return pages;
}

/**
 * Production-grade pagination hook with comprehensive features for managing
 * paginated data in both client-side and server-side scenarios.
 * 
 * Features:
 * - Client-side and server-side pagination support
 * - URL synchronization with Next.js router
 * - Configurable page size options
 * - Smart pagination controls with ellipsis
 * - TypeScript-first design
 * - Performance optimizations
 * - Accessibility support
 * 
 * @template T The type of items being paginated
 * @param allItems All items for client-side pagination (optional for server-side)
 * @param totalItems Total items count for server-side pagination
 * @param config Pagination configuration options
 * 
 * @example
 * ```tsx
 * // Client-side pagination
 * const { 
 *   items, 
 *   currentPage, 
 *   totalPages, 
 *   goToNext, 
 *   goToPrevious,
 *   pageNumbers 
 * } = usePagination(students, 0, {
 *   initialPageSize: 10,
 *   syncWithUrl: true
 * });
 * 
 * // Server-side pagination
 * const pagination = usePagination([], studentsTotal, {
 *   serverSide: true,
 *   onPaginationChange: (page, size) => {
 *     fetchStudents({ page, size });
 *   }
 * });
 * ```
 */
export function usePagination<T = unknown>(
  allItems: T[] = [],
  totalItems: number = 0,
  config: PaginationConfig = {}
): UsePaginationReturn {
  const {
    initialPage = 1,
    initialPageSize = 10,
    pageSizeOptions = [10, 20, 50, 100],
    siblingCount = 1,
    syncWithUrl = false,
    pageParam = 'page',
    pageSizeParam = 'pageSize',
    serverSide = false,
    onPaginationChange,
  } = config;

  // Next.js routing hooks (always call hooks but use conditionally)
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  // Use routing hooks only if syncWithUrl is enabled
  const activeRouter = syncWithUrl ? router : null;
  const activeSearchParams = syncWithUrl ? searchParams : null;
  const activePathname = syncWithUrl ? pathname : null;

  // Get initial values from URL if syncing
  const getInitialPage = useCallback(() => {
    if (syncWithUrl && activeSearchParams) {
      const urlPage = activeSearchParams.get(pageParam);
      return urlPage ? Math.max(1, parseInt(urlPage, 10)) : initialPage;
    }
    return initialPage;
  }, [syncWithUrl, activeSearchParams, pageParam, initialPage]);

  const getInitialPageSize = useCallback(() => {
    if (syncWithUrl && activeSearchParams) {
      const urlPageSize = activeSearchParams.get(pageSizeParam);
      if (urlPageSize) {
        const size = parseInt(urlPageSize, 10);
        return pageSizeOptions.includes(size) ? size : initialPageSize;
      }
    }
    return initialPageSize;
  }, [syncWithUrl, activeSearchParams, pageSizeParam, initialPageSize, pageSizeOptions]);

  // State management
  const [currentPage, setCurrentPage] = useState(() => getInitialPage());
  const [pageSize, setPageSize] = useState(() => getInitialPageSize());
  const [serverTotalItems, setServerTotalItems] = useState(totalItems);

  // Calculate derived values
  const actualTotalItems = serverSide ? serverTotalItems : allItems.length;
  const totalPages = Math.max(1, Math.ceil(actualTotalItems / pageSize));
  const startIndex = Math.max(0, (currentPage - 1) * pageSize);
  const endIndex = Math.min(actualTotalItems - 1, startIndex + pageSize - 1);

  // Get current page items (for client-side pagination)
  const items = useMemo(() => {
    if (serverSide) return allItems;
    return allItems.slice(startIndex, startIndex + pageSize);
  }, [allItems, startIndex, pageSize, serverSide]);

  // Generate page numbers for pagination controls
  const pageNumbers = useMemo(
    () => generatePageNumbers(currentPage, totalPages, siblingCount),
    [currentPage, totalPages, siblingCount]
  );

  // Update URL when pagination changes
  const updateUrl = useCallback(
    (newPage: number, newPageSize: number) => {
      if (!syncWithUrl || !activeRouter || !activePathname) return;

      const params = new URLSearchParams(activeSearchParams?.toString());
      
      if (newPage === 1) {
        params.delete(pageParam);
      } else {
        params.set(pageParam, newPage.toString());
      }

      if (newPageSize === initialPageSize) {
        params.delete(pageSizeParam);
      } else {
        params.set(pageSizeParam, newPageSize.toString());
      }

      const queryString = params.toString();
      const newUrl = queryString ? `${activePathname}?${queryString}` : activePathname;
      
      activeRouter.push(newUrl, { scroll: false });
    },
    [
      syncWithUrl,
      activeRouter,
      activePathname,
      activeSearchParams,
      pageParam,
      pageSizeParam,
      initialPageSize,
    ]
  );

  // Sync with URL changes
  useEffect(() => {
    if (!syncWithUrl) return;

    const urlPage = getInitialPage();
    const urlPageSize = getInitialPageSize();

    if (urlPage !== currentPage) {
      setCurrentPage(urlPage);
    }

    if (urlPageSize !== pageSize) {
      setPageSize(urlPageSize);
    }
  }, [syncWithUrl, getInitialPage, getInitialPageSize, currentPage, pageSize]);

  // Notify server-side changes
  useEffect(() => {
    if (serverSide && onPaginationChange) {
      onPaginationChange(currentPage, pageSize);
    }
  }, [serverSide, currentPage, pageSize, onPaginationChange]);

  // Actions
  const goToPage = useCallback(
    (page: number) => {
      const validPage = Math.max(1, Math.min(totalPages, page));
      if (validPage === currentPage) return;

      setCurrentPage(validPage);
      updateUrl(validPage, pageSize);
    },
    [currentPage, totalPages, pageSize, updateUrl]
  );

  const goToNext = useCallback(() => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  }, [currentPage, totalPages, goToPage]);

  const goToPrevious = useCallback(() => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  }, [currentPage, goToPage]);

  const goToFirst = useCallback(() => {
    goToPage(1);
  }, [goToPage]);

  const goToLast = useCallback(() => {
    goToPage(totalPages);
  }, [goToPage, totalPages]);

  const changePageSize = useCallback(
    (newPageSize: number) => {
      if (!pageSizeOptions.includes(newPageSize)) return;

      // Calculate new page to maintain current position as much as possible
      const currentFirstItem = (currentPage - 1) * pageSize + 1;
      const newPage = Math.max(1, Math.ceil(currentFirstItem / newPageSize));

      setPageSize(newPageSize);
      setCurrentPage(newPage);
      updateUrl(newPage, newPageSize);
    },
    [currentPage, pageSize, pageSizeOptions, updateUrl]
  );

  const reset = useCallback(() => {
    setCurrentPage(initialPage);
    setPageSize(initialPageSize);
    updateUrl(initialPage, initialPageSize);
  }, [initialPage, initialPageSize, updateUrl]);

  const setTotalItems = useCallback((total: number) => {
    setServerTotalItems(total);
    
    // Adjust current page if it's beyond the new total pages
    const newTotalPages = Math.max(1, Math.ceil(total / pageSize));
    if (currentPage > newTotalPages) {
      goToPage(newTotalPages);
    }
  }, [pageSize, currentPage, goToPage]);

  // Return memoized result
  return useMemo(
    () => ({
      // State
      currentPage,
      pageSize,
      totalItems: actualTotalItems,
      totalPages,
      hasPrevious: currentPage > 1,
      hasNext: currentPage < totalPages,
      startIndex,
      endIndex,
      items: items as T[],

      // Derived values
      pageNumbers,
      showPagination: totalPages > 1,

      // Actions
      goToPage,
      goToNext,
      goToPrevious,
      goToFirst,
      goToLast,
      changePageSize,
      reset,
      setTotalItems,
    }),
    [
      currentPage,
      pageSize,
      actualTotalItems,
      totalPages,
      startIndex,
      endIndex,
      items,
      pageNumbers,
      goToPage,
      goToNext,
      goToPrevious,
      goToFirst,
      goToLast,
      changePageSize,
      reset,
      setTotalItems,
    ]
  );
}

/**
 * Hook for infinite scroll pagination
 */
export function useInfinitePagination<T>(
  fetchMore: (page: number, pageSize: number) => Promise<{
    items: T[];
    hasMore: boolean;
    total?: number;
  }>,
  config: {
    initialPageSize?: number;
  } = {}
) {
  const { initialPageSize = 20 } = config;
  
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<Error | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    try {
      setLoading(true);
      setError(null);
      
      const result = await fetchMore(page, initialPageSize);
      
      setItems(prev => [...prev, ...result.items]);
      setHasMore(result.hasMore);
      setPage(prev => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load more'));
    } finally {
      setLoading(false);
    }
  }, [fetchMore, page, initialPageSize, loading, hasMore]);

  const reset = useCallback(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    setError(null);
  }, []);

  // Auto-load first page
  useEffect(() => {
    if (items.length === 0 && !loading) {
      loadMore();
    }
  }, [items.length, loading, loadMore]);

  return {
    items,
    loading,
    hasMore,
    error,
    loadMore,
    reset,
  };
}