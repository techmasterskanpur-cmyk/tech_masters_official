import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { CartItem, Product, User } from '@/types';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  deliveryCharge: number; // ✅ Replaced GST with deliveryCharge
  total: number;
}

interface WishlistContextType {
  items: Product[];
  toggleItem: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  itemCount: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

interface SearchContextType {
  query: string;
  setQuery: (query: string) => void;
}

interface AppContextType {
  cart: CartContextType;
  wishlist: WishlistContextType;
  auth: AuthContextType;
  search: SearchContextType;
}

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

export const useCart = () => useApp().cart;
export const useWishlist = () => useApp().wishlist;
export const useAuth = () => useApp().auth;
export const useSearch = () => useApp().search;

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Cart State with LocalStorage
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('tech_masters_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // AUTH STATE HYDRATION
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [searchQuery, setSearchQuery] = useState('');

  // Sync Cart to LocalStorage
  useEffect(() => {
    localStorage.setItem('tech_masters_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Wishlist State with LocalStorage
  const [wishlistItems, setWishlistItems] = useState<Product[]>(() => {
    const savedWishlist = localStorage.getItem('tech_masters_wishlist');
    return savedWishlist ? JSON.parse(savedWishlist) : [];
  });

  // Sync Wishlist to LocalStorage
  useEffect(() => {
    localStorage.setItem('tech_masters_wishlist', JSON.stringify(wishlistItems));
  }, [wishlistItems]);

  // Cart Methods
  const addItem = useCallback((product: Product, quantity: number = 1) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { product, quantity }];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setCartItems(prev => prev.filter(item => item.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setCartItems(prev => prev.map(item => item.product.id === productId ? { ...item, quantity } : item));
  }, [removeItem]);

  const clearCart = useCallback(() => setCartItems([]), []);

  // ✅ UPDATED MATH ALGORITHM
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  
  // Delivery is 39 if subtotal is under 200, Free if 200+. (0 if cart is empty)
  const deliveryCharge = subtotal > 199 ? 0 : (subtotal > 0 ? 39 : 0); 
  
  const total = subtotal + deliveryCharge;

  // Wishlist Methods
  const toggleWishlistItem = useCallback((product: Product) => {
    setWishlistItems(prev => {
      const exists = prev.some(item => item.id === product.id);
      if (exists) {
        return prev.filter(item => item.id !== product.id);
      }
      return [...prev, product];
    });
  }, []);

  const isInWishlist = useCallback((productId: string) => {
    return wishlistItems.some(item => item.id === productId);
  }, [wishlistItems]);

  const wishlistCount = wishlistItems.length;

  // Auth Methods
  const login = useCallback((userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setCartItems([]);
    localStorage.removeItem('user');
    localStorage.removeItem('tech_masters_cart');
  }, []);

  const updateUser = useCallback((data: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const value: AppContextType = {
    cart: { items: cartItems, addItem, removeItem, updateQuantity, clearCart, itemCount, subtotal, deliveryCharge, total },
    wishlist: { items: wishlistItems, toggleItem: toggleWishlistItem, isInWishlist, itemCount: wishlistCount },
    auth: { user, isAuthenticated: !!user, login, logout, updateUser },
    search: { query: searchQuery, setQuery: setSearchQuery },
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};