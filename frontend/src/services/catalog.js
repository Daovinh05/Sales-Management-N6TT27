export const PRICES = [
  { id: 'tat-ca', name: 'Tất cả' },
  { id: 'duoi-2-trieu', name: 'Dưới 2 triệu' },
  { id: '2-4-trieu', name: '2 - 4 triệu' },
  { id: '4-7-trieu', name: '4 - 7 triệu' },
  { id: '7-13-trieu', name: '7 - 13 triệu' },
  { id: 'tren-13-trieu', name: 'Trên 13 triệu' }
];

export const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n) + ' ₫';
