import React, { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlusCircle, faTrash, faCheck } from '@fortawesome/free-solid-svg-icons';
import warehouseStaffService from '../../services/warehouseStaffService.js';

const formatCurrency = (amount) => {
  if (amount == null) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency', currency: 'VND'
  }).format(amount);
};

export default function ImportCreate({ notify, onSuccess }) {
  const [suppliers, setSuppliers] = useState([]);
  const [variants, setVariants] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  
  const [supplierCode, setSupplierCode] = useState('');
  const [note, setNote] = useState('');
  const [items, setItems] = useState([{ id: Date.now(), variantCode: '', quantity: 1, unitPrice: 0 }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadDependencies();
  }, []);

  const loadDependencies = async () => {
    try {
      const [sups, vars] = await Promise.all([
        warehouseStaffService.getSuppliers(),
        warehouseStaffService.getVariants()
      ]);
      setSuppliers(Array.isArray(sups) ? sups : []);
      setVariants(Array.isArray(vars) ? vars : []);
    } catch (err) {
      notify?.('error', 'Không thể tải danh sách nhà cung cấp hoặc sản phẩm.');
    } finally {
      setLoadingData(false);
    }
  };

  const addItem = () => {
    setItems([...items, { id: Date.now(), variantCode: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id, field, value) => {
    setItems(items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleVariantChange = (id, code) => {
    const variant = variants.find(v => v.code === code);
    // Có thể mặc định giá nhập bằng một phần giá bán hoặc để 0 cho nhân viên tự nhập
    const defaultPrice = variant?.price ? Math.round(variant.price * 0.7) : 0; 
    setItems(items.map(item => {
      if (item.id === id) {
        return { ...item, variantCode: code, unitPrice: defaultPrice };
      }
      return item;
    }));
  };

  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0);
  }, [items]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!supplierCode) {
      notify?.('error', 'Vui lòng chọn nhà cung cấp.');
      return;
    }
    
    const validItems = items.filter(i => i.variantCode && i.quantity > 0 && i.unitPrice >= 0);
    if (validItems.length === 0) {
      notify?.('error', 'Vui lòng thêm ít nhất một sản phẩm hợp lệ.');
      return;
    }

    for (const item of validItems) {
      const variant = variants.find(v => v.code === item.variantCode);
      if (variant && variant.price && Number(item.unitPrice) >= variant.price) {
        notify?.('error', `Giá nhập của sản phẩm ${variant.name || variant.code} (${formatCurrency(item.unitPrice)}) không được lớn hơn hoặc bằng giá bán hiện tại (${formatCurrency(variant.price)})`);
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        supplierCode,
        note,
        details: validItems.map(i => ({
          variantCode: i.variantCode,
          quantity: Number(i.quantity),
          importPrice: Number(i.unitPrice)
        }))
      };
      
      await warehouseStaffService.createImport(payload);
      notify?.('success', 'Tạo phiếu nhập kho thành công!');
      onSuccess?.();
    } catch (err) {
      notify?.('error', err.response?.data?.message || 'Không thể tạo phiếu nhập. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ad-brand-page">
      <form onSubmit={handleSubmit}>
        <section className="ad-brand-panel">
          <h2>Thông tin chung</h2>
          <div className="ad-brand-dialog" style={{ boxShadow: 'none', padding: '0', maxWidth: '100%', marginBottom: '20px' }}>
            <label>Nhà cung cấp
              <select required value={supplierCode} onChange={(e) => setSupplierCode(e.target.value)} disabled={loadingData}>
                <option value="">-- Chọn nhà cung cấp --</option>
                {suppliers.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
              </select>
            </label>
            <label>Ghi chú
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Nhập ghi chú cho phiếu nhập này (tùy chọn)..." />
            </label>
          </div>
        </section>

        <section className="ad-brand-panel ad-brand-list">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2>Chi tiết sản phẩm nhập</h2>
            <button type="button" className="ad-button ad-button-primary" onClick={addItem}>
              <FontAwesomeIcon icon={faPlusCircle} /> Thêm sản phẩm
            </button>
          </div>
          
          <div className="ad-table-wrap">
            <table className="ad-brand-table">
              <thead>
                <tr>
                  <th>SẢN PHẨM (BIẾN THỂ)</th>
                  <th style={{ width: '15%' }}>SỐ LƯỢNG</th>
                  <th style={{ width: '20%' }}>ĐƠN GIÁ (VNĐ)</th>
                  <th style={{ width: '20%' }}>THÀNH TIỀN</th>
                  <th style={{ width: '10%', textAlign: 'center' }}>XÓA</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id}>
                    <td>
                      <select required value={item.variantCode} onChange={(e) => handleVariantChange(item.id, e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}>
                        <option value="">-- Chọn sản phẩm --</option>
                        {variants.map(v => (
                          <option key={v.code} value={v.code}>{v.productName || v.productCode} - {v.name || v.code} (Giá bán: {formatCurrency(v.price)})</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input type="number" min="1" required value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
                    </td>
                    <td>
                      <input type="number" min="0" required value={item.unitPrice} onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
                    </td>
                    <td style={{ fontWeight: 'bold' }}>
                      {formatCurrency(Number(item.quantity) * Number(item.unitPrice))}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button type="button" className="ad-button ad-button-delete" onClick={() => removeItem(item.id)} disabled={items.length === 1} style={{ padding: '6px 12px' }}>
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }}>
            <div style={{ marginRight: '30px', fontSize: '1.2em' }}>
              Tổng tiền tạm tính: <span style={{ color: '#d32f2f', fontWeight: 'bold', fontSize: '1.5em', marginLeft: '10px' }}>{formatCurrency(totalAmount)}</span>
            </div>
            <button type="submit" className="ad-button ad-button-primary" disabled={saving || loadingData} style={{ fontSize: '1.1em', padding: '12px 24px' }}>
              <FontAwesomeIcon icon={faCheck} style={{ marginRight: '8px' }} />
              {saving ? 'Đang xử lý...' : 'Hoàn tất nhập kho'}
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}
