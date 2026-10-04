import api from './api.js';

const API_ROOT = () => (api.defaults.baseURL || '').replace(/\/api$/, '');

export const variantImage = (filename) => (filename
  ? `${API_ROOT()}/uploads/variants/${encodeURIComponent(filename)}`
  : '');

/** Map 1 card API -> đúng shape UI cũ {id, name, brandName, img, price, stock}. */
export const toCard = (p) => ({
  id: p.code,
  code: p.code,
  name: p.name,
  brandName: p.brandName || '',
  img: variantImage(p.imageUrl),
  price: Number(p.price ?? 0),
  stock: p.stockQuantity ?? 0,
});

export async function fetchProducts({ cat = '', brand = '', price = 'tat-ca', search = '', page = 0, size = 8 } = {}) {
  const params = { page, size };
  if (cat) params.category = cat;
  if (brand) params.brand = brand;
  if (price && price !== 'tat-ca') params.price = price;
  if (search?.trim()) params.search = search.trim();
  const { data } = await api.get('/storefront/products', { params });
  return {
    items: (data.content || []).map(toCard),
    total: data.totalElements ?? 0,
    pages: data.totalPages ?? 1,
    page: data.page ?? 0,
  };
}

export async function fetchDetail(code) {
  const { data } = await api.get(`/storefront/products/${encodeURIComponent(code)}`);
  return {
    ...data,
    variants: (data.variants || []).map((v) => ({ ...v, img: variantImage(v.imageUrl) })),
    similar: (data.similar || []).map(toCard),
  };
}

const toOption = (rows, allLabel) => [{ id: '', name: allLabel }, ...rows.map((r) => ({ id: r.code, name: r.name }))];

export async function fetchCategories() {
  const { data } = await api.get('/categories');
  return toOption(Array.isArray(data) ? data : [], 'Tất cả');
}

export async function fetchBrands() {
  const { data } = await api.get('/brands');
  return toOption(Array.isArray(data) ? data : [], 'Tất cả');
}
