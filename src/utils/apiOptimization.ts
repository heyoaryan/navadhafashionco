// API Optimization utilities to reduce Supabase egress

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CacheItem {
  data: any;
  timestamp: number;
}

// Cache manager
class CacheManager {
  private cache: Map<string, CacheItem> = new Map();

  set(key: string, data: any) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check if cache is still valid
    if (Date.now() - item.timestamp > CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear() {
    this.cache.clear();
  }
}

export const apiCache = new CacheManager();

// Optimized query builder
export const optimizedSelect = {
  // Minimal product fields for listing
  productList: 'id, name, slug, price, compare_at_price, main_image_url, is_active',
  
  // Product card fields
  productCard: 'id, name, slug, price, compare_at_price, main_image_url, stock_quantity',
  
  // Product detail (full data)
  productDetail: '*',
  
  // Order list
  orderList: 'id, order_number, total, status, payment_status, created_at',
};

// Debounce function to reduce API calls
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle function to limit API call frequency
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
