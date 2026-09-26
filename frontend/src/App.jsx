import { useCallback, useState } from 'react';
import './styles/theme.css';
import './styles/customer.css';
import './styles/admin.css';
import { AuthProvider, useAuth } from './store/auth.jsx';
import { Header, Footer } from './layouts/ShopLayout.jsx';
import { TopBanner, CustomerHeader } from './components/shop/CustomerHeader.jsx';
import CartSidebar from './components/shop/CartSidebar.jsx';
import Home from './pages/shop/Home.jsx';
import CustomerHome from './pages/shop/CustomerHome.jsx';
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

function Shop({ notify, toasts }) {
  const [cartOpen, setCartOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');

  const buy = (p) => {
    if (p.stock <= 0) { notify('error', 'Không đủ tồn kho, còn 0'); return; }
    setItems((its) => {
      const ex = its.find((i) => i.id === p.id);
      const inCart = ex ? ex.qty : 0;
      if (inCart + 1 > p.stock) { notify('error', `Không đủ tồn kho, còn ${p.stock}`); return its; }
      notify('success', `Đã thêm ${p.name} vào giỏ`);
      if (ex) return its.map((i) => (i.id === p.id ? { ...i, qty: i.qty + 1 } : i));
      return [...its, { id: p.id, name: p.name, brandName: p.brandName, img: p.img, price: p.sale ?? p.price, qty: 1 }];
    });
    setCartOpen(true);
  };

  return (
    <>
      <AppToast toasts={toasts} />
      <TopBanner />
      <CustomerHeader
        cartCount={items.reduce((s, i) => s + i.qty, 0)}
        onSearch={setQuery}
        onCart={() => setCartOpen(true)}
      />
      <CustomerHome query={query} onBuy={buy} />
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
  if (isAdmin(user)) return <AdminLayout />;
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
