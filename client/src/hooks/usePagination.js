import { useState, useMemo, useCallback } from 'react';

/**
 * Custom hook for managing client-side and server-side pagination state.
 *
 * @param {Object} [options={}]
 * @param {number} [options.initialPage=1]
 * @param {number} [options.initialPageSize=10]
 * @param {number} [options.totalCount=0]
 */
export function usePagination({
  initialPage = 1,
  initialPageSize = 10,
  totalCount = 0,
} = {}) {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [totalItems, setTotalItems] = useState(totalCount);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalItems / pageSize));
  }, [totalItems, pageSize]);

  const canPrev = page > 1;
  const canNext = page < totalPages;

  const nextPage = useCallback(() => {
    setPage((prev) => (prev < totalPages ? prev + 1 : prev));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setPage((prev) => (prev > 1 ? prev - 1 : prev));
  }, []);

  const goToPage = useCallback(
    (targetPage) => {
      const p = Math.max(1, Math.min(Number(targetPage) || 1, totalPages));
      setPage(p);
    },
    [totalPages]
  );

  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  return {
    page,
    pageSize,
    totalItems,
    totalPages,
    canPrev,
    canNext,
    startIndex,
    endIndex,
    setPage,
    setPageSize,
    setTotalItems,
    nextPage,
    prevPage,
    goToPage,
  };
}

export default usePagination;
