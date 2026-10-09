import { useEffect, useMemo, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDownload, faFileExcel, faMagnifyingGlass, faPen, faPlus, faTrash, faTruck, faXmark
} from '@fortawesome/free-solid-svg-icons';
import readXlsxFile from 'read-excel-file/browser';
import writeXlsxFile from 'write-excel-file/browser';
import api from '../../services/api.js';
import Pagination from '../../components/admin/Pagination.jsx';
import EmptyState from '../../components/admin/EmptyState.jsx';
import ConfirmModal from '../../components/common/ConfirmModal.jsx';

const formatDate = (value) => value
  ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'medium' }).format(new Date(value))
  : '—';

const normalizeHeader = (value) => String(value ?? '').normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

export default function SupplierManagement({ notify }) {
  const [suppliers, setSuppliers] = useState([]);
  const [queries, setQueries] = useState({ code: '', name: '' });
  const [filters, setFilters] = useState({ code: '', name: '' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [form, setForm] = useState({ code: '', name: '', address: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInput = useRef(null);

  const loadSuppliers = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/suppliers');
      setSuppliers(data);
    } catch {
      setError('Không tải được danh sách nhà cung cấp. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSuppliers(); }, []);

  const filteredSuppliers = useMemo(() => suppliers.filter((supplier) =>
    supplier.code.toLocaleLowerCase('vi').includes(filters.code.toLocaleLowerCase('vi'))
    && supplier.name.toLocaleLowerCase('vi').includes(filters.name.toLocaleLowerCase('vi'))
  ), [suppliers, filters]);

  const supplierPageCount = Math.max(1, Math.ceil(filteredSuppliers.length / pageSize));
  const supplierSafePage = Math.min(Math.max(1, page), supplierPageCount);
  const pageSuppliers = filteredSuppliers.slice((supplierSafePage - 1) * pageSize, supplierSafePage * pageSize);

  const openCreate = () => {
    setForm({ code: '', name: '', address: '', phone: '' });
    setDialog({ mode: 'create' });
    setError('');
  };

  const openEdit = (supplier) => {
    setForm({ code: supplier.code, name: supplier.name, address: supplier.address || '', phone: supplier.phone || '' });
    setDialog({ mode: 'edit', code: supplier.code });
    setError('');
  };

  const saveSupplier = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (dialog.mode === 'create') {
        await api.post('/suppliers', { ...form, code: form.code.trim(), name: form.name.trim() });
      } else {
        await api.put(`/suppliers/${encodeURIComponent(dialog.code)}`, {
          name: form.name.trim(), address: form.address.trim(), phone: form.phone.trim()
        });
      }
      setDialog(null);
      await loadSuppliers();
      notify?.('success', 'Đã lưu nhà cung cấp.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể lưu nhà cung cấp. Vui lòng kiểm tra dữ liệu.');
    } finally {
      setSaving(false);
    }
  };

  const removeSupplier = async (supplier) => {
    setError('');
    try {
      await api.delete(`/suppliers/${encodeURIComponent(supplier.code)}`);
      notify?.('success', `Đã xóa nhà cung cấp ${supplier.name}.`);
      setDeleteTarget(null);
      await loadSuppliers();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể xóa nhà cung cấp.');
    }
  };

  const importExcel = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setSaving(true);
    setError('');
    try {
      const rows = await readXlsxFile(file, { sheet: 1 });
      if (rows.length < 2) {
        setError('Tệp Excel cần có dòng tiêu đề và ít nhất một nhà cung cấp.');
        return;
      }
      const headers = rows[0].map(normalizeHeader);
      const column = (aliases) => headers.findIndex((header) => aliases.includes(header));
      const indexes = {
        code: column(['manhacungcap', 'code', 'suppliercode']),
        name: column(['tennhacungcap', 'name', 'suppliername']),
        address: column(['diachi', 'address']),
        phone: column(['dienthoai', 'sodienthoai', 'phone', 'phonenumber'])
      };
      if (indexes.code < 0 || indexes.name < 0) {
        setError('Tệp Excel cần có ít nhất hai cột Mã nhà cung cấp và Tên nhà cung cấp.');
        return;
      }
      let imported = 0;
      let failed = 0;
      for (const row of rows.slice(1)) {
        const code = String(row[indexes.code] ?? '').trim();
        const name = String(row[indexes.name] ?? '').trim();
        if (!code || !name) { failed += 1; continue; }
        try {
          await api.post('/suppliers', {
            code,
            name,
            address: indexes.address < 0 ? '' : String(row[indexes.address] ?? '').trim(),
            phone: indexes.phone < 0 ? '' : String(row[indexes.phone] ?? '').trim()
          });
          imported += 1;
        } catch {
          failed += 1;
        }
      }
      await loadSuppliers();
      notify?.('success', `Đã nhập ${imported}/${rows.length - 1} nhà cung cấp${failed ? `; ${failed} dòng lỗi hoặc bị bỏ qua` : ''}.`);
    } catch {
      setError('Không đọc được tệp Excel. Vui lòng chọn tệp .xlsx hợp lệ.');
    } finally {
      setSaving(false);
    }
  };

  const exportExcel = async () => {
    const rows = [
      ['Mã nhà cung cấp', 'Tên nhà cung cấp', 'Địa chỉ', 'Điện thoại', 'Ngày tạo'],
      ...filteredSuppliers.map((supplier) => [
        supplier.code, supplier.name, supplier.address || '', supplier.phone || '', formatDate(supplier.createdAt)
      ])
    ];
    await writeXlsxFile(rows, { sheet: 'Nha cung cap' }).toFile('danh-sach-nha-cung-cap.xlsx');
  };

  return (
    <div className="ad-brand-page ad-supplier-page">
      <section className="ad-brand-panel">
        <div className="ad-brand-heading">
          <div>
            <h2><FontAwesomeIcon icon={faTruck} /> Quản lý Nhà cung cấp</h2>
            <p>Tìm kiếm và quản lý thông tin nhà cung cấp.</p>
          </div>
          <div className="ad-brand-actions">
            <button className="ad-button ad-button-primary" type="button" onClick={openCreate}>
              <FontAwesomeIcon icon={faPlus} /> Thêm mới nhà cung cấp
            </button>
            <button className="ad-button ad-button-quiet" type="button" onClick={() => fileInput.current?.click()} disabled={saving}>
              <FontAwesomeIcon icon={faFileExcel} /> Nhập Excel
            </button>
            <input ref={fileInput} type="file" accept=".xlsx" hidden onChange={importExcel} />
          </div>
        </div>

        <form className="ad-supplier-filter" onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          setFilters({ code: queries.code.trim(), name: queries.name.trim() });
        }}>
          <label>MÃ NHÀ CUNG CẤP
            <input value={queries.code} onChange={(event) => setQueries({ ...queries, code: event.target.value })} placeholder="Nhập mã cần tìm..." />
          </label>
          <label>TÊN NHÀ CUNG CẤP
            <input value={queries.name} onChange={(event) => setQueries({ ...queries, name: event.target.value })} placeholder="Nhập tên cần tìm..." />
          </label>
          <div className="ad-filter-actions">
            <button className="ad-button ad-button-blue" type="submit"><FontAwesomeIcon icon={faMagnifyingGlass} /> Tìm kiếm</button>
            <button className="ad-button ad-button-quiet" type="button" onClick={() => {
              setQueries({ code: '', name: '' });
              setFilters({ code: '', name: '' });
              setPage(1);
            }}>Làm mới</button>
            <button className="ad-button ad-button-pink" type="button" onClick={exportExcel} disabled={!filteredSuppliers.length}>
              <FontAwesomeIcon icon={faDownload} /> Xuất Excel
            </button>
          </div>
        </form>
        {error && <p className="ad-brand-message" role="alert">{error}</p>}
      </section>

      <section className="ad-brand-panel ad-brand-list">
        <h2><FontAwesomeIcon icon={faTruck} /> Danh sách hiện tại</h2>
        <p className="ad-brand-count"><strong>Kết quả:</strong> {loading ? 'Đang tải...' : `${filteredSuppliers.length} bản ghi`}</p>
        <div className="ad-table-wrap">
          <table className="ad-brand-table ad-supplier-table">
            <thead><tr><th>STT</th><th>MÃ NHÀ CUNG CẤP</th><th>TÊN NHÀ CUNG CẤP</th><th>ĐỊA CHỈ</th><th>ĐIỆN THOẠI</th><th>THAO TÁC</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="6" className="ad-table-empty">Đang tải dữ liệu...</td></tr>
                : pageSuppliers.length ? pageSuppliers.map((supplier, index) => (
                  <tr key={supplier.code}>
                    <td className="ad-brand-index">{(supplierSafePage - 1) * pageSize + index + 1}</td>
                    <td className="ad-brand-code">{supplier.code}</td>
                    <td>{supplier.name}</td>
                    <td>{supplier.address || '—'}</td>
                    <td>{supplier.phone || '—'}</td>
                    <td className="ad-brand-row-actions">
                      <button className="ad-button ad-button-edit" type="button" title="Sửa nhà cung cấp" onClick={() => openEdit(supplier)}><FontAwesomeIcon icon={faPen} /><span>Sửa</span></button>
                      <button className="ad-button ad-button-delete" type="button" title="Xóa nhà cung cấp" onClick={() => setDeleteTarget(supplier)}><FontAwesomeIcon icon={faTrash} /><span>Xóa</span></button>
                    </td>
                  </tr>
                )) : <tr><td colSpan="6" className="ad-table-empty">Chưa có nhà cung cấp phù hợp.</td></tr>}
            </tbody>
          </table>
          {!loading && !filteredSuppliers.length && (
            <EmptyState
              title="Chưa có nhà cung cấp nào"
              hint="Bấm Thêm mới để tạo nhà cung cấp đầu tiên"
              actionLabel="Thêm mới"
              onAction={openCreate}
            />
          )}
        </div>
        <Pagination
          page={supplierSafePage} pageSize={pageSize} total={filteredSuppliers.length}
          onPage={setPage}
          onPageSize={(size) => { setPageSize(size); setPage(1); }}
          onRefresh={loadSuppliers}
        />
        {deleteTarget && (
          <ConfirmModal
            message={<>Bạn có chắc muốn xóa nhà cung cấp <strong>{deleteTarget.name} ({deleteTarget.code})</strong>?</>}
            onCancel={() => setDeleteTarget(null)}
            onConfirm={() => removeSupplier(deleteTarget)}
          />
        )}
      </section>

      {dialog && <div className="ad-dialog-backdrop" onMouseDown={(event) => {
        if (event.target === event.currentTarget) setDialog(null);
      }}>
        <form className="ad-brand-dialog ad-supplier-dialog" onSubmit={saveSupplier}>
          <div className="ad-dialog-heading">
            <h2>{dialog.mode === 'create' ? 'Thêm nhà cung cấp' : 'Cập nhật nhà cung cấp'}</h2>
            <button className="ad-icon-button" type="button" aria-label="Đóng" onClick={() => setDialog(null)}><FontAwesomeIcon icon={faXmark} /></button>
          </div>
          <label>Mã nhà cung cấp
            <input required maxLength="20" disabled={dialog.mode === 'edit'} value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })} placeholder="Ví dụ: NCC_MOI_01" />
          </label>
          <label>Tên nhà cung cấp
            <input required maxLength="150" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Nhập tên nhà cung cấp" />
          </label>
          <label>Địa chỉ
            <input maxLength="255" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} placeholder="Nhập địa chỉ" />
          </label>
          <label>Điện thoại
            <input type="tel" maxLength="30" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="Nhập số điện thoại" />
          </label>
          {error && <p className="ad-brand-message" role="alert">{error}</p>}
          <div className="ad-dialog-actions">
            <button className="ad-button ad-button-quiet" type="button" onClick={() => setDialog(null)}>Hủy</button>
            <button className="ad-button ad-button-primary" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu nhà cung cấp'}</button>
          </div>
        </form>
      </div>}
    </div>
  );
}