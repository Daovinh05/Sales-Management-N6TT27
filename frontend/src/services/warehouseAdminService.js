import api from './api.js';

export const warehouseAdminService = {
  getWarehouseConfig: async (id = 1) => {
    const res = await api.get(`/admin/warehouses/${id}`);
    return res.data;
  },
  
  getWarehouseStaffs: async (page = 0, size = 10, name = '', email = '') => {
    const res = await api.get(`/admin/warehouses/staff?page=${page}&size=${size}&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}`);
    return res.data;
  },

  getImportHistory: async (page = 0, size = 10, createdBy = '', supplierName = '', status = '', productKeyword = '') => {
    const res = await api.get(`/admin/imports?page=${page}&size=${size}&createdBy=${encodeURIComponent(createdBy)}&supplierName=${encodeURIComponent(supplierName)}&status=${encodeURIComponent(status)}&productKeyword=${encodeURIComponent(productKeyword)}`);
    return res.data;
  },

  getImportDetail: async (id) => {
    const res = await api.get(`/admin/imports/${id}`);
    return res.data;
  },

  updateImportStatus: async (id, status) => {
    const res = await api.put(`/admin/imports/${id}/status`, { status });
    return res.data;
  },

  updateWarehouse: async (id, payload) => {
    const res = await api.put(`/admin/warehouses/${id}`, payload);
    return res.data;
  },

  getInventory: async (page = 0, size = 10, keyword = '') => {
    const res = await api.get(`/variants/paginated?page=${page}&size=${size}&keyword=${encodeURIComponent(keyword)}`);
    return res.data;
  }
};

export default warehouseAdminService;
