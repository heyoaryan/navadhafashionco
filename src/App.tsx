import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { ToastProvider } from './contexts/ToastContext';
import Layout from './components/Layout';
import ScrollToTop from './components/ScrollToTop';
import { usePageTracking } from './hooks/usePageTracking';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Auth from './pages/Auth';
import Account from './pages/Account';
import Profile from './pages/account/Profile';
import Addresses from './pages/account/Addresses';
import Orders from './pages/account/Orders';
import OrderDetail from './pages/account/OrderDetail';
import Wishlist from './pages/Wishlist';
import About from './pages/About';
import Boutique from './pages/Boutique';
import BoutiqueReadyMade from './pages/BoutiqueReadyMade';
import BoutiqueCustomization from './pages/BoutiqueCustomization';
import SizeGuide from './pages/SizeGuide';
import MenCasuals from './pages/men/Casuals';
import MenWorkwear from './pages/men/Workwear';
import MenEthnic from './pages/men/Ethnic';
import MenGymAttire from './pages/men/GymAttire';
import WomenWestern from './pages/women/Western';
import WomenIndoWestern from './pages/women/IndoWestern';
import WomenEthnics from './pages/women/Ethnics';
import WomenCasuals from './pages/women/Casuals';
import WomenWorkwear from './pages/women/Workwear';
import WomenGymAttire from './pages/women/GymAttire';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import Analytics from './pages/admin/Analytics';
import ProductList from './pages/admin/ProductList';
import ProductForm from './pages/admin/ProductForm';
import CouponList from './pages/admin/CouponList';
import OrderList from './pages/admin/OrderList';
import CustomerList from './pages/admin/CustomerList';
import ReturnList from './pages/admin/ReturnList';
import AreaAnalytics from './pages/admin/AreaAnalytics';

function AppContent() {
  const { loading } = useAuth();

  // Track page views
  usePageTracking();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <CartProvider>
      <WishlistProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/boutique" element={<Boutique />} />
            <Route path="/boutique/ready-made" element={<BoutiqueReadyMade />} />
            <Route path="/boutique/customization" element={<BoutiqueCustomization />} />
            
            {/* Men's Routes */}
            <Route path="/men/casuals" element={<MenCasuals />} />
            <Route path="/men/workwear" element={<MenWorkwear />} />
            <Route path="/men/ethnic" element={<MenEthnic />} />
            <Route path="/men/gym-attire" element={<MenGymAttire />} />
            
            {/* Women's Routes */}
            <Route path="/women/western" element={<WomenWestern />} />
            <Route path="/women/indo-western" element={<WomenIndoWestern />} />
            <Route path="/women/ethnics" element={<WomenEthnics />} />
            <Route path="/women/casuals" element={<WomenCasuals />} />
            <Route path="/women/workwear" element={<WomenWorkwear />} />
            <Route path="/women/gym-attire" element={<WomenGymAttire />} />
            
            <Route path="/product/:slug" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/account" element={<Account />} />
            <Route path="/account/profile" element={<Profile />} />
            <Route path="/account/addresses" element={<Addresses />} />
            <Route path="/account/orders" element={<Orders />} />
            <Route path="/account/orders/:orderId" element={<OrderDetail />} />
            <Route path="/wishlist" element={<Wishlist />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="products" element={<ProductList />} />
              <Route path="products/new" element={<ProductForm />} />
              <Route path="products/:id" element={<ProductForm />} />
              <Route path="orders" element={<OrderList />} />
              <Route path="returns" element={<ReturnList />} />
              <Route path="coupons" element={<CouponList />} />
              <Route path="customers" element={<CustomerList />} />
              <Route path="area-analytics" element={<AreaAnalytics />} />
            </Route>

            <Route path="/about" element={<About />} />
            <Route path="/sustainability" element={<About />} />
            <Route path="/contact" element={<About />} />
            <Route path="/faq" element={<About />} />
            <Route path="/shipping" element={<About />} />
            <Route path="/returns" element={<About />} />
            <Route path="/size-guide" element={<SizeGuide />} />
            <Route path="/privacy" element={<About />} />
            <Route path="/terms" element={<About />} />
          </Routes>
        </Layout>
      </WishlistProvider>
    </CartProvider>
  );
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
