import api from './api.js';

export const warehouseStaffService = {
  getMyImports: async () => {
    const res = await api.get('/staff/imports');
    return res.data;
  },
  
  getImportStats: async () => {
    const res = await api.get('/staff/imports/stats');
    return res.data;
  },
  
  createImport: async (payload) => {
    const res = await api.post('/staff/imports', payload);
    return res.data;
  },
  
  getImportDetail: async (id) => {
    const res = await api.get(`/staff/imports/${id}`);
    return res.data;
  },
  
  getSuppliers: async () => {
    const res = await api.get('/suppliers');
    return res.data;
  },
  
  getVariants: async () => {
    const res = await api.get('/variants');
    return res.data;
  }
};

export default warehouseStaffService;
