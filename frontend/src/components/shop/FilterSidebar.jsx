import { PRICES } from '../../services/catalog.js';

function Group({ title, name, options, value, onChange }) {
  return (
    <div className="kh-fgroup">
      <h4>{title}</h4>
      {options.map((o) => (
        <label key={o.id + o.name} className="kh-fopt">
          <input
            type="radio" name={name} checked={value === o.id}
            onChange={() => onChange(o.id)}
          />
          <span className="kh-check" />
          {o.name}
        </label>
      ))}
    </div>
  );
}

const DEFAULT_FILTER = { cat: '', price: 'tat-ca', brand: '' };

export function isFilterDefault(f) {
  return !f || (f.cat === DEFAULT_FILTER.cat && f.price === DEFAULT_FILTER.price && f.brand === DEFAULT_FILTER.brand);
}

export default function FilterSidebar({ f, setF, categories, brands }) {
  return (
    <aside className="kh-filter">
      <h3>Bộ lọc</h3>
      <Group title="Danh mục" name="category" options={categories?.length ? categories : [{ id: '', name: 'Tất cả' }]} value={f.cat} onChange={(v) => setF({ ...f, cat: v })} />
      <Group title="Giá" name="price" options={PRICES} value={f.price} onChange={(v) => setF({ ...f, price: v })} />
      <Group title="Thương hiệu" name="brand" options={brands?.length ? brands : [{ id: '', name: 'Tất cả' }]} value={f.brand} onChange={(v) => setF({ ...f, brand: v })} />
      <button
        type="button" className="kh-fclear" disabled={isFilterDefault(f)}
        onClick={() => setF({ ...DEFAULT_FILTER })}
      >
        Xóa bộ lọc
      </button>
    </aside>
  );
}
