import { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDownload, faListUl, faMagnifyingGlass, faPen, faPlus, faSliders,
  faTrash, faUpload, faXmark
} from '@fortawesome/free-solid-svg-icons';
import api from '../../services/api.js';
import { resolveImage } from '../../services/shop.js';
import Pagination from '../../components/admin/Pagination.jsx';
import EmptyState from '../../components/admin/EmptyState.jsx';

const formatPrice = (value) => {
  if (value === null || value === undefined || value === '') return '0';
  return Number(value).toLocaleString('vi-VN');
};

const emptyForm = { code: '', productCode: '', name: '', color: '', ram: '', storage: '', price: '' };

export default function VariantManagement() {
  const [variants, setVariants] = useState([]);
  const [codeQuery, setCodeQuery] = useState('');
  const [nameQuery, setNameQuery] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [products, setProducts] = useState([]);
  const [dialog, setDialog] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [currentImage, setCurrentImage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInput = useRef(null);
  const imageInput = useRef(null);

  const loadAll = async (code = codeQuery, name = nameQuery) => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (code.trim()) params.code = code.trim();
      if (name.trim()) params.name = name.trim();
      const [{ data }, { data: prods }] = await Promise.all([
        api.get('/variants', { params }),
        api.get('/products').catch(() => ({ data: [] })),
      ]);
      setVariants(Array.isArray(data) ? data : []);
      setProducts(Array.isArray(prods) ? prods : []);
    } catch {
      setError('Không tải được danh sách biến thể. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll('', ''); }, []);

  const visibleVariants = variants.filter((variant) => {
    const stock = Number(variant.stockQuantity || 0);
    if (stockFilter === 'OUT') return stock <= 0;
    if (stockFilter === 'ONE') return stock === 1;
    if (stockFilter === 'THREE') return stock <= 3;
    if (stockFilter === 'FIVE') return stock <= 5;
    return true;
  });

  const pageCount = Math.max(1, Math.ceil(visibleVariants.length / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const pageVariants = visibleVariants.slice((safePage - 1) * pageSize, safePage * pageSize);

  const openCreate = () => {
    setForm(emptyForm);
    setImageFile(null);
    setCurrentImage('');
    setDialog({ mode: 'create' });
    setError('');
  };

  const openEdit = (variant) => {
    setForm({
      code: variant.code,
      productCode: variant.productCode || '',
      name: variant.name || '',
      color: variant.color || '',
      ram: variant.ram || '',
      storage: variant.storage || '',
      price: variant.price ?? '',
    });
    setImageFile(null);
    setCurrentImage(variant.imageUrl || '');
    setDialog({ mode: 'edit', code: variant.code, stock: variant.stockQuantity ?? 0 });
    setError('');
  };

  const saveVariant = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const formData = new FormData();
      if (dialog.mode === 'create') formData.append('code', form.code.trim());
      formData.append('productCode', form.productCode);
      formData.append('name', form.name || '');
      formData.append('color', form.color || '');
      formData.append('ram', form.ram || '');
      formData.append('storage', form.storage || '');
      formData.append('price', form.price === '' ? '' : String(form.price));
      if (imageFile) formData.append('image', imageFile);
      if (dialog.mode === 'create') {
        await api.post('/variants', formData);
      } else {
        await api.put(`/variants/${encodeURIComponent(dialog.code)}`, formData);
      }
      setDialog(null);
      await loadAll();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể lưu biến thể. Vui lòng kiểm tra lại dữ liệu.');
    } finally {
      setSaving(false);
    }
  };

  const removeVariant = async (variant) => {
    if (!window.confirm(`Xóa biến thể ${variant.code}?`)) return;
    setError('');
    try {
      await api.delete(`/variants/${encodeURIComponent(variant.code)}`);
      await loadAll();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể xóa biến thể.');
    }
  };

  const exportExcel = async () => {
    setError('');
    try {
      const params = { format: 'xlsx' };
      if (codeQuery.trim()) params.code = codeQuery.trim();
      if (nameQuery.trim()) params.name = nameQuery.trim();
      const response = await api.get('/variants', { params, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'DanhSachBienThe.xlsx';
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
      const { data } = await api.post('/variants/import', formData);
      await loadAll();
      setError(`Import hoàn tất: tạo mới ${data.created}, trùng ${data.duplicatedCount}, lỗi ${data.failedCount}.`);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Import thất bại. Kiểm tra định dạng file.');
    }
  };

  return (
    <div className="ad-brand-page">
      <section className="ad-brand-panel">
        <div className="ad-brand-heading">
          <div>
            <h2><FontAwesomeIcon icon={faSliders} /> Quản lý biến thể</h2>
            <p>Quản lý biến thể sản phẩm.</p>
          </div>
          <div className="ad-brand-actions">
            <button className="ad-button ad-button-primary" onClick={openCreate}>
              <FontAwesomeIcon icon={faPlus} /> Thêm mới
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
          <label>MÃ BIẾN THỂ
            <input value={codeQuery} onChange={(event) => setCodeQuery(event.target.value)} placeholder="Nhập mã biến thể..." />
          </label>
          <label>TÊN BIẾN THỂ
            <input value={nameQuery} onChange={(event) => setNameQuery(event.target.value)} placeholder="Nhập tên biến thể..." />
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
        <p className="ad-brand-count"><strong>Kết quả:</strong> {loading ? 'Đang tải...' : `${visibleVariants.length} bản ghi`}</p>
        <div className="ad-table-wrap">
          <table className="ad-brand-table">
            <thead><tr><th>STT</th><th>MÃ BIẾN THỂ</th><th>TÊN SẢN PHẨM</th><th>TÊN BIẾN THỂ</th><th>HÌNH ẢNH</th><th>MÀU SẮC</th><th>RAM</th><th>DUNG LƯỢNG</th><th>GIÁ</th><th>SỐ LƯỢNG KHO</th><th>THAO TÁC</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="11" className="ad-table-empty">Đang tải dữ liệu...</td></tr>
                : pageVariants.length ? pageVariants.map((variant, index) => (
                  <tr key={variant.code}>
                    <td className="ad-brand-index">{(safePage - 1) * pageSize + index + 1}</td>
                    <td className="ad-brand-code">{variant.code}</td>
                    <td>{variant.productName || variant.productCode}</td>
                    <td>{variant.name || '—'}</td>
                    <td>{variant.imageUrl
                      ? <img src={resolveImage(variant.imageUrl)} alt={variant.name || variant.code} style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 5 }} />
                      : <span>Không có hình</span>}</td>
                    <td>{variant.color || '—'}</td>
                    <td>{variant.ram || '—'}</td>
                    <td>{variant.storage || '—'}</td>
                    <td>{formatPrice(variant.price)}</td>
                    <td>{Number(variant.stockQuantity || 0) > 0
                      ? <span className="ad-role-badge admin">Còn {variant.stockQuantity}</span>
                      : <span className="ad-role-badge">Hết hàng</span>}</td>
                    <td className="ad-brand-row-actions">
                      <button className="ad-button ad-button-edit" onClick={() => openEdit(variant)}><FontAwesomeIcon icon={faPen} /><span>Sửa</span></button>
                      <button className="ad-button ad-button-delete" onClick={() => removeVariant(variant)}><FontAwesomeIcon icon={faTrash} /><span>Xóa</span></button>
                    </td>
                  </tr>
                )) : <tr><td colSpan="11" className="ad-table-empty">Chưa có biến thể phù hợp.</td></tr>}
            </tbody>
          </table>
          {!loading && !visibleVariants.length && (
            <EmptyState
              title="Chưa có biến thể nào"
              hint="Bấm Thêm mới để tạo biến thể đầu tiên"
              actionLabel="Thêm mới"
              onAction={openCreate}
            />
          )}
        </div>
        <Pagination
          page={safePage} pageSize={pageSize} total={visibleVariants.length}
          onPage={setPage}
          onPageSize={(size) => { setPageSize(size); setPage(1); }}
          onRefresh={() => loadAll()}
        />
      </section>

      {dialog && <div className="ad-dialog-backdrop" onMouseDown={(event) => {
        if (event.target === event.currentTarget) setDialog(null);
      }}>
        <form className="ad-brand-dialog ad-review-dialog" onSubmit={saveVariant}>
          <div className="ad-dialog-heading">
            <h2>{dialog.mode === 'create' ? 'Thêm biến thể' : 'Cập nhật biến thể'}</h2>
            <button className="ad-icon-button" type="button" aria-label="Đóng" onClick={() => setDialog(null)}><FontAwesomeIcon icon={faXmark} /></button>
          </div>
          <label>Mã biến thể<input required maxLength="20" disabled={dialog.mode === 'edit'} value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })} placeholder="Ví dụ: BT01" /></label>
          <label>Sản phẩm
            <select required value={form.productCode} onChange={(event) => setForm({ ...form, productCode: event.target.value })}>
              <option value="">-- Chọn sản phẩm --</option>
              {products.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
            </select>
          </label>
          <label>Tên biến thể<input maxLength="100" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Ví dụ: 256GB - Titan" /></label>
          <label>Hình ảnh biến thể
            <input ref={imageInput} type="file" accept="image/*" onChange={(event) => setImageFile(event.target.files?.[0] || null)} />
          </label>
          {(imageFile || currentImage) && (
            <div>
              <img
                src={imageFile ? URL.createObjectURL(imageFile) : resolveImage(currentImage)}
                alt="Biến thể"
                style={{ maxWidth: 100, maxHeight: 100, borderRadius: 4 }}
              />
              <p className="ad-brand-message">{imageFile ? 'Ảnh mới chọn.' : 'Ảnh hiện tại — chọn file mới để thay đổi.'}</p>
            </div>
          )}
          <label>Màu sắc<input maxLength="255" value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} /></label>
          <label>RAM<input maxLength="50" value={form.ram} onChange={(event) => setForm({ ...form, ram: event.target.value })} /></label>
          <label>Dung lượng<input maxLength="50" value={form.storage} onChange={(event) => setForm({ ...form, storage: event.target.value })} /></label>
          <label>Giá<input type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></label>
          <div>
            <p className="ad-brand-message" style={{ margin: 0 }}>
              Tồn kho hiện tại: <strong>{dialog.mode === 'edit' ? Number(dialog.stock || 0) : 0}</strong> — tồn chỉ tăng qua duyệt phiếu nhập kho.
            </p>
          </div>
          <div className="ad-dialog-actions">
            <button className="ad-button ad-button-quiet" type="button" onClick={() => setDialog(null)}>Hủy</button>
            <button className="ad-button ad-button-primary" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu biến thể'}</button>
          </div>
        </form>
      </div>}
    </div>
  );
}
