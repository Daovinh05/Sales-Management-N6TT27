import api from './api.js';

export const warehouseService = {
  getCentralWarehouse: async () => {
    const res = await api.get('/admin/warehouses');
    return res.data?.data || res.data;
  },

  updateCentralWarehouse: async (data) => {
    const res = await api.put('/admin/warehouses', data);
    return res.data?.data || res.data;
  },
  
  getInventory: async () => {
    const res = await api.get('/admin/warehouses/inventory');
    return res.data?.data || res.data;
  }
};

export default warehouseService;
