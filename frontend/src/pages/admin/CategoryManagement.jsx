import { useEffect, useMemo, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDownload, faFileExcel, faList, faMagnifyingGlass, faPen, faPlus, faTrash, faUpload, faXmark
} from '@fortawesome/free-solid-svg-icons';
import readXlsxFile from 'read-excel-file/browser';
import writeXlsxFile from 'write-excel-file/browser';
import api from '../../services/api.js';
import Pagination from '../../components/admin/Pagination.jsx';
import EmptyState from '../../components/admin/EmptyState.jsx';

const formatDate = (value) => value
  ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'medium' }).format(new Date(value))
  : '—';

const normalizeHeader = (value) => String(value ?? '').normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

export default function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [queries, setQueries] = useState({ code: '', name: '' });
  const [filters, setFilters] = useState({ code: '', name: '' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dialog, setDialog] = useState(null);
  const [form, setForm] = useState({ code: '', name: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const fileInput = useRef(null);

  const loadCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/categories');
      setCategories(data);
    } catch {
      setError('Không tải được danh sách danh mục. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCategories(); }, []);

  const filteredCategories = useMemo(() => categories.filter((category) =>
    category.code.toLocaleLowerCase('vi').includes(filters.code.toLocaleLowerCase('vi'))
    && category.name.toLocaleLowerCase('vi').includes(filters.name.toLocaleLowerCase('vi'))
  ), [categories, filters]);

  const categoryPageCount = Math.max(1, Math.ceil(filteredCategories.length / pageSize));
  const categorySafePage = Math.min(Math.max(1, page), categoryPageCount);
  const pageCategories = filteredCategories.slice((categorySafePage - 1) * pageSize, categorySafePage * pageSize);

  const openCreate = () => {
    setForm({ code: '', name: '' });
    setDialog({ mode: 'create' });
    setError('');
    setNotice('');
  };

  const openEdit = (category) => {
    setForm({ code: category.code, name: category.name });
    setDialog({ mode: 'edit', code: category.code });
    setError('');
    setNotice('');
  };

  const saveCategory = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      if (dialog.mode === 'create') {
        await api.post('/categories', { code: form.code.trim(), name: form.name.trim() });
      } else {
        await api.put(`/categories/${encodeURIComponent(dialog.code)}`, { name: form.name.trim() });
      }
      setDialog(null);
      await loadCategories();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể lưu danh mục. Vui lòng kiểm tra dữ liệu.');
    } finally {
      setSaving(false);
    }
  };

  const removeCategory = async (category) => {
    if (!window.confirm(`Xóa danh mục ${category.name} (${category.code})?`)) return;
    setError('');
    setNotice('');
    try {
      await api.delete(`/categories/${encodeURIComponent(category.code)}`);
      setNotice(`Đã xóa danh mục ${category.name}.`);
      await loadCategories();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể xóa danh mục.');
    }
  };

  const importExcel = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError('');
    setNotice('');
    setSaving(true);
    try {
      const rows = await readXlsxFile(file, { sheet: 1 });
      if (rows.length < 2) {
        setError('Tệp Excel cần có dòng tiêu đề và ít nhất một danh mục.');
        return;
      }
      const headers = rows[0].map(normalizeHeader);
      const codeIndex = headers.findIndex((header) => ['madanhmuc', 'code', 'categorycode'].includes(header));
      const nameIndex = headers.findIndex((header) => ['tendanhmuc', 'name', 'categoryname'].includes(header));
      if (codeIndex < 0 || nameIndex < 0) {
        setError('Tệp Excel cần có cột Mã danh mục và Tên danh mục.');
        return;
      }
      let imported = 0;
      let failed = 0;
      for (const row of rows.slice(1)) {
        const code = String(row[codeIndex] ?? '').trim();
        const name = String(row[nameIndex] ?? '').trim();
        if (!code || !name) { failed += 1; continue; }
        try {
          await api.post('/categories', { code, name });
          imported += 1;
        } catch {
          failed += 1;
        }
      }
      await loadCategories();
      setNotice(`Đã nhập ${imported}/${rows.length - 1} danh mục${failed ? `; ${failed} dòng lỗi hoặc bị bỏ qua` : ''}.`);
    } catch {
      setError('Không đọc được tệp Excel. Vui lòng chọn tệp .xlsx hợp lệ.');
    } finally {
      setSaving(false);
    }
  };

  const exportExcel = async () => {
    const rows = [
      ['Mã danh mục', 'Tên danh mục', 'Ngày tạo'],
      ...filteredCategories.map((category) => [category.code, category.name, formatDate(category.createdAt)])
    ];
    await writeXlsxFile(rows, { sheet: 'Danh muc' }).toFile('danh-sach-danh-muc.xlsx');
  };

  return (
    <div className="ad-brand-page ad-category-page">
      <section className="ad-brand-panel">
        <div className="ad-brand-heading">
          <div>
            <h2><FontAwesomeIcon icon={faList} /> Quản lý Danh mục</h2>
            <p>Quản lý danh mục sản phẩm.</p>
          </div>
          <div className="ad-brand-actions">
            <button className="ad-button ad-button-primary" type="button" onClick={openCreate}>
              <FontAwesomeIcon icon={faPlus} /> Thêm mới danh mục
            </button>
            <button className="ad-button ad-button-quiet" type="button" onClick={() => fileInput.current?.click()} disabled={saving}>
              <FontAwesomeIcon icon={faFileExcel} /> Nhập Excel
            </button>
            <input ref={fileInput} type="file" accept=".xlsx" hidden onChange={importExcel} />
          </div>
        </div>

        <form className="ad-category-filter" onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          setFilters({ code: queries.code.trim(), name: queries.name.trim() });
        }}>
          <label>MÃ DANH MỤC
            <input value={queries.code} onChange={(event) => setQueries({ ...queries, code: event.target.value })} placeholder="Nhập mã danh mục..." />
          </label>
          <label>TÊN DANH MỤC
            <input value={queries.name} onChange={(event) => setQueries({ ...queries, name: event.target.value })} placeholder="Nhập tên danh mục..." />
          </label>
          <div className="ad-filter-actions">
            <button className="ad-button ad-category-search" type="submit"><FontAwesomeIcon icon={faMagnifyingGlass} /> Tìm kiếm</button>
            <button className="ad-button ad-button-quiet" type="button" onClick={() => {
              setQueries({ code: '', name: '' });
              setFilters({ code: '', name: '' });
              setPage(1);
            }}>Làm mới</button>
            <button className="ad-button ad-button-pink" type="button" onClick={exportExcel} disabled={!filteredCategories.length}>
              <FontAwesomeIcon icon={faDownload} /> Xuất Excel
            </button>
          </div>
        </form>
        {error && <p className="ad-brand-message" role="alert">{error}</p>}
        {notice && <p className="ad-user-notice" role="status">{notice}</p>}
      </section>

      <section className="ad-brand-panel ad-brand-list">
        <h2><FontAwesomeIcon icon={faList} /> Danh sách hiện tại</h2>
        <p className="ad-brand-count"><strong>Kết quả:</strong> {loading ? 'Đang tải...' : `${filteredCategories.length} bản ghi`}</p>
        <div className="ad-table-wrap">
          <table className="ad-brand-table ad-category-table">
            <thead><tr><th>STT</th><th>MÃ DANH MỤC</th><th>TÊN DANH MỤC</th><th>NGÀY TẠO</th><th>THAO TÁC</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="5" className="ad-table-empty">Đang tải dữ liệu...</td></tr>
                : pageCategories.length ? pageCategories.map((category, index) => (
                  <tr key={category.code}>
                    <td className="ad-brand-index">{(categorySafePage - 1) * pageSize + index + 1}</td>
                    <td className="ad-brand-code">{category.code}</td>
                    <td>{category.name}</td>
                    <td>{formatDate(category.createdAt)}</td>
                    <td className="ad-brand-row-actions">
                      <button className="ad-button ad-button-edit" type="button" title="Sửa danh mục" onClick={() => openEdit(category)}><FontAwesomeIcon icon={faPen} /><span>Sửa</span></button>
                      <button className="ad-button ad-button-delete" type="button" title="Xóa danh mục" onClick={() => removeCategory(category)}><FontAwesomeIcon icon={faTrash} /><span>Xóa</span></button>
                    </td>
                  </tr>
                )) : <tr><td colSpan="5" className="ad-table-empty">Chưa có danh mục phù hợp.</td></tr>}
            </tbody>
          </table>
          {!loading && !filteredCategories.length && (
            <EmptyState
              title="Chưa có danh mục nào"
              hint="Bấm Thêm mới để tạo danh mục đầu tiên"
              actionLabel="Thêm mới"
              onAction={openCreate}
            />
          )}
        </div>
        <Pagination
          page={categorySafePage} pageSize={pageSize} total={filteredCategories.length}
          onPage={setPage}
          onPageSize={(size) => { setPageSize(size); setPage(1); }}
          onRefresh={loadCategories}
        />
      </section>

      {dialog && <div className="ad-dialog-backdrop" onMouseDown={(event) => {
        if (event.target === event.currentTarget) setDialog(null);
      }}>
        <form className="ad-brand-dialog" onSubmit={saveCategory}>
          <div className="ad-dialog-heading">
            <h2>{dialog.mode === 'create' ? 'Thêm danh mục' : 'Cập nhật danh mục'}</h2>
            <button className="ad-icon-button" type="button" aria-label="Đóng" onClick={() => setDialog(null)}><FontAwesomeIcon icon={faXmark} /></button>
          </div>
          <label>Mã danh mục
            <input required maxLength="20" disabled={dialog.mode === 'edit'} value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })} placeholder="Ví dụ: DM10" />
          </label>
          <label>Tên danh mục
            <input required maxLength="100" autoFocus value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Nhập tên danh mục" />
          </label>
          {error && <p className="ad-brand-message" role="alert">{error}</p>}
          <div className="ad-dialog-actions">
            <button className="ad-button ad-button-quiet" type="button" onClick={() => setDialog(null)}>Hủy</button>
            <button className="ad-button ad-button-primary" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu danh mục'}</button>
          </div>
        </form>
      </div>}
    </div>
  );
}