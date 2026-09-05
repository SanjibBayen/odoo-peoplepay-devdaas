import { useState, useEffect, useCallback } from 'react';
import employeeApi from '../services/employeeApi.js';
import { extractErrorMessage } from '../services/apiClient.js';

/**
 * Custom hook for fetching and filtering employees.
 *
 * @param {Object} [initialFilters={}]
 */
export function useEmployees(initialFilters = {}) {
  const [employees, setEmployees] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(initialFilters.page || 1);
  const [limit, setLimit] = useState(initialFilters.limit || 10);
  const [search, setSearch] = useState(initialFilters.search || '');
  const [status, setStatus] = useState(initialFilters.status || 'ALL');
  const [departmentId, setDepartmentId] = useState(initialFilters.departmentId || '');

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit,
        search: search.trim() || undefined,
        status: status !== 'ALL' ? status : undefined,
        departmentId: departmentId || undefined,
      };

      const res = await employeeApi.getEmployees(params);
      const list = res.data || res.employees || (Array.isArray(res) ? res : []);
      const count = res.total || res.count || list.length;

      setEmployees(list);
      setTotal(count);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to fetch workforce employees.'));
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, status, departmentId]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const params = {
          page,
          limit,
          search: search.trim() || undefined,
          status: status !== 'ALL' ? status : undefined,
          departmentId: departmentId || undefined,
        };

        const res = await employeeApi.getEmployees(params);
        if (!active) return;
        const list = res.data || res.employees || (Array.isArray(res) ? res : []);
        const count = res.total || res.count || list.length;

        setEmployees(list);
        setTotal(count);
      } catch (err) {
        if (active) setError(extractErrorMessage(err, 'Failed to fetch workforce employees.'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [page, limit, search, status, departmentId]);

  return {
    employees,
    total,
    page,
    limit,
    search,
    status,
    departmentId,
    loading,
    error,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    setPage,
    setLimit,
    setSearch,
    setStatus,
    setDepartmentId,
    refetch: fetchEmployees,
  };
}

export default useEmployees;
