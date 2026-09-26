export const CATEGORIES = [
  { id: '', name: 'Tất cả' },
  { id: 'DM01', name: 'Điện thoại' },
  { id: 'DM9', name: 'Iphone' },
  { id: 'DM06', name: 'Macbook' },
  { id: 'DM07', name: 'Laptop Gaming' },
  { id: 'DM08', name: 'Tai nghe' },
  { id: 'DM09', name: 'Sạc dự phòng' }
];

export const PRICES = [
  { id: 'tat-ca', name: 'Tất cả' },
  { id: 'duoi-2-trieu', name: 'Dưới 2 triệu' },
  { id: '2-4-trieu', name: '2 - 4 triệu' },
  { id: '4-7-trieu', name: '4 - 7 triệu' },
  { id: '7-13-trieu', name: '7 - 13 triệu' },
  { id: 'tren-13-trieu', name: 'Trên 13 triệu' }
];

export const BRANDS = [
  { id: '', name: 'Tất cả' },
  { id: 'TH01', name: 'Apple' },
  { id: 'TH02', name: 'Samsung' },
  { id: 'TH03', name: 'Xiaomi' },
  { id: 'TH07', name: 'Sony' },
  { id: 'TH06', name: 'Asus' },
  { id: 'TH11', name: 'Anker' }
];

// Giá số (đ) để lọc + hiển thị chuỗi như web cũ
export const PRODUCTS = [
  { id: 'SP01', name: 'iPhone 17 Pro Max 256GB Titan', cat: 'DM9', brand: 'TH01', brandName: 'Apple', price: 34990000, sale: 32490000, stock: 12, img: 'https://tse2.mm.bing.net/th/id/OIP.pEZyO8D2oWi6Jft18J2wHAHaJQ?rs=1&pid=ImgDetMain&o=7&rm=3' },
  { id: 'SP02', name: 'MacBook Air M3 13 inch 8GB/256GB', cat: 'DM06', brand: 'TH01', brandName: 'Apple', price: 27990000, sale: 24990000, stock: 3, img: 'https://store.storeimages.cdn-apple.com/8756/as-images.apple.com/is/macbook-air-midnight-select-20220606?wid=904&hei=840&fmt=jpeg&qlt=90&.v=1653084303665' },
  { id: 'SP03', name: 'Samsung Galaxy S25 Ultra 12GB/256GB', cat: 'DM01', brand: 'TH02', brandName: 'Samsung', price: 29990000, sale: 27490000, stock: 0, img: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?q=80&w=800&auto=format&fit=crop' },
  { id: 'SP04', name: 'Xiaomi 15 5G 12GB/256GB', cat: 'DM01', brand: 'TH03', brandName: 'Xiaomi', price: 16990000, sale: 15490000, stock: 20, img: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=800&auto=format&fit=crop' },
  { id: 'SP05', name: 'Tai nghe Sony WH-1000XM5 chống ồn', cat: 'DM08', brand: 'TH07', brandName: 'Sony', price: 8990000, sale: 7490000, stock: 15, img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop' },
  { id: 'SP06', name: 'Sạc dự phòng Anker 20000mAh 22.5W', cat: 'DM09', brand: 'TH11', brandName: 'Anker', price: 1290000, sale: 990000, stock: 40, img: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?q=80&w=800&auto=format&fit=crop' },
  { id: 'SP07', name: 'Laptop Gaming Asus ROG Strix G15 R7/RTX4050', cat: 'DM07', brand: 'TH06', brandName: 'Asus', price: 28990000, sale: 26490000, stock: 5, img: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?q=80&w=800&auto=format&fit=crop' },
  { id: 'SP08', name: 'iPhone 16 128GB chính hãng', cat: 'DM9', brand: 'TH01', brandName: 'Apple', price: 22990000, sale: 21490000, stock: 8, img: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?q=80&w=800&auto=format&fit=crop' },
  { id: 'SP09', name: 'Samsung Galaxy Z Flip 6 5G', cat: 'DM01', brand: 'TH02', brandName: 'Samsung', price: 26990000, sale: null, stock: 6, img: 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?q=80&w=800&auto=format&fit=crop' },
  { id: 'SP10', name: 'Xiaomi Redmi Note 14 Pro 8GB/256GB', cat: 'DM01', brand: 'TH03', brandName: 'Xiaomi', price: 7490000, sale: 6990000, stock: 25, img: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=800&auto=format&fit=crop' },
  { id: 'SP11', name: 'Tai nghe AirPods Pro 2 USB-C', cat: 'DM08', brand: 'TH01', brandName: 'Apple', price: 6290000, sale: 5490000, stock: 0, img: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?q=80&w=800&auto=format&fit=crop' },
  { id: 'SP12', name: 'MacBook Pro M4 14 inch 16GB/512GB', cat: 'DM06', brand: 'TH01', brandName: 'Apple', price: 52990000, sale: 50990000, stock: 4, img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=800&auto=format&fit=crop' }
];

export const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n) + ' ₫';

export function matchPrice(p, range) {
  const v = p.sale ?? p.price;
  switch (range) {
    case 'duoi-2-trieu': return v < 2000000;
    case '2-4-trieu': return v >= 2000000 && v < 4000000;
    case '4-7-trieu': return v >= 4000000 && v < 7000000;
    case '7-13-trieu': return v >= 7000000 && v < 13000000;
    case 'tren-13-trieu': return v >= 13000000;
    default: return true;
  }
}
