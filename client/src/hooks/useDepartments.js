import { useState, useEffect, useCallback } from 'react';
import departmentApi from '../services/departmentApi.js';
import { extractErrorMessage } from '../services/apiClient.js';

/**
 * Custom hook for department management and organizational hierarchy.
 */
export function useDepartments() {
  const [departments, setDepartments] = useState([]);
  const [hierarchy, setHierarchy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [deptRes, hierRes] = await Promise.allSettled([
        departmentApi.getDepartments(),
        departmentApi.getDepartmentHierarchy(),
      ]);

      if (deptRes.status === 'fulfilled') {
        const list = deptRes.value.data || (Array.isArray(deptRes.value) ? deptRes.value : []);
        setDepartments(list);
      } else {
        setError(extractErrorMessage(deptRes.reason, 'Failed to fetch departments.'));
      }

      if (hierRes.status === 'fulfilled') {
        setHierarchy(hierRes.value.data || hierRes.value);
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load organizational departments.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [deptRes, hierRes] = await Promise.allSettled([
          departmentApi.getDepartments(),
          departmentApi.getDepartmentHierarchy(),
        ]);

        if (!active) return;

        if (deptRes.status === 'fulfilled') {
          const list = deptRes.value.data || (Array.isArray(deptRes.value) ? deptRes.value : []);
          setDepartments(list);
        } else {
          setError(extractErrorMessage(deptRes.reason, 'Failed to fetch departments.'));
        }

        if (hierRes.status === 'fulfilled') {
          setHierarchy(hierRes.value.data || hierRes.value);
        }
      } catch (err) {
        if (active) setError(extractErrorMessage(err, 'Failed to load organizational departments.'));
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const createDepartment = async (deptData) => {
    const res = await departmentApi.createDepartment(deptData);
    await fetchDepartments();
    return res;
  };

  const updateDepartment = async (id, deptData) => {
    const res = await departmentApi.updateDepartment(id, deptData);
    await fetchDepartments();
    return res;
  };

  const deleteDepartment = async (id) => {
    const res = await departmentApi.deleteDepartment(id);
    await fetchDepartments();
    return res;
  };

  return {
    departments,
    hierarchy,
    loading,
    error,
    refetch: fetchDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
  };
}

export default useDepartments;
