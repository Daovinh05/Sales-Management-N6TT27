import { useState } from 'react';
import HeroSlider from '../../components/shop/HeroSlider.jsx';
import ProductCard from '../../components/shop/ProductCard.jsx';

const MOCK = [
  { id: 1, name: 'iPhone 17 Pro Max 256GB Titan', brand: 'Apple', category: 'Điện thoại', price: '34.990.000đ', salePrice: '32.490.000đ', stock: 12, image: 'https://picsum.photos/seed/iphone17-pro/800/800' },
  { id: 2, name: 'MacBook Air M3 13 inch 8GB/256GB', brand: 'Apple', category: 'Laptop', price: '27.990.000đ', salePrice: '24.990.000đ', stock: 3, image: 'https://store.storeimages.cdn-apple.com/8756/as-images.apple.com/is/macbook-air-midnight-select-20220606?wid=904&hei=840&fmt=jpeg&qlt=90&.v=1653084303665' },
  { id: 3, name: 'Samsung Galaxy S25 Ultra 12GB/256GB', brand: 'Samsung', category: 'Điện thoại', price: '29.990.000đ', salePrice: '27.490.000đ', stock: 0, image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?q=80&w=800&auto=format&fit=crop' },
  { id: 4, name: 'Xiaomi 15 5G 12GB/256GB', brand: 'Xiaomi', category: 'Điện thoại', price: '16.990.000đ', salePrice: '15.490.000đ', stock: 20, image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=800&auto=format&fit=crop' }
];

export default function Home({ query, onAdd, onCta }) {
  const q = (query || '').toLowerCase();
  const list = MOCK.filter((p) => !q || p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
  return (
    <>
      <HeroSlider onCta={onCta} />
      <div className="tz-container">
        <div className="tz-sec-title">Sản phẩm nổi bật</div>
        <div className="tz-grid">
          {list.map((p) => <ProductCard key={p.id} p={p} onAdd={onAdd} />)}
        </div>
        {list.length === 0 && <div style={{ padding: 24, color: '#666' }}>Không tìm thấy sản phẩm phù hợp.</div>}
      </div>
    </>
  );
}
