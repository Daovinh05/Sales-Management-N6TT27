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
import Checkout from './pages/shop/Checkout.jsx';
import OrderSuccess from './pages/shop/OrderSuccess.jsx';
import OrderHistory from './pages/shop/OrderHistory.jsx';
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
  if (hash === '#/account') return { profile: true, product: null, cart: false, checkout: false, success: false, history: false };
  if (hash === '#/cart') return { profile: false, product: null, cart: true, checkout: false, success: false, history: false };
  if (hash === '#/thanh-toan') return { profile: false, product: null, cart: false, checkout: true, success: false, history: false };
  if (hash === '#/dat-hang-thanh-cong') return { profile: false, product: null, cart: false, checkout: false, success: true, history: false };
  if (hash === '#/lich-su-don-hang') return { profile: false, product: null, cart: false, checkout: false, success: false, history: true };
  const match = hash.match(/^#\/product\/(.+)$/);
  return { profile: false, product: match ? decodeURIComponent(match[1]) : null, cart: false, checkout: false, success: false, history: false };
};

function Shop({ notify, toasts }) {
  const [cartOpen, setCartOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(() => parseHash().profile);
  const [productCode, setProductCode] = useState(() => parseHash().product);
  const [showCart, setShowCart] = useState(() => parseHash().cart);
  const [showCheckout, setShowCheckout] = useState(() => parseHash().checkout);
  const [showSuccess, setShowSuccess] = useState(() => parseHash().success);
  const [showHistory, setShowHistory] = useState(() => parseHash().history);
  const [lastOrderCode, setLastOrderCode] = useState(() => sessionStorage.getItem('last-order') || '');
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const syncRoute = () => {
      const route = parseHash();
      setShowProfile(route.profile);
      setProductCode(route.product);
      setShowCart(route.cart);
      setShowCheckout(route.checkout);
      setShowSuccess(route.success);
      setShowHistory(route.history);
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
    else { setProductCode(null); setShowProfile(false); setShowCart(false); setShowCheckout(false); setShowSuccess(false); setShowHistory(false); }
  };

  // Logo TECHZONE: luôn về trang chủ, xóa query tìm kiếm.
  const goHome = () => {
    setQuery('');
    backHome();
  };

  const openCartPage = () => {
    setCartOpen(false);
    if (window.location.hash === '#/cart') setShowCart(true);
    else window.location.hash = '/cart';
  };

  // Submit từ ô search: đang ở trang khác thì về home trước rồi mới lọc (đúng kiểu PHP redirect về ?q=).
  const submitSearch = (word) => {
    if (window.location.hash) {
      window.location.hash = '';
      setProductCode(null);
      setShowProfile(false);
      setShowCart(false);
      setShowCheckout(false);
      setShowSuccess(false);
      setShowHistory(false);
    }
    setQuery(word || '');
  };

  const readCheckoutItems = () => {
    try {
      const parsed = JSON.parse(sessionStorage.getItem('checkout-items') || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  // Mua ngay: resolve biến thể rồi nhảy thẳng sang màn hình thanh toán.
  const buyNow = async (p, qty = 1) => {
    const want = Math.max(1, qty);
    try {
      let variantCode = p.variantCode;
      let name = p.name;
      let price = p.price;
      let img = p.img;
      let brandName = p.brandName;
      if (!variantCode) {
        const detail = await fetchDetail(p.code || p.id);
        const first = (detail.variants || [])[0];
        if (!first) { notify('error', 'Sản phẩm chưa có biến thể'); return; }
        if ((first.stockQuantity ?? 0) <= 0) { notify('error', 'Không đủ tồn kho, còn 0'); return; }
        variantCode = first.code;
        name = `${detail.name} - ${first.name || ''}`.trim();
        price = Number(first.price ?? detail.price ?? 0);
        img = first.img;
        brandName = [first.color, first.storage, first.ram].filter(Boolean).join(' • ');
      } else if ((p.stock ?? 0) <= 0) {
        notify('error', 'Không đủ tồn kho, còn 0');
        return;
      }
      sessionStorage.setItem('checkout-items', JSON.stringify([
        { id: variantCode, variantCode, name, brandName, img, price, qty: want }
      ]));
      setCartOpen(false);
      if (window.location.hash === '#/thanh-toan') setShowCheckout(true);
      else window.location.hash = '/thanh-toan';
    } catch (e) {
      apiError(e, 'Không mở được màn hình thanh toán');
    }
  };

  const checkoutCart = () => {
    if (!items.length) return;
    checkoutItems(items);
  };

  const checkoutItems = (list) => {
    if (!list.length) return;
    sessionStorage.setItem('checkout-items', JSON.stringify(list));
    setCartOpen(false);
    if (window.location.hash === '#/thanh-toan') setShowCheckout(true);
    else window.location.hash = '/thanh-toan';
  };

  const handlePlaced = async (order) => {
    try {
      const { clearCart } = await import('./services/cart.js');
      await clearCart();
    } catch {
      // Đặt hàng đã thành công, lỗi xóa giỏ không chặn luồng.
    }
    sessionStorage.removeItem('checkout-items');
    if (order?.code) {
      sessionStorage.setItem('last-order', order.code);
      setLastOrderCode(order.code);
    }
    await reloadCart();
    if (window.location.hash === '#/dat-hang-thanh-cong') setShowSuccess(true);
    else window.location.hash = '/dat-hang-thanh-cong';
  };

  return (
    <>
      <AppToast toasts={toasts} />
      <TopBanner />
      <CustomerHeader
        cartCount={items.reduce((s, i) => s + i.qty, 0)}
        onSearch={setQuery}
        onSubmitSearch={submitSearch}
        onView={viewProduct}
        onCart={() => setCartOpen(true)}
        onAccount={openProfile}
        onHome={goHome}
      />
      {showProfile
        ? <CustomerProfile onBack={closeProfile} notify={notify} />
        : showCart
          ? <CartPage notify={notify} onBack={backHome} onChanged={setItems} onCheckout={checkoutItems} />
          : showCheckout
            ? <Checkout items={readCheckoutItems()} notify={notify} onPlaced={handlePlaced} onBack={backHome} />
            : showSuccess
              ? <OrderSuccess code={lastOrderCode} onHome={backHome} onHistory={() => { window.location.hash = '/lich-su-don-hang'; }} />
              : showHistory
                ? <OrderHistory notify={notify} onBack={backHome} />
                : productCode
              ? <ProductDetail code={productCode} onAdd={buy} onBuyNow={buyNow} onBack={backHome} onView={viewProduct} notify={notify} />
              : <CustomerHome query={query} onBuy={(p) => buyNow(p, 1)} onView={viewProduct} />}
      <Footer />
      <CartSidebar
        open={cartOpen} items={items}
        onClose={() => setCartOpen(false)}
        onQty={changeQty}
        onRemove={removeItem}
        onViewCart={openCartPage}
        onCheckout={checkoutCart}
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
