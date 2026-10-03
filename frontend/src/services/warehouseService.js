import api from './api.js';

export const warehouseService = {
  getAll: async () => {
    const res = await api.get('/admin/warehouses');
    return res.data?.data || res.data;
  },

  getById: async (id) => {
    const res = await api.get(`/admin/warehouses/${id}`);
    return res.data?.data || res.data;
  },

  create: async (data) => {
    const res = await api.post('/admin/warehouses', data);
    return res.data?.data || res.data;
  },

  update: async (id, data) => {
    const res = await api.put(`/admin/warehouses/${id}`, data);
    return res.data?.data || res.data;
  },

  delete: async (id) => {
    const res = await api.delete(`/admin/warehouses/${id}`);
    return res.data?.data || res.data;
  }
};

export default warehouseService;
