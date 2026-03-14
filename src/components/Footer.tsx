import { Link } from 'react-router-dom';
import { Instagram, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 sm:gap-8 mb-8">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-3 sm:mb-4">
              <h3 className="brand-logo text-lg sm:text-xl leading-tight mb-1 text-center" style={{ color: '#EE458F' }}>
                NAVADHA
              </h3>
              <p className="text-[0.6rem] sm:text-[0.65rem] font-light tracking-[0.25em] text-center" style={{ color: '#EE458F' }}>
                FASHION CO
              </p>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed text-center">
              Where elegance meets contemporary style. Crafting timeless pieces for the modern woman.
            </p>
          </div>

          <div>
            <h4 className="font-medium mb-3 sm:mb-4 text-sm sm:text-base">Shop</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
              <li>
                <Link to="/shop?filter=new" className="text-gray-600 dark:text-gray-400 hover:text-rose-400 transition-colors">
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link to="/shop" className="text-gray-600 dark:text-gray-400 hover:text-rose-400 transition-colors">
                  Collections
                </Link>
              </li>
              <li>
                <Link to="/boutique" className="text-gray-600 dark:text-gray-400 hover:text-rose-400 transition-colors">
                  Boutique
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-3 sm:mb-4 text-sm sm:text-base">Company</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
              <li>
                <Link to="/about" className="text-gray-600 dark:text-gray-400 hover:text-rose-400 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/sustainability" className="text-gray-600 dark:text-gray-400 hover:text-rose-400 transition-colors">
                  Sustainability
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-600 dark:text-gray-400 hover:text-rose-400 transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-3 sm:mb-4 text-sm sm:text-base">Join Our Team</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
              <li>
                <Link to="/careers" className="text-gray-600 dark:text-gray-400 hover:text-rose-400 transition-colors">
                  All Positions
                </Link>
              </li>
              <li>
                <Link to="/careers/store" className="text-gray-600 dark:text-gray-400 hover:text-rose-400 transition-colors">
                  Store
                </Link>
              </li>
              <li>
                <Link to="/careers/remote" className="text-gray-600 dark:text-gray-400 hover:text-rose-400 transition-colors">
                  Remote
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-3 sm:mb-4 text-sm sm:text-base">Help</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
              <li>
                <Link to="/faq" className="text-gray-600 dark:text-gray-400 hover:text-rose-400 transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="text-gray-600 dark:text-gray-400 hover:text-rose-400 transition-colors">
                  Shipping
                </Link>
              </li>
              <li>
                <Link to="/returns" className="text-gray-600 dark:text-gray-400 hover:text-rose-400 transition-colors">
                  Returns
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 pt-6 sm:pt-8 flex flex-col gap-4 sm:gap-6">
          <div className="flex items-center justify-center gap-6">
            <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-rose-400 transition-colors">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="mailto:navadhafashionco@gmail.com" className="text-gray-600 dark:text-gray-400 hover:text-rose-400 transition-colors">
              <Mail className="w-5 h-5" />
            </a>
          </div>

          <div className="flex flex-row items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            <Link to="/privacy" className="hover:text-rose-400 transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-rose-400 transition-colors">
              Terms of Service
            </Link>
          </div>

          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center">
            © 2026 Navadha Fashion Co. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
