import { useState, useEffect, useCallback } from 'react';
import timeOffApi from '../services/timeOffApi.js';
import { extractErrorMessage } from '../services/apiClient.js';

/**
 * Custom hook for managing time off requests, leave allocations, and leave types.
 *
 * @param {Object} [params={}]
 */
export function useTimeOff(params = {}) {
  const [requests, setRequests] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTimeOffData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [reqRes, allocRes, typesRes] = await Promise.allSettled([
        timeOffApi.getRequests(params),
        timeOffApi.getAllocations(),
        timeOffApi.getTimeOffTypes(),
      ]);

      if (reqRes.status === 'fulfilled') {
        const list = reqRes.value.data || (Array.isArray(reqRes.value) ? reqRes.value : []);
        setRequests(list);
      }
      if (allocRes.status === 'fulfilled') {
        const list = allocRes.value.data || (Array.isArray(allocRes.value) ? allocRes.value : []);
        setAllocations(list);
      }
      if (typesRes.status === 'fulfilled') {
        const list = typesRes.value.data || (Array.isArray(typesRes.value) ? typesRes.value : []);
        setLeaveTypes(list);
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load time off records.'));
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [reqRes, allocRes, typesRes] = await Promise.allSettled([
          timeOffApi.getRequests(params),
          timeOffApi.getAllocations(),
          timeOffApi.getTimeOffTypes(),
        ]);

        if (!active) return;

        if (reqRes.status === 'fulfilled') {
          const list = reqRes.value.data || (Array.isArray(reqRes.value) ? reqRes.value : []);
          setRequests(list);
        }
        if (allocRes.status === 'fulfilled') {
          const list = allocRes.value.data || (Array.isArray(allocRes.value) ? allocRes.value : []);
          setAllocations(list);
        }
        if (typesRes.status === 'fulfilled') {
          const list = typesRes.value.data || (Array.isArray(typesRes.value) ? typesRes.value : []);
          setLeaveTypes(list);
        }
      } catch (err) {
        if (active) setError(extractErrorMessage(err, 'Failed to load time off records.'));
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [params]);

  const createRequest = async (data) => {
    const res = await timeOffApi.createRequest(data);
    await fetchTimeOffData();
    return res;
  };

  const approveRequest = async (id) => {
    const res = await timeOffApi.approveRequest(id);
    await fetchTimeOffData();
    return res;
  };

  const refuseRequest = async (id, options = {}) => {
    const res = await timeOffApi.refuseRequest(id, options);
    await fetchTimeOffData();
    return res;
  };

  const cancelRequest = async (id) => {
    const res = await timeOffApi.cancelRequest(id);
    await fetchTimeOffData();
    return res;
  };

  const createAllocation = async (data) => {
    const res = await timeOffApi.createAllocation(data);
    await fetchTimeOffData();
    return res;
  };

  const approveAllocation = async (id) => {
    const res = await timeOffApi.approveAllocation(id);
    await fetchTimeOffData();
    return res;
  };

  return {
    requests,
    allocations,
    leaveTypes,
    loading,
    error,
    refetch: fetchTimeOffData,
    createRequest,
    approveRequest,
    refuseRequest,
    cancelRequest,
    createAllocation,
    approveAllocation,
  };
}

export default useTimeOff;
