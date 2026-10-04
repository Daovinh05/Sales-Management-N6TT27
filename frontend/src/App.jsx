import { useCallback, useEffect, useState } from 'react';
import './styles/theme.css';
import './styles/customer.css';
import './styles/admin.css';
import { AuthProvider, useAuth } from './store/auth.jsx';
import { Header, Footer } from './layouts/ShopLayout.jsx';
import { TopBanner, CustomerHeader } from './components/shop/CustomerHeader.jsx';
import CartSidebar from './components/shop/CartSidebar.jsx';
import Home from './pages/shop/Home.jsx';
import CustomerHome from './pages/shop/CustomerHome.jsx';
import ProductDetail from './pages/shop/ProductDetail.jsx';
import CustomerProfile from './pages/shop/CustomerProfile.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import { LoginModal, RegisterModal } from './components/auth/AuthModal.jsx';
import AppToast from './components/common/AppToast.jsx';

const isAdmin = (u) => u?.roles?.includes('ROLE_ADMIN');

function Landing({ notify, toasts }) {
  const [modal, setModal] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [query, setQuery] = useState('');

  return (
    <>
      <AppToast toasts={toasts} />
      <Header
        cartCount={cartCount}
        onSearch={setQuery}
        onCart={() => { setModal('login'); notify('warning', 'Vui lòng đăng nhập để xem giỏ hàng'); }}
        onLogin={() => setModal('login')}
        onRegister={() => setModal('register')}
      />
      <Home
        query={query}
        onCta={() => setModal('login')}
        onAdd={() => { setModal('login'); notify('warning', 'Vui lòng đăng nhập để mua hàng'); }}
      />
      <Footer />
      {modal === 'login' && <LoginModal onClose={() => setModal(null)} onSwitch={() => setModal('register')} />}
      {modal === 'register' && <RegisterModal onClose={() => setModal(null)} onSwitch={() => setModal('login')} notify={notify} />}
    </>
  );
}

const parseHash = () => {
  const hash = window.location.hash || '';
  if (hash === '#/account') return { profile: true, product: null };
  const match = hash.match(/^#\/product\/(.+)$/);
  return { profile: false, product: match ? decodeURIComponent(match[1]) : null };
};

function Shop({ notify, toasts }) {
  const [cartOpen, setCartOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(() => parseHash().profile);
  const [productCode, setProductCode] = useState(() => parseHash().product);
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const syncRoute = () => {
      const route = parseHash();
      setShowProfile(route.profile);
      setProductCode(route.product);
    };
    window.addEventListener('hashchange', syncRoute);
    return () => window.removeEventListener('hashchange', syncRoute);
  }, []);

  const openProfile = () => {
    if (window.location.hash === '#/account') setShowProfile(true);
    else window.location.hash = '/account';
  };

  const closeProfile = () => {
    if (window.location.hash === '#/account') window.location.hash = '';
    else setShowProfile(false);
  };

  const buy = (p, qty = 1) => {
    const want = Math.max(1, qty);
    if (p.stock <= 0) { notify('error', 'Không đủ tồn kho, còn 0'); return; }
    setItems((its) => {
      const ex = its.find((i) => i.id === p.id);
      const inCart = ex ? ex.qty : 0;
      if (inCart + want > p.stock) { notify('error', `Không đủ tồn kho, còn ${p.stock}`); return its; }
      notify('success', `Đã thêm ${p.name} vào giỏ`);
      if (ex) return its.map((i) => (i.id === p.id ? { ...i, qty: i.qty + want } : i));
      return [...its, { id: p.id, name: p.name, brandName: p.brandName, img: p.img, price: p.sale ?? p.price, qty: want }];
    });
    setCartOpen(true);
  };

  const viewProduct = (code) => {
    if (!code) return;
    window.location.hash = `/product/${encodeURIComponent(code)}`;
  };

  const backHome = () => {
    if (window.location.hash) window.location.hash = '';
    else { setProductCode(null); setShowProfile(false); }
  };

  return (
    <>
      <AppToast toasts={toasts} />
      <TopBanner />
      <CustomerHeader
        cartCount={items.reduce((s, i) => s + i.qty, 0)}
        onSearch={setQuery}
        onCart={() => setCartOpen(true)}
        onAccount={openProfile}
      />
      {showProfile
        ? <CustomerProfile onBack={closeProfile} notify={notify} />
        : productCode
          ? <ProductDetail code={productCode} onAdd={buy} onBuyNow={buy} onBack={backHome} onView={viewProduct} notify={notify} />
          : <CustomerHome query={query} onBuy={(p) => buy(p, 1)} onView={viewProduct} />}
      <Footer />
      <CartSidebar
        open={cartOpen} items={items}
        onClose={() => setCartOpen(false)}
        onRemove={(i) => setItems((its) => its.filter((_, x) => x !== i))}
      />
    </>
  );
}

function Root({ notify, toasts }) {
  const { user } = useAuth();
  if (!user) return <Landing notify={notify} toasts={toasts} />;
  if (isAdmin(user)) return <AdminLayout notify={notify} toasts={toasts} />;
  return <Shop notify={notify} toasts={toasts} />;
}

export default function App() {
  const [toasts, setToasts] = useState([]);
  const notify = useCallback((type, message) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);

  return (
    <AuthProvider notify={notify}>
      <Root notify={notify} toasts={toasts} />
    </AuthProvider>
  );
}
