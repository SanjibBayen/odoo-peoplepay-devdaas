import { useState, useEffect, useCallback } from 'react';
import payrunApi from '../services/payrunApi.js';
import { extractErrorMessage } from '../services/apiClient.js';

/**
 * Custom hook for managing payroll runs and batch execution lifecycles.
 *
 * @param {string} [payrunId] - Optional payrun ID to fetch details for
 */
export function usePayrun(payrunId) {
  const [payruns, setPayruns] = useState([]);
  const [currentPayrun, setCurrentPayrun] = useState(null);
  const [eligibleEmployees, setEligibleEmployees] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPayruns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (payrunId) {
        const [detailRes, warnRes, eligRes] = await Promise.allSettled([
          payrunApi.getPayrunById(payrunId),
          payrunApi.getPayrunWarnings(payrunId),
          payrunApi.getEligibleEmployees(payrunId),
        ]);

        if (detailRes.status === 'fulfilled') {
          setCurrentPayrun(detailRes.value.data || detailRes.value);
        } else {
          setError(extractErrorMessage(detailRes.reason, 'Failed to load payrun details.'));
        }

        if (warnRes.status === 'fulfilled') {
          setWarnings(warnRes.value.data || (Array.isArray(warnRes.value) ? warnRes.value : []));
        }

        if (eligRes.status === 'fulfilled') {
          setEligibleEmployees(eligRes.value.data || (Array.isArray(eligRes.value) ? eligRes.value : []));
        }
      } else {
        const res = await payrunApi.getPayruns();
        const list = res.data || (Array.isArray(res) ? res : []);
        setPayruns(list);
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to fetch payroll runs.'));
    } finally {
      setLoading(false);
    }
  }, [payrunId]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (payrunId) {
          const [detailRes, warnRes, eligRes] = await Promise.allSettled([
            payrunApi.getPayrunById(payrunId),
            payrunApi.getPayrunWarnings(payrunId),
            payrunApi.getEligibleEmployees(payrunId),
          ]);

          if (!active) return;

          if (detailRes.status === 'fulfilled') {
            setCurrentPayrun(detailRes.value.data || detailRes.value);
          } else {
            setError(extractErrorMessage(detailRes.reason, 'Failed to load payrun details.'));
          }

          if (warnRes.status === 'fulfilled') {
            setWarnings(warnRes.value.data || (Array.isArray(warnRes.value) ? warnRes.value : []));
          }

          if (eligRes.status === 'fulfilled') {
            setEligibleEmployees(eligRes.value.data || (Array.isArray(eligRes.value) ? eligRes.value : []));
          }
        } else {
          const res = await payrunApi.getPayruns();
          if (!active) return;
          const list = res.data || (Array.isArray(res) ? res : []);
          setPayruns(list);
        }
      } catch (err) {
        if (active) setError(extractErrorMessage(err, 'Failed to fetch payroll runs.'));
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [payrunId]);

  const createPayrun = async (data) => {
    const res = await payrunApi.createPayrun(data);
    await fetchPayruns();
    return res;
  };

  const computePayrun = async (id = payrunId) => {
    const res = await payrunApi.computePayrun(id);
    await fetchPayruns();
    return res;
  };

  const validatePayrun = async (id = payrunId) => {
    const res = await payrunApi.validatePayrun(id);
    await fetchPayruns();
    return res;
  };

  const markPaid = async (id = payrunId, data = {}) => {
    const res = await payrunApi.markPayrunPaid(id, data);
    await fetchPayruns();
    return res;
  };

  const sendPayslips = async (id = payrunId) => {
    const res = await payrunApi.sendPayslips(id);
    await fetchPayruns();
    return res;
  };

  return {
    payruns,
    currentPayrun,
    eligibleEmployees,
    warnings,
    loading,
    error,
    refetch: fetchPayruns,
    createPayrun,
    computePayrun,
    validatePayrun,
    markPaid,
    sendPayslips,
  };
}

export default usePayrun;
