import { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBoxOpen, faDownload, faListUl, faMagnifyingGlass, faPen, faPlus,
  faTrash, faUpload, faXmark
} from '@fortawesome/free-solid-svg-icons';
import api from '../../services/api.js';
import { resolveImage } from '../../services/shop.js';
import Pagination from '../../components/admin/Pagination.jsx';
import EmptyState from '../../components/admin/EmptyState.jsx';
import ConfirmModal from '../../components/common/ConfirmModal.jsx';

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === '') return 'N/A';
  return `${Number(value).toLocaleString('vi-VN')} ₫`;
};

export const imageBaseUrl = () => (api.defaults.baseURL || '').replace(/\/api$/, '');

export default function ProductManagement({ notify }) {
  const [products, setProducts] = useState([]);
  const [codeQuery, setCodeQuery] = useState('');
  const [nameQuery, setNameQuery] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [dialog, setDialog] = useState(null);
  const [form, setForm] = useState({ code: '', name: '', categoryCode: '', brandCode: '', supplierCode: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInput = useRef(null);

  const loadAll = async (code = codeQuery, name = nameQuery) => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (code.trim()) params.code = code.trim();
      if (name.trim()) params.name = name.trim();
      const [{ data }, { data: cats }, { data: brs }, { data: sups }] = await Promise.all([
        api.get('/products', { params }),
        api.get('/categories').catch(() => ({ data: [] })),
        api.get('/brands').catch(() => ({ data: [] })),
        api.get('/suppliers').catch(() => ({ data: [] })),
      ]);
      setProducts(Array.isArray(data) ? data : []);
      setCategories(Array.isArray(cats) ? cats : []);
      setBrands(Array.isArray(brs) ? brs : []);
      setSuppliers(Array.isArray(sups) ? sups : []);
    } catch {
      setError('Không tải được danh sách sản phẩm. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll('', ''); }, []);

  const visibleProducts = products.filter((product) => {
    const stock = Number(product.stockQuantity || 0);
    if (stockFilter === 'OUT') return stock <= 0;
    if (stockFilter === 'ONE') return stock === 1;
    if (stockFilter === 'THREE') return stock <= 3;
    if (stockFilter === 'FIVE') return stock <= 5;
    return true;
  });

  const pageCount = Math.max(1, Math.ceil(visibleProducts.length / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const pageProducts = visibleProducts.slice((safePage - 1) * pageSize, safePage * pageSize);

  const openCreate = () => {
    setForm({ code: '', name: '', categoryCode: '', brandCode: '', supplierCode: '' });
    setDialog({ mode: 'create' });
    setError('');
  };

  const openEdit = (product) => {
    setForm({
      code: product.code,
      name: product.name,
      categoryCode: product.categoryCode || '',
      brandCode: product.brandCode || '',
      supplierCode: product.supplierCode || '',
    });
    setDialog({ mode: 'edit', code: product.code });
    setError('');
  };

  const saveProduct = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name.trim(),
        categoryCode: form.categoryCode || null,
        brandCode: form.brandCode || null,
        supplierCode: form.supplierCode || null,
      };
      if (dialog.mode === 'create') {
        await api.post('/products', { ...payload, code: form.code.trim() });
      } else {
        await api.put(`/products/${encodeURIComponent(dialog.code)}`, payload);
      }
      const isCreate = dialog.mode === 'create';
      setDialog(null);
      await loadAll();
      notify?.('success', isCreate ? 'Đã thêm sản phẩm.' : 'Đã cập nhật sản phẩm.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể lưu sản phẩm. Vui lòng kiểm tra lại dữ liệu.');
    } finally {
      setSaving(false);
    }
  };

  const removeProduct = async (product) => {
    setError('');
    try {
      await api.delete(`/products/${encodeURIComponent(product.code)}`);
      setDeleteTarget(null);
      await loadAll();
      notify?.('success', 'Đã xóa sản phẩm.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể xóa sản phẩm.');
    }
  };

  const exportExcel = async () => {
    setError('');
    try {
      const params = { format: 'xlsx' };
      if (codeQuery.trim()) params.code = codeQuery.trim();
      if (nameQuery.trim()) params.name = nameQuery.trim();
      const response = await api.get('/products', { params, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'DanhSachSanPham.xlsx';
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      setError('Không thể xuất Excel. Vui lòng thử lại.');
    }
  };

  const importExcel = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/products/import', formData);
      await loadAll();
      notify?.('success', `Import hoàn tất: tạo mới ${data.created}, trùng ${data.duplicatedCount}, lỗi ${data.failedCount}.`);
    } catch (requestError) {
      const data = requestError.response?.data;
      setError(data?.message || 'Import thất bại. Kiểm tra định dạng file (A-E: Mã, Tên, Mã DM, Mã TH, Mã NCC).');
    }
  };

  return (
    <div className="ad-brand-page">
      <section className="ad-brand-panel">
        <div className="ad-brand-heading">
          <div>
            <h2><FontAwesomeIcon icon={faBoxOpen} /> Quản lý sản phẩm</h2>
            <p>Tra cứu và cập nhật sản phẩm.</p>
          </div>
          <div className="ad-brand-actions">
            <button className="ad-button ad-button-primary" onClick={openCreate}>
              <FontAwesomeIcon icon={faPlus} /> Thêm sản phẩm
            </button>
            <button className="ad-button ad-button-quiet" onClick={() => fileInput.current?.click()}>
              <FontAwesomeIcon icon={faUpload} /> Nhập Excel
            </button>
            <input ref={fileInput} type="file" accept=".xls,.xlsx" hidden onChange={importExcel} />
          </div>
        </div>

        <form className="ad-brand-filter" onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          loadAll(codeQuery, nameQuery);
        }}>
          <label>MÃ SẢN PHẨM
            <input value={codeQuery} onChange={(event) => setCodeQuery(event.target.value)} placeholder="Nhập mã sản phẩm..." />
          </label>
          <label>TÊN SẢN PHẨM
            <input value={nameQuery} onChange={(event) => setNameQuery(event.target.value)} placeholder="Nhập tên sản phẩm..." />
          </label>
          <div className="ad-filter-actions">
            <button className="ad-button ad-button-blue" type="submit"><FontAwesomeIcon icon={faMagnifyingGlass} /> Tìm kiếm</button>
            <button className="ad-button ad-button-quiet" type="button" onClick={() => {
              setCodeQuery(''); setNameQuery(''); setStockFilter(''); setPage(1); loadAll('', '');
            }}>Làm mới</button>
            <button className="ad-button ad-button-pink" type="button" onClick={exportExcel}>
              <FontAwesomeIcon icon={faDownload} /> Xuất Excel
            </button>
          </div>
        </form>
        {error && <p className="ad-brand-message" role="status">{error}</p>}
      </section>

      <section className="ad-brand-panel ad-brand-list">
        <div className="ad-list-head">
          <h2><FontAwesomeIcon icon={faListUl} /> Danh sách hiện tại</h2>
          <div className="ad-list-filters">
            <label className="ad-list-filter">Tồn kho:
              <select value={stockFilter} onChange={(event) => { setStockFilter(event.target.value); setPage(1); }}>
                <option value="">Tất cả</option>
                <option value="OUT">Hết hàng</option>
                <option value="ONE">Còn 1</option>
                <option value="THREE">Còn ≤ 3</option>
                <option value="FIVE">Còn ≤ 5</option>
              </select>
            </label>
          </div>
        </div>
        <p className="ad-brand-count"><strong>Kết quả:</strong> {loading ? 'Đang tải...' : `${visibleProducts.length} bản ghi`}</p>
        <div className="ad-table-wrap">
          <table className="ad-brand-table">
            <thead><tr><th>STT</th><th>MÃ SP</th><th>TÊN SP</th><th>BIẾN THỂ ĐẠI DIỆN</th><th>HÌNH ẢNH</th><th>GIÁ</th><th>TỔNG TỒN</th><th>DANH MỤC</th><th>THƯƠNG HIỆU</th><th>NHÀ CUNG CẤP</th><th>THAO TÁC</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="11" className="ad-table-empty">Đang tải dữ liệu...</td></tr>
                : pageProducts.length ? pageProducts.map((product, index) => (
                  <tr key={product.code}>
                    <td className="ad-brand-index">{(safePage - 1) * pageSize + index + 1}</td>
                    <td className="ad-brand-code">{product.code}</td>
                    <td>{product.name}</td>
                    <td>{product.variantName || '—'}</td>
                    <td>{product.imageUrl
                      ? <img src={resolveImage(product.imageUrl)} alt={product.name} style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 5 }} />
                      : <span>Không có hình</span>}</td>
                    <td>{formatCurrency(product.price)}</td>
                    <td>{Number(product.stockQuantity || 0) > 0
                      ? <span className="ad-role-badge admin" title="Tổng tồn khả dụng tất cả biến thể">Còn {product.stockQuantity}</span>
                      : <span className="ad-role-badge">Hết hàng</span>}</td>
                    <td>{product.categoryName || 'N/A'}</td>
                    <td>{product.brandName || 'N/A'}</td>
                    <td>{product.supplierName || 'N/A'}</td>
                    <td className="ad-brand-row-actions">
                      <button className="ad-button ad-button-edit" onClick={() => openEdit(product)}><FontAwesomeIcon icon={faPen} /><span>Sửa</span></button>
                      <button className="ad-button ad-button-delete" onClick={() => setDeleteTarget(product)}><FontAwesomeIcon icon={faTrash} /><span>Xóa</span></button>
                    </td>
                  </tr>
                )) : <tr><td colSpan="11" className="ad-table-empty">Chưa có sản phẩm phù hợp.</td></tr>}
            </tbody>
          </table>
          {!loading && !visibleProducts.length && (
            <EmptyState
              title="Chưa có sản phẩm nào"
              hint="Bấm Thêm sản phẩm để tạo sản phẩm đầu tiên"
              actionLabel="Thêm sản phẩm"
              onAction={openCreate}
            />
          )}
        </div>
        <Pagination
          page={safePage} pageSize={pageSize} total={visibleProducts.length}
          onPage={setPage}
          onPageSize={(size) => { setPageSize(size); setPage(1); }}
          onRefresh={() => loadAll()}
        />
        {deleteTarget && (
          <ConfirmModal
            message={<>Bạn có chắc muốn xóa sản phẩm <strong>{deleteTarget.name} ({deleteTarget.code})</strong>? Các biến thể liên quan cũng bị xóa.</>}
            onCancel={() => setDeleteTarget(null)}
            onConfirm={() => removeProduct(deleteTarget)}
          />
        )}
      </section>

      {dialog && <div className="ad-dialog-backdrop" onMouseDown={(event) => {
        if (event.target === event.currentTarget) setDialog(null);
      }}>
        <form className="ad-brand-dialog" onSubmit={saveProduct}>
          <div className="ad-dialog-heading">
            <h2>{dialog.mode === 'create' ? 'Thêm sản phẩm' : 'Cập nhật sản phẩm'}</h2>
            <button className="ad-icon-button" type="button" aria-label="Đóng" onClick={() => setDialog(null)}><FontAwesomeIcon icon={faXmark} /></button>
          </div>
          <label>Mã sản phẩm<input required maxLength="20" disabled={dialog.mode === 'edit'} value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })} placeholder="Ví dụ: SP01" /></label>
          <label>Tên sản phẩm<input required maxLength="255" autoFocus value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Nhập tên sản phẩm" /></label>
          <label>Danh mục
            <select value={form.categoryCode} onChange={(event) => setForm({ ...form, categoryCode: event.target.value })}>
              <option value="">-- Chọn danh mục --</option>
              {categories.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
          </label>
          <label>Thương hiệu
            <select value={form.brandCode} onChange={(event) => setForm({ ...form, brandCode: event.target.value })}>
              <option value="">-- Chọn thương hiệu --</option>
              {brands.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
            </select>
          </label>
          <label>Nhà cung cấp
            <select value={form.supplierCode} onChange={(event) => setForm({ ...form, supplierCode: event.target.value })}>
              <option value="">-- Chọn nhà cung cấp --</option>
              {suppliers.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
            </select>
          </label>
          <p className="ad-brand-message">Hình ảnh, giá, số lượng quản lý ở biến thể.</p>
          <div className="ad-dialog-actions">
            <button className="ad-button ad-button-quiet" type="button" onClick={() => setDialog(null)}>Hủy</button>
            <button className="ad-button ad-button-primary" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu sản phẩm'}</button>
          </div>
        </form>
      </div>}
    </div>
  );
}
