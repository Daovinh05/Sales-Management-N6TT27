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
import CartPage from './pages/shop/CartPage.jsx';
import ProductDetail from './pages/shop/ProductDetail.jsx';
import { addToCart, fetchCart, removeCartItem, updateCartQty } from './services/cart.js';
import { fetchDetail } from './services/shop.js';
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
  if (hash === '#/account') return { profile: true, product: null, cart: false };
  if (hash === '#/cart') return { profile: false, product: null, cart: true };
  const match = hash.match(/^#\/product\/(.+)$/);
  return { profile: false, product: match ? decodeURIComponent(match[1]) : null, cart: false };
};

function Shop({ notify, toasts }) {
  const [cartOpen, setCartOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(() => parseHash().profile);
  const [productCode, setProductCode] = useState(() => parseHash().product);
  const [showCart, setShowCart] = useState(() => parseHash().cart);
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const syncRoute = () => {
      const route = parseHash();
      setShowProfile(route.profile);
      setProductCode(route.product);
      setShowCart(route.cart);
    };
    window.addEventListener('hashchange', syncRoute);
    return () => window.removeEventListener('hashchange', syncRoute);
  }, []);

  const reloadCart = useCallback(async () => {
    try {
      setItems((await fetchCart()).items);
    } catch {
      // Chưa đăng nhập hoặc mất mạng: giữ giỏ hiện tại.
    }
  }, []);

  useEffect(() => { reloadCart(); }, [reloadCart]);

  const apiError = (e, fallback) => notify('error', e.response?.data?.message || fallback);

  const openProfile = () => {
    if (window.location.hash === '#/account') setShowProfile(true);
    else window.location.hash = '/account';
  };

  const closeProfile = () => {
    if (window.location.hash === '#/account') window.location.hash = '';
    else setShowProfile(false);
  };

  // p từ card chỉ có mã SP -> resolve biến thể đầu tiên; p từ chi tiết đã có variantCode.
  const buy = async (p, qty = 1) => {
    const want = Math.max(1, qty);
    try {
      let variantCode = p.variantCode;
      let name = p.name;
      if (!variantCode) {
        const detail = await fetchDetail(p.code || p.id);
        const first = (detail.variants || [])[0];
        if (!first) { notify('error', 'Sản phẩm chưa có biến thể'); return; }
        if ((first.stockQuantity ?? 0) <= 0) { notify('error', 'Không đủ tồn kho, còn 0'); return; }
        variantCode = first.code;
        name = detail.name;
      } else if ((p.stock ?? 0) <= 0) {
        notify('error', 'Không đủ tồn kho, còn 0');
        return;
      }
      const cart = await addToCart(variantCode, want);
      setItems(cart.items);
      notify('success', `Đã thêm ${name} vào giỏ`);
      setCartOpen(true);
    } catch (e) {
      apiError(e, 'Không thêm được vào giỏ');
    }
  };

  const changeQty = async (it, qty) => {
    const want = Math.max(1, qty);
    if (want > it.stock) { notify('error', `Không đủ tồn kho, còn ${it.stock}`); return; }
    try {
      setItems((await updateCartQty(it.variantCode, want)).items);
    } catch (e) {
      apiError(e, 'Không cập nhật được số lượng');
    }
  };

  const removeItem = async (it) => {
    try {
      setItems((await removeCartItem(it.variantCode)).items);
    } catch (e) {
      apiError(e, 'Không xóa được sản phẩm');
    }
  };

  const viewProduct = (code) => {
    if (!code) return;
    window.location.hash = `/product/${encodeURIComponent(code)}`;
  };

  const backHome = () => {
    if (window.location.hash) window.location.hash = '';
    else { setProductCode(null); setShowProfile(false); setShowCart(false); }
  };

  const openCartPage = () => {
    setCartOpen(false);
    if (window.location.hash === '#/cart') setShowCart(true);
    else window.location.hash = '/cart';
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
        : showCart
          ? <CartPage notify={notify} onBack={backHome} onChanged={setItems} />
          : productCode
            ? <ProductDetail code={productCode} onAdd={buy} onBuyNow={buy} onBack={backHome} onView={viewProduct} notify={notify} />
            : <CustomerHome query={query} onBuy={(p) => buy(p, 1)} onView={viewProduct} />}
      <Footer />
      <CartSidebar
        open={cartOpen} items={items}
        onClose={() => setCartOpen(false)}
        onQty={changeQty}
        onRemove={removeItem}
        onViewCart={openCartPage}
        onCheckout={() => { setCartOpen(false); notify('warning', 'Thanh toán sẽ làm ở phase đặt hàng'); }}
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
