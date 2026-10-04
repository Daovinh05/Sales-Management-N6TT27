import api from './api.js';
import { resolveImage } from './shop.js';

/** Map 1 dòng giỏ API -> đúng shape UI cũ {id, name, brandName, img, price, qty, stock}. */
export const toCartItem = (it) => ({
  id: it.variantCode,
  variantCode: it.variantCode,
  name: it.variantName ? `${it.productName} - ${it.variantName}` : (it.productName || ''),
  brandName: [it.color, it.storage, it.ram].filter(Boolean).join(' • '),
  img: resolveImage(it.imageUrl),
  price: Number(it.price ?? 0),
  qty: it.quantity ?? 0,
  stock: it.stockQuantity ?? 0,
});

export async function fetchCart() {
  const { data } = await api.get('/cart');
  return {
    items: (data.items || []).map(toCartItem),
    totalItems: data.totalItems ?? 0,
    totalQuantity: data.totalQuantity ?? 0,
    subtotal: Number(data.subtotal ?? 0),
  };
}

export async function addToCart(variantCode, quantity) {
  const { data } = await api.post('/cart', { variantCode, quantity });
  return {
    items: (data.items || []).map(toCartItem),
    totalItems: data.totalItems ?? 0,
    totalQuantity: data.totalQuantity ?? 0,
    subtotal: Number(data.subtotal ?? 0),
  };
}

export async function updateCartQty(variantCode, quantity) {
  const { data } = await api.put(`/cart/${encodeURIComponent(variantCode)}`, { quantity });
  return {
    items: (data.items || []).map(toCartItem),
    totalItems: data.totalItems ?? 0,
    totalQuantity: data.totalQuantity ?? 0,
    subtotal: Number(data.subtotal ?? 0),
  };
}

export async function removeCartItem(variantCode) {
  const { data } = await api.delete(`/cart/${encodeURIComponent(variantCode)}`);
  return {
    items: (data.items || []).map(toCartItem),
    totalItems: data.totalItems ?? 0,
    totalQuantity: data.totalQuantity ?? 0,
    subtotal: Number(data.subtotal ?? 0),
  };
}

export async function clearCart() {
  await api.delete('/cart');
  return { items: [], totalItems: 0, totalQuantity: 0, subtotal: 0 };
}
