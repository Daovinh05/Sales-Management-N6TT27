import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

const SLIDES = [
  {
    cls: 'tz-s1', theme: 'tz-light', watermark: 'TITAN', tag: 'PRE-ORDER NOW', tagCls: 'tz-tag-light',
    title: 'IPHONE 17 PRO MAX', desc: 'Thiết kế Titan Ultra hoàn toàn mới. Chip A19 Bionic đỉnh cao. Camera AI 100MP thế hệ mới.',
    cta: 'ĐẶT TRƯỚC NGAY', btn: 'tz-btn-primary',
    img: '/images/iphone-17-pro-max.png'
  },
    {
    cls: 'tz-s2', theme: 'tz-dark', watermark: 'GALAXY', tag: 'ĐIỆN THOẠI MỚI', tagCls: 'tz-tag-dark',
    title: 'SAMSUNG GALAXY S25 ULTRA', desc: 'Thiết kế titanium cao cấp. Galaxy AI thế hệ mới. Camera 200MP sắc nét.',
    cta: 'KHÁM PHÁ NGAY', btn: 'tz-btn-dark',
    img: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?q=80&w=1200&auto=format&fit=crop'
  },
  {
    cls: 'tz-s3', theme: 'tz-light', watermark: 'XIAOMI', tag: 'ĐIỆN THOẠI MỚI', tagCls: 'tz-tag-light',
    title: 'XIAOMI 15 5G', desc: 'Hiệu năng flagship thế hệ mới. Camera Leica sắc nét, thiết kế cao cấp.',
    cta: 'ĐĂNG KÝ NHẬN TIN', btn: 'tz-btn-primary',
    img: '/images/xiaomi-15.png'
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
