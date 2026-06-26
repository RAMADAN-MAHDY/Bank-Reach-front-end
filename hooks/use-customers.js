'use client';

import { useState, useCallback, useEffect } from 'react';
import { customersService } from '@/services/customers.service';
import { parsePaginatedResponse } from '@/lib/api';

export function useCustomers(initialParams = {}) {
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [params, setParams] = useState({ page: 1, limit: 20, ...initialParams });

  const fetchCustomers = useCallback(async (fetchParams) => {
    setLoading(true);
    setError(null);
    try {
      const result = await customersService.getAll(fetchParams);
      const { data, pagination: meta } = parsePaginatedResponse(result);
      setCustomers(data);
      setPagination(meta);
    } catch (err) {
      setError(err.response?.data?.message || 'فشل في جلب بيانات العملاء');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers(params);
  }, []);

  const updateParams = useCallback((newParams) => {
    const merged = { ...params, ...newParams };
    setParams(merged);
    fetchCustomers(merged);
  }, [params, fetchCustomers]);

  const createCustomer = useCallback(async (data) => {
    const result = await customersService.create(data);
    await fetchCustomers(params);
    return result;
  }, [params, fetchCustomers]);

  const updateCustomer = useCallback(async (id, data) => {
    const result = await customersService.update(id, data);
    await fetchCustomers(params);
    return result;
  }, [params, fetchCustomers]);

  const deleteCustomer = useCallback(async (id) => {
    const result = await customersService.delete(id);
    await fetchCustomers(params);
    return result;
  }, [params, fetchCustomers]);

  const importExcel = useCallback(async (file) => {
    const result = await customersService.importExcel(file);
    await fetchCustomers(params);
    return result;
  }, [params, fetchCustomers]);

  return {
    customers,
    pagination,
    loading,
    error,
    params,
    updateParams,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    importExcel,
    refresh: () => fetchCustomers(params),
  };
}
