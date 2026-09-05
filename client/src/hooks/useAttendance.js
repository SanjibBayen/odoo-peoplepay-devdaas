import { useState, useEffect, useCallback } from 'react';
import attendanceApi from '../services/attendanceApi.js';
import { extractErrorMessage } from '../services/apiClient.js';

/**
 * Custom hook for workforce attendance management and daily punch operations.
 *
 * @param {Object} [initialParams={}]
 */
export function useAttendance(initialParams = {}) {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [attRes, sumRes] = await Promise.allSettled([
        attendanceApi.getAttendance(initialParams),
        attendanceApi.getAttendanceSummary(),
      ]);

      if (attRes.status === 'fulfilled') {
        const list = attRes.value.data || (Array.isArray(attRes.value) ? attRes.value : []);
        setRecords(list);
      } else {
        setError(extractErrorMessage(attRes.reason, 'Failed to fetch attendance logs.'));
      }

      if (sumRes.status === 'fulfilled') {
        setSummary(sumRes.value.data || sumRes.value);
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load attendance records.'));
    } finally {
      setLoading(false);
    }
  }, [initialParams]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [attRes, sumRes] = await Promise.allSettled([
          attendanceApi.getAttendance(initialParams),
          attendanceApi.getAttendanceSummary(),
        ]);

        if (!active) return;

        if (attRes.status === 'fulfilled') {
          const list = attRes.value.data || (Array.isArray(attRes.value) ? attRes.value : []);
          setRecords(list);
        } else {
          setError(extractErrorMessage(attRes.reason, 'Failed to fetch attendance logs.'));
        }

        if (sumRes.status === 'fulfilled') {
          setSummary(sumRes.value.data || sumRes.value);
        }
      } catch (err) {
        if (active) setError(extractErrorMessage(err, 'Failed to load attendance records.'));
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [initialParams]);

  const checkIn = async (data = {}) => {
    const res = await attendanceApi.checkIn(data);
    await fetchAttendance();
    return res;
  };

  const checkOut = async (data = {}) => {
    const res = await attendanceApi.checkOut(data);
    await fetchAttendance();
    return res;
  };

  const correctAttendance = async (id, data) => {
    const res = await attendanceApi.correctAttendance(id, data);
    await fetchAttendance();
    return res;
  };

  return {
    records,
    summary,
    loading,
    error,
    refetch: fetchAttendance,
    checkIn,
    checkOut,
    correctAttendance,
  };
}

export default useAttendance;
