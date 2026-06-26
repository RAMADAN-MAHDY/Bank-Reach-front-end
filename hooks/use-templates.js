'use client';

import { useState, useCallback, useEffect } from 'react';
import { templatesService } from '@/services/templates.service';
import { parsePaginatedResponse } from '@/lib/api';

export function useTemplates(initialParams = {}) {
  const [templates, setTemplates] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [params, setParams] = useState({ page: 1, limit: 20, ...initialParams });

  const fetchTemplates = useCallback(async (fetchParams) => {
    setLoading(true);
    setError(null);
    try {
      const result = await templatesService.getAll(fetchParams);
      const { data, pagination: meta } = parsePaginatedResponse(result);
      setTemplates(data);
      setPagination(meta);
    } catch (err) {
      setError(err.response?.data?.message || 'فشل في جلب القوالب');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates(params);
  }, []);

  const updateParams = useCallback((newParams) => {
    const merged = { ...params, ...newParams };
    setParams(merged);
    fetchTemplates(merged);
  }, [params, fetchTemplates]);

  const createTemplate = useCallback(async (data) => {
    const result = await templatesService.create(data);
    await fetchTemplates(params);
    return result;
  }, [params, fetchTemplates]);

  const updateTemplate = useCallback(async (id, data) => {
    const result = await templatesService.update(id, data);
    await fetchTemplates(params);
    return result;
  }, [params, fetchTemplates]);

  const deleteTemplate = useCallback(async (id) => {
    const result = await templatesService.delete(id);
    await fetchTemplates(params);
    return result;
  }, [params, fetchTemplates]);

  return {
    templates,
    pagination,
    loading,
    error,
    params,
    updateParams,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    refresh: () => fetchTemplates(params),
  };
}
