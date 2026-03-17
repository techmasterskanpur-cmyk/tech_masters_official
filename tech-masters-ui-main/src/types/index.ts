// Product Types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  subcategory?: string;
  stock: number;
  rating: number;
  reviewCount: number;
  specifications: Record<string, string>;
  tags: string[];
  isFeatured?: boolean;
  isNew?: boolean;
  isPopular?: boolean;
}

// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  addresses: Address[];
  createdAt: Date;
}

export interface Address {
  id: string;
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  isDefault?: boolean;
}

// Cart Types
export interface CartItem {
  product: Product;
  quantity: number;
}

// Order Types
export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'processing' | 'success' | 'failed';

export type PaymentMethod = 'cod' | 'online';

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  gst: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  deliveryAddress: Address;
  createdAt: Date;
  estimatedDelivery: Date;
  deliveredAt?: Date;
}

// Category Types
export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  subcategories?: Category[];
  productCount: number;
}

// Filter Types
export interface ProductFilters {
  category?: string;
  priceRange?: [number, number];
  availability?: 'all' | 'in_stock' | 'out_of_stock';
  rating?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'popular';
}
