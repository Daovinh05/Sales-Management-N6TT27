import { useEffect, useMemo, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDownload, faFileExcel, faMagnifyingGlass, faPen, faPlus,
  faTrash, faUpload, faXmark
} from '@fortawesome/free-solid-svg-icons';
import api from '../../services/api.js';

const formatDate = (value) => new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short', timeStyle: 'medium'
}).format(new Date(value));

function downloadCsv(brands) {
  const rows = [['Mã thương hiệu', 'Tên thương hiệu', 'Ngày tạo'], ...brands.map((brand) => [
    brand.code, brand.name, formatDate(brand.createdAt)
  ])];
  const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\r\n');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' }));
  link.download = 'danh-sach-thuong-hieu.csv';
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function BrandManagement() {
  const [brands, setBrands] = useState([]);
  const [codeQuery, setCodeQuery] = useState('');
  const [nameQuery, setNameQuery] = useState('');
  const [filters, setFilters] = useState({ code: '', name: '' });
  const [dialog, setDialog] = useState(null);
  const [form, setForm] = useState({ code: '', name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInput = useRef(null);

  const loadBrands = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/brands');
      setBrands(data);
    } catch {
      setError('Không tải được danh sách thương hiệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBrands(); }, []);

  const filteredBrands = useMemo(() => brands.filter((brand) =>
    brand.code.toLowerCase().includes(filters.code.toLowerCase())
    && brand.name.toLowerCase().includes(filters.name.toLowerCase())
  ), [brands, filters]);

  const openCreate = () => {
    setForm({ code: '', name: '' });
    setDialog({ mode: 'create' });
    setError('');
  };

  const openEdit = (brand) => {
    setForm({ code: brand.code, name: brand.name });
    setDialog({ mode: 'edit', code: brand.code });
    setError('');
  };

  const saveBrand = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (dialog.mode === 'create') {
        await api.post('/brands', { code: form.code.trim(), name: form.name.trim() });
      } else {
        await api.put(`/brands/${encodeURIComponent(dialog.code)}`, { name: form.name.trim() });
      }
      setDialog(null);
      await loadBrands();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể lưu thương hiệu. Vui lòng kiểm tra lại dữ liệu.');
    } finally {
      setSaving(false);
    }
  };

  const removeBrand = async (brand) => {
    if (!window.confirm(`Xóa thương hiệu ${brand.name} (${brand.code})?`)) return;
    setError('');
    try {
      await api.delete(`/brands/${encodeURIComponent(brand.code)}`);
      await loadBrands();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể xóa thương hiệu.');
    }
  };

  const importCsv = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const lines = (await file.text()).replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
    const rows = lines.slice(1).map((line) => {
      const [code, name] = line.split(',').map((field) => field.trim().replace(/^"|"$/g, '').replaceAll('""', '"'));
      return { code, name };
    }).filter((row) => row.code && row.name);
    if (!rows.length) {
      setError('Tệp không có dữ liệu hợp lệ. Dùng CSV gồm cột Mã thương hiệu, Tên thương hiệu.');
      return;
    }
    setError('');
    let imported = 0;
    for (const row of rows) {
      try {
        await api.post('/brands', row);
        imported += 1;
      } catch {
        // Keep importing valid rows when a code or name already exists.
      }
    }
    await loadBrands();
    setError(imported ? `Đã nhập ${imported}/${rows.length} thương hiệu.` : 'Không có thương hiệu mới nào được nhập.');
  };

  return (
    <div className="ad-brand-page">
      <section className="ad-brand-panel">
        <div className="ad-brand-heading">
          <div>
            <h2><FontAwesomeIcon icon={faFileExcel} /> Quản lý thương hiệu</h2>
            <p>Quản lý thương hiệu sản phẩm.</p>
          </div>
          <div className="ad-brand-actions">
            <button className="ad-button ad-button-primary" onClick={openCreate}>
              <FontAwesomeIcon icon={faPlus} /> Thêm mới
            </button>
            <button className="ad-button ad-button-quiet" onClick={() => fileInput.current?.click()}>
              <FontAwesomeIcon icon={faUpload} /> Nhập CSV
            </button>
            <input ref={fileInput} type="file" accept=".csv,text/csv" hidden onChange={importCsv} />
          </div>
        </div>

        <form className="ad-brand-filter" onSubmit={(event) => {
          event.preventDefault();
          setFilters({ code: codeQuery.trim(), name: nameQuery.trim() });
        }}>
          <label>MÃ THƯƠNG HIỆU
            <input value={codeQuery} onChange={(event) => setCodeQuery(event.target.value)} placeholder="Nhập mã thương hiệu..." />
          </label>
          <label>TÊN THƯƠNG HIỆU
            <input value={nameQuery} onChange={(event) => setNameQuery(event.target.value)} placeholder="Nhập tên thương hiệu..." />
          </label>
          <div className="ad-filter-actions">
            <button className="ad-button ad-button-blue" type="submit"><FontAwesomeIcon icon={faMagnifyingGlass} /> Tìm kiếm</button>
            <button className="ad-button ad-button-quiet" type="button" onClick={() => {
              setCodeQuery(''); setNameQuery(''); setFilters({ code: '', name: '' });
            }}>Làm mới</button>
            <button className="ad-button ad-button-pink" type="button" onClick={() => downloadCsv(filteredBrands)}>
              <FontAwesomeIcon icon={faDownload} /> Xuất CSV
            </button>
          </div>
        </form>
        {error && <p className="ad-brand-message" role="status">{error}</p>}
      </section>

      <section className="ad-brand-panel ad-brand-list">
        <h2><FontAwesomeIcon icon={faFileExcel} /> Danh sách hiện tại</h2>
        <p className="ad-brand-count"><strong>Kết quả:</strong> {loading ? 'Đang tải...' : `${filteredBrands.length} bản ghi`}</p>
        <div className="ad-table-wrap">
          <table className="ad-brand-table">
            <thead><tr><th>STT</th><th>MÃ THƯƠNG HIỆU</th><th>TÊN THƯƠNG HIỆU</th><th>NGÀY TẠO</th><th>THAO TÁC</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="5" className="ad-table-empty">Đang tải dữ liệu...</td></tr>
                : filteredBrands.length ? filteredBrands.map((brand, index) => (
                  <tr key={brand.code}>
                    <td className="ad-brand-index">{index + 1}</td><td className="ad-brand-code">{brand.code}</td>
                    <td>{brand.name}</td><td>{formatDate(brand.createdAt)}</td>
                    <td className="ad-brand-row-actions">
                      <button className="ad-button ad-button-edit" title="Sửa thương hiệu" onClick={() => openEdit(brand)}><FontAwesomeIcon icon={faPen} /><span>Sửa</span></button>
                      <button className="ad-button ad-button-delete" title="Xóa thương hiệu" onClick={() => removeBrand(brand)}><FontAwesomeIcon icon={faTrash} /><span>Xóa</span></button>
                    </td>
                  </tr>
                )) : <tr><td colSpan="5" className="ad-table-empty">Chưa có thương hiệu phù hợp.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {dialog && <div className="ad-dialog-backdrop" onMouseDown={(event) => {
        if (event.target === event.currentTarget) setDialog(null);
      }}>
        <form className="ad-brand-dialog" onSubmit={saveBrand}>
          <div className="ad-dialog-heading">
            <h2>{dialog.mode === 'create' ? 'Thêm thương hiệu' : 'Cập nhật thương hiệu'}</h2>
            <button className="ad-icon-button" type="button" aria-label="Đóng" onClick={() => setDialog(null)}><FontAwesomeIcon icon={faXmark} /></button>
          </div>
          <label>Mã thương hiệu<input required maxLength="20" disabled={dialog.mode === 'edit'} value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })} placeholder="Ví dụ: TH12" /></label>
          <label>Tên thương hiệu<input required maxLength="100" autoFocus value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Nhập tên thương hiệu" /></label>
          {error && <p className="ad-brand-message" role="alert">{error}</p>}
          <div className="ad-dialog-actions">
            <button className="ad-button ad-button-quiet" type="button" onClick={() => setDialog(null)}>Hủy</button>
            <button className="ad-button ad-button-primary" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu thương hiệu'}</button>
          </div>
        </form>
      </div>}
    </div>
  );
}