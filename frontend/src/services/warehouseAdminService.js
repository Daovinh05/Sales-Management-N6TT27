import api from './api.js';

export const warehouseAdminService = {
  getWarehouseConfig: async (id = 1) => {
    const res = await api.get(`/admin/warehouses/${id}`);
    return res.data;
  },
  
  getWarehouseStaffs: async () => {
    const res = await api.get('/admin/warehouses/staff');
    return res.data;
  },

  getImportHistory: async (page = 0, size = 10) => {
    const res = await api.get(`/admin/imports?page=${page}&size=${size}`);
    return res.data;
  },

  getImportDetail: async (id) => {
    const res = await api.get(`/admin/imports/${id}`);
    return res.data;
  }
};

export default warehouseAdminService;
