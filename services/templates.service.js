import api from '@/lib/api';

export const templatesService = {
  async getAll(params = {}) {
    const response = await api.get('/templates', { params });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/templates/${id}`);
    return response.data;
  },

  async create(data) {
    const response = await api.post('/templates', data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.patch(`/templates/${id}`, data);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/templates/${id}`);
    return response.data;
  },
};
