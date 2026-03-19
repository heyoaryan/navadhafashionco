import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { ToastProvider } from './contexts/ToastContext';
import Layout from './components/Layout';
import ScrollToTop from './components/ScrollToTop';
import NetworkStatus from './components/NetworkStatus';
import LoadingState from './components/LoadingState';
import CookieConsent from './components/CookieConsent';

// Eagerly loaded (critical path)
import Home from './pages/Home';
import Auth from './pages/Auth';
import AuthCallback from './pages/AuthCallback';

// Lazy loaded - user pages
const Shop = lazy(() => import('./pages/Shop'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Account = lazy(() => import('./pages/Account'));
const Profile = lazy(() => import('./pages/account/Profile'));
const Addresses = lazy(() => import('./pages/account/Addresses'));
const Orders = lazy(() => import('./pages/account/Orders'));
const OrderDetail = lazy(() => import('./pages/account/OrderDetail'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const BestSellers = lazy(() => import('./pages/BestSellers'));
const Boutique = lazy(() => import('./pages/Boutique'));
const BoutiqueReadyMade = lazy(() => import('./pages/BoutiqueReadyMade'));
const BoutiqueCustomization = lazy(() => import('./pages/BoutiqueCustomization'));

// Lazy loaded - men's pages
const MenCasuals = lazy(() => import('./pages/men/Casuals'));
const MenWorkwear = lazy(() => import('./pages/men/Workwear'));
const MenEthnic = lazy(() => import('./pages/men/Ethnic'));
const MenGymAttire = lazy(() => import('./pages/men/GymAttire'));
const MenSummerCollection = lazy(() => import('./pages/men/SummerCollection'));
const MenWinterCollection = lazy(() => import('./pages/men/WinterCollection'));

// Lazy loaded - women's pages
const WomenWestern = lazy(() => import('./pages/women/Western'));
const WomenIndoWestern = lazy(() => import('./pages/women/IndoWestern'));
const WomenEthnics = lazy(() => import('./pages/women/Ethnics'));
const WomenCasuals = lazy(() => import('./pages/women/Casuals'));
const WomenWorkwear = lazy(() => import('./pages/women/Workwear'));
const WomenGymAttire = lazy(() => import('./pages/women/GymAttire'));
const WomenSummerCollection = lazy(() => import('./pages/women/SummerCollection'));
const WomenWinterCollection = lazy(() => import('./pages/women/WinterCollection'));

// Lazy loaded - static pages
const About = lazy(() => import('./pages/About'));
const Shipping = lazy(() => import('./pages/Shipping'));
const Returns = lazy(() => import('./pages/Returns'));
const FAQ = lazy(() => import('./pages/FAQ'));
const Contact = lazy(() => import('./pages/Contact'));
const Sustainability = lazy(() => import('./pages/Sustainability'));
const SizeGuide = lazy(() => import('./pages/SizeGuide'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfUse = lazy(() => import('./pages/TermsOfUse'));
const Careers = lazy(() => import('./pages/Careers'));
const StoreCareers = lazy(() => import('./pages/careers/Store'));
const RemoteCareers = lazy(() => import('./pages/careers/Remote'));

// Lazy loaded - admin pages (heavy, rarely visited by most users)
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const Analytics = lazy(() => import('./pages/admin/Analytics'));
const ProductList = lazy(() => import('./pages/admin/ProductList'));
const ProductForm = lazy(() => import('./pages/admin/ProductForm'));
const CouponList = lazy(() => import('./pages/admin/CouponList'));
const OrderList = lazy(() => import('./pages/admin/OrderList'));
const AdminOrderDetail = lazy(() => import('./pages/admin/OrderDetail'));
const CustomerList = lazy(() => import('./pages/admin/CustomerList'));
const ReturnList = lazy(() => import('./pages/admin/ReturnList'));
const AreaAnalytics = lazy(() => import('./pages/admin/AreaAnalytics'));
const JobApplications = lazy(() => import('./pages/admin/JobApplications'));
const JobPositions = lazy(() => import('./pages/admin/JobPositions'));
const AdminCareers = lazy(() => import('./pages/admin/Careers'));
const StockInterest = lazy(() => import('./pages/admin/StockInterest'));

const PageLoader = () => (
  <LoadingState type="page" message="Loading..." variant="spinner" lockScroll={false} />
);

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="flex flex-col items-center justify-center">
          <div className="h-14 w-14 border-4 border-rose-200 dark:border-rose-900 border-t-rose-500 dark:border-t-rose-400 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400 text-base font-medium animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <CartProvider>
      <WishlistProvider>
        <Layout>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/best-sellers" element={<BestSellers />} />
              <Route path="/boutique" element={<Boutique />} />
              <Route path="/boutique/ready-made" element={<BoutiqueReadyMade />} />
              <Route path="/boutique/customization" element={<BoutiqueCustomization />} />

              {/* Men's Routes */}
              <Route path="/men/casuals" element={<MenCasuals />} />
              <Route path="/men/workwear" element={<MenWorkwear />} />
              <Route path="/men/ethnic" element={<MenEthnic />} />
              <Route path="/men/gym-attire" element={<MenGymAttire />} />
              <Route path="/men/summer-collection" element={<MenSummerCollection />} />
              <Route path="/men/winter-collection" element={<MenWinterCollection />} />

              {/* Women's Routes */}
              <Route path="/women/western" element={<WomenWestern />} />
              <Route path="/women/indo-western" element={<WomenIndoWestern />} />
              <Route path="/women/ethnics" element={<WomenEthnics />} />
              <Route path="/women/casuals" element={<WomenCasuals />} />
              <Route path="/women/workwear" element={<WomenWorkwear />} />
              <Route path="/women/gym-attire" element={<WomenGymAttire />} />
              <Route path="/women/summer-collection" element={<WomenSummerCollection />} />
              <Route path="/women/winter-collection" element={<WomenWinterCollection />} />

              <Route path="/product/:slug" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
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
                <Route path="orders/:orderId" element={<AdminOrderDetail />} />
                <Route path="returns" element={<ReturnList />} />
                <Route path="careers" element={<AdminCareers />} />
                <Route path="careers/applications" element={<JobApplications />} />
                <Route path="careers/positions" element={<JobPositions />} />
                <Route path="coupons" element={<CouponList />} />
                <Route path="customers" element={<CustomerList />} />
                <Route path="area-analytics" element={<AreaAnalytics />} />
                <Route path="stock-interest" element={<StockInterest />} />
              </Route>

              <Route path="/about" element={<About />} />
              <Route path="/sustainability" element={<Sustainability />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/shipping" element={<Shipping />} />
              <Route path="/returns" element={<Returns />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/careers/store" element={<StoreCareers />} />
              <Route path="/careers/remote" element={<RemoteCareers />} />
              <Route path="/size-guide" element={<SizeGuide />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfUse />} />
            </Routes>
          </Suspense>
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
            <NetworkStatus />
            <AppContent />
            <CookieConsent />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
