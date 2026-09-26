import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

const SLIDES = [
  {
    cls: 'tz-s1', theme: 'tz-light', watermark: 'TITAN', tag: 'PRE-ORDER NOW', tagCls: 'tz-tag-light',
    title: 'IPHONE 17 PRO MAX', desc: 'Thiết kế Titan Ultra hoàn toàn mới. Chip A19 Bionic đỉnh cao. Camera AI 100MP thế hệ mới.',
    cta: 'ĐẶT TRƯỚC NGAY', btn: 'tz-btn-primary',
    img: 'https://tse2.mm.bing.net/th/id/OIP.pEZyO8D2oWi6Jft18J2wHAHaJQ?rs=1&pid=ImgDetMain&o=7&rm=3'
  },
  {
    cls: 'tz-s2', theme: 'tz-dark', watermark: 'MACBOOK', tag: 'BACK TO SCHOOL', tagCls: 'tz-tag-dark',
    title: 'MACBOOK AIR M3', desc: 'Siêu mỏng nhẹ. Hiệu năng M3 vượt trội. Thời lượng pin cả ngày dài.',
    cta: 'XEM ƯU ĐÃI SV', btn: 'tz-btn-dark',
    img: 'https://store.storeimages.cdn-apple.com/8756/as-images.apple.com/is/macbook-air-midnight-select-20220606?wid=904&hei=840&fmt=jpeg&qlt=90&.v=1653084303665'
  },
  {
    cls: 'tz-s3', theme: 'tz-light', watermark: 'GALAXY', tag: 'COMING SOON', tagCls: 'tz-tag-light',
    title: 'SAMSUNG GALAXY S25 ULTRA', desc: 'Kỷ nguyên Galaxy AI mới. Khung viền Titan. Camera Mắt Thần Bóng Đêm 200MP.',
    cta: 'ĐĂNG KÝ NHẬN TIN', btn: 'tz-btn-primary',
    img: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?q=80&w=800&auto=format&fit=crop'
  }
];

export default function HeroSlider({ onCta }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % SLIDES.length), 3000);
    return () => clearInterval(t);
  }, []);
  const move = (d) => setIdx((i) => (i + d + SLIDES.length) % SLIDES.length);

  return (
    <section className="tz-hero">
      {SLIDES.map((s, i) => (
        <div key={s.title} className={`tz-slide ${s.cls} ${i === idx ? 'active' : ''}`}>
          <div className={`tz-banner ${s.theme}`}>
            <div className="tz-btext">
              <h1>{s.watermark}</h1>
              <div className={`tz-tag ${s.tagCls}`}>{s.tag}</div>
              <h2>{s.title}</h2>
              <p>{s.desc}</p>
              <button className={s.btn} onClick={onCta}>{s.cta}</button>
            </div>
            <div className="tz-bimg" style={{ backgroundImage: `url('${s.img}')` }} />
          </div>
          <button className={`tz-sbtn tz-prev ${s.theme === 'tz-light' ? 'light' : 'dark'}`} onClick={() => move(-1)}>
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <button className={`tz-sbtn tz-next ${s.theme === 'tz-light' ? 'light' : 'dark'}`} onClick={() => move(1)}>
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      ))}
    </section>
  );
}
