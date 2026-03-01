export type UserRole = 'customer' | 'admin';
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type DiscountType = 'percentage' | 'fixed';
export type ReturnStatus = 'pending' | 'approved' | 'rejected' | 'refunded' | 'completed';
export type ReturnReason = 'defective' | 'wrong_item' | 'not_as_described' | 'size_issue' | 'changed_mind' | 'other';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  return_count?: number;
  total_returns_value?: number;
  is_blacklisted?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Blacklist {
  id: string;
  entity_type: 'customer' | 'area';
  entity_id?: string;
  area_pincode?: string;
  area_city?: string;
  area_state?: string;
  reason: string;
  blacklisted_by?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  customer?: Profile;
}

export interface CustomerReturnStats {
  customer_id: string;
  customer_name: string;
  customer_email: string;
  total_returns: number;
  total_return_value: number;
  return_rate: number;
  most_common_reason: string;
  is_blacklisted: boolean;
}

export interface AreaReturnStats {
  area: string;
  pincode?: string;
  city?: string;
  state?: string;
  total_returns: number;
  total_customers: number;
  return_rate: number;
  is_blacklisted: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  cost_per_item: number | null;
  category: string | null;
  subcategory: string | null;
  gender: 'men' | 'women' | null;
  category_id: string | null;
  sku: string | null;
  barcode: string | null;
  stock_quantity: number;
  low_stock_threshold: number;
  sizes: string[];
  colors: Array<{ name: string; hex: string }>;
  main_image_url: string | null;
  is_featured: boolean;
  is_active: boolean;
  tags: string[];
  meta_title: string | null;
  meta_description: string | null;
  fabric_details: string | null;
  care_instructions: string | null;
  video_url: string | null;
  season: 'summer' | 'winter' | 'all-season' | null;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  alt_text: string | null;
  display_order: number;
  created_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  is_verified_purchase: boolean;
  is_approved: boolean;
  created_at: string;
  user?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface Cart {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  size: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
  product?: Product;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product?: Product;
}

export interface Address {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  address_type: string;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: 'online' | 'cod';
  subtotal: number;
  discount: number;
  shipping_cost: number;
  tax: number;
  total: number;
  coupon_code: string | null;
  shipping_address: Address;
  billing_address: Address | null;
  tracking_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_image: string | null;
  quantity: number;
  size: string | null;
  color: string | null;
  price: number;
  subtotal: number;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  min_purchase_amount: number;
  max_discount_amount: number | null;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface Return {
  id: string;
  order_id: string;
  order_item_id?: string;
  user_id: string | null;
  product_id: string | null;
  product_name: string;
  product_image: string | null;
  quantity: number;
  size: string | null;
  color: string | null;
  price?: number;
  reason: ReturnReason;
  reason_details: string | null;
  status: ReturnStatus;
  refund_amount: number | null;
  admin_notes: string | null;
  images?: string[];
  return_type?: 'exchange' | 'refund';
  previous_return_id?: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    full_name: string | null;
    email: string;
  };
}

export interface OrderTracking {
  id: string;
  order_id: string;
  status: OrderStatus;
  location: string | null;
  notes: string | null;
  created_at: string;
}
