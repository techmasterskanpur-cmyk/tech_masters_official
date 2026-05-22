import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  ShoppingCart,
  User,
  ChevronDown,
  Menu,
  X,
  LogOut,
  Package,
  MapPin,
  Settings,
  Cpu,
  Gauge,
  CircuitBoard,
  Bot,
  Cable,
  Battery,
  Wrench,
  Zap,
  Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useCart, useAuth, useSearch, useWishlist } from '@/context/AppContext';
// @ts-ignore
import api from '../../api/axios'; 

// ✅ MAPPING REAL DATABASE CATEGORIES TO ICONS
const getCategoryIcon = (categoryName: string) => {
  const lowerCat = categoryName.toLowerCase();
  if (lowerCat.includes('sensor')) return Gauge;
  if (lowerCat.includes('microcontroller') || lowerCat.includes('semiconductor')) return Cpu;
  if (lowerCat.includes('board') || lowerCat.includes('pcb') || lowerCat.includes('module')) return CircuitBoard;
  if (lowerCat.includes('motor') || lowerCat.includes('servo')) return Bot;
  if (lowerCat.includes('wire') || lowerCat.includes('cable')) return Cable;
  if (lowerCat.includes('battery') || lowerCat.includes('power') || lowerCat.includes('bms')) return Battery;
  if (lowerCat.includes('tool') || lowerCat.includes('equipment')) return Wrench;
  return Zap; // default fallback for 'components', 'connectors', etc.
};

export const Navbar: React.FC = () => {
  // Use Global Search State
  const { query, setQuery } = useSearch();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { itemCount } = useCart();
  const { itemCount: wishlistCount } = useWishlist();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  // ✅ DYNAMIC CATEGORY STATE
  const [dbCategories, setDbCategories] = useState<{name: string, count: number}[]>([]);

  // ✅ FETCH CATEGORIES ON NAVBAR LOAD
  useEffect(() => {
    const fetchCategoriesForNav = async () => {
      try {
        const { data } = await api.get('/products');
        
        // Extract unique categories and count them (matching ProductListing logic)
        const counts: Record<string, number> = {};
        
        // The backend returns { items, total, page, pages, limit }
        const productsList = Array.isArray(data) ? data : (data.items || []);

        productsList.forEach((p: any) => {
            if (p.category) {
                counts[p.category] = (counts[p.category] || 0) + 1;
            }
        });

        // Convert to array and sort by count (highest first)
        const sortedCategories = Object.keys(counts)
            .map(cat => ({ name: cat, count: counts[cat] }))
            .sort((a, b) => b.count - a.count);

        setDbCategories(sortedCategories);
      } catch (err) {
        console.error("Failed to load categories for nav", err);
      }
    };
    fetchCategoriesForNav();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Navigate to products page to show results
    if (query.trim()) {
      navigate(`/products`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg overflow-hidden bg-background">
              <img src="/logo.png" alt="Tech Masters" className="h-full w-full object-contain group-hover:scale-110 transition-transform duration-300" />
            </div>
            <span className="text-xl font-bold hidden sm:block">
              <span className="text-gradient-primary">Tech</span>
              <span className="text-foreground">_</span>
              <span className="text-gradient-secondary">Masters</span>
            </span>
          </Link>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search sensors, boards, modules..."
                className="w-full pl-10 pr-4 bg-muted/50 border-border focus:bg-background"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </form>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {/* ✅ DYNAMIC Categories Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-1">
                  Categories
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
                {dbCategories.length > 0 ? dbCategories.map((category) => {
                  const IconComponent = getCategoryIcon(category.name);
                  return (
                    <DropdownMenuItem key={category.name} asChild>
                      {/* ✅ EXACT MATCH URL PARAMS 
                         Using encodeURIComponent to handle spaces and apostrophes like "Relay Module's" 
                      */}
                      <Link
                        to={`/products?category=${encodeURIComponent(category.name)}`}
                        className="flex items-center gap-3 cursor-pointer py-2"
                      >
                        <IconComponent className="h-4 w-4 text-primary shrink-0" />
                        <span className="truncate">{category.name}</span>
                        <Badge variant="secondary" className="ml-auto text-xs shrink-0">
                          {category.count}
                        </Badge>
                      </Link>
                    </DropdownMenuItem>
                  );
                }) : (
                    <div className="p-4 text-sm text-center text-muted-foreground">Loading categories...</div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Wishlist */}
            <Button variant="ghost" size="icon" className="relative" onClick={() => navigate('/wishlist')}>
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <Badge
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-primary text-primary-foreground text-xs font-bold"
                >
                  {wishlistCount}
                </Badge>
              )}
            </Button>

            {/* Cart */}
            <Button variant="ghost" size="icon" className="relative" onClick={() => navigate('/cart')}>
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <Badge
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-secondary text-secondary-foreground text-xs font-bold"
                >
                  {itemCount}
                </Badge>
              )}
            </Button>

            {/* User Menu */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center overflow-hidden border border-border/50">
                      {user && (user as any).avatar ? (
                        <img src={(user as any).avatar} alt={user?.name || 'User'} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="text-sm font-semibold text-primary-foreground">
                          {user?.name?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      My Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/orders" className="cursor-pointer">
                      <Package className="mr-2 h-4 w-4" />
                      My Orders
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/addresses" className="cursor-pointer">
                      <MapPin className="mr-2 h-4 w-4" />
                      Addresses
                    </Link>
                  </DropdownMenuItem>
                  
                  {/* Admin Link */}
                  {(user as any)?.role === 'admin' && (
                     <DropdownMenuItem asChild>
                        <Link to="/admin" className="cursor-pointer text-blue-600 font-semibold">
                           <Gauge className="mr-2 h-4 w-4" />
                           Admin Dashboard
                        </Link>
                     </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:text-destructive"
                    onClick={logout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => navigate('/login')}>
                  Login
                </Button>
                <Button variant="cta" onClick={() => navigate('/signup')}>
                  Sign Up
                </Button>
              </div>
            )}
          </nav>

          <div className="flex lg:hidden items-center gap-2">
            {/* Mobile Wishlist */}
            <Button variant="ghost" size="icon" className="relative" onClick={() => navigate('/wishlist')}>
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <Badge
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-primary text-primary-foreground text-xs font-bold"
                >
                  {wishlistCount}
                </Badge>
              )}
            </Button>

            {/* Mobile Cart */}
            <Button variant="ghost" size="icon" className="relative" onClick={() => navigate('/cart')}>
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <Badge
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-secondary text-secondary-foreground text-xs font-bold"
                >
                  {itemCount}
                </Badge>
              )}
            </Button>

            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 flex flex-col h-full" onOpenAutoFocus={(e) => e.preventDefault()}>
                <SheetHeader>
                  <SheetTitle className="text-left flex items-center gap-2">
                    <img src="/logo.png" alt="Tech Masters Logo" className="h-8 w-8 object-contain" />
                    <span>
                      <span className="text-gradient-primary">Tech</span>
                      <span className="text-foreground">_</span>
                      <span className="text-gradient-secondary">Masters</span>
                    </span>
                  </SheetTitle>
                </SheetHeader>
                
                <div className="mt-6 flex-1 overflow-y-auto pr-2 pb-20 scrollbar-thin flex flex-col">
                  {/* Mobile Auth Links (Moved to Top) */}
                  <div className="mb-6 border-b pb-4">
                    {isAuthenticated ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 px-3 py-2 mb-2 bg-muted/30 rounded-lg">
                          <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center shrink-0 overflow-hidden border border-border/50">
                            {user && (user as any).avatar ? (
                              <img src={(user as any).avatar} alt={user?.name || 'User'} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <span className="text-sm font-semibold text-primary-foreground">
                                {user?.name?.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="truncate">
                            <p className="text-sm font-medium truncate">{user?.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                          </div>
                        </div>
                        <Link
                          to="/dashboard"
                          className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <User className="h-4 w-4" />
                          <span>My Profile</span>
                        </Link>
                        <Link
                          to="/dashboard/orders"
                          className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Package className="h-4 w-4" />
                          <span>My Orders</span>
                        </Link>
                        <Link
                          to="/dashboard/addresses"
                          className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <MapPin className="h-4 w-4" />
                          <span>Addresses</span>
                        </Link>
                        
                        {(user as any)?.role === 'admin' && (
                             <Link
                             to="/admin"
                             className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-blue-600 font-medium"
                             onClick={() => setMobileMenuOpen(false)}
                           >
                             <Gauge className="h-4 w-4" />
                             <span>Admin Dashboard</span>
                           </Link>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 px-1">
                        <Button
                          variant="outline"
                          className="w-full h-11"
                          onClick={() => {
                            navigate('/login');
                            setMobileMenuOpen(false);
                          }}
                        >
                          Login
                        </Button>
                        <Button
                          variant="cta"
                          className="w-full h-11"
                          onClick={() => {
                            navigate('/signup');
                            setMobileMenuOpen(false);
                          }}
                        >
                          Sign Up
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Mobile Search */}
                  <form onSubmit={handleSearch} className="relative mb-6 shrink-0">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search products..."
                      className="pl-10"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </form>

                  {/* ✅ DYNAMIC Mobile Categories */}
                  <div className="space-y-1 flex-1">
                    <p className="text-sm font-semibold text-muted-foreground mb-3 px-1">Categories</p>
                    {dbCategories.length > 0 ? dbCategories.map((category) => {
                      const IconComponent = getCategoryIcon(category.name);
                      return (
                        <Link
                          key={category.name}
                          to={`/products?category=${encodeURIComponent(category.name)}`}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <IconComponent className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-sm truncate flex-1">{category.name}</span>
                          <Badge variant="secondary" className="text-[10px] shrink-0">{category.count}</Badge>
                        </Link>
                      );
                    }) : (
                       <div className="p-4 text-sm text-muted-foreground">Loading categories...</div>
                    )}
                  </div>
                </div>

                {/* Mobile Logout / Footer Section (Fixed to Bottom) */}
                {isAuthenticated && (
                  <div className="border-t pt-2 pb-6 bg-background mt-auto shrink-0 px-2">
                    <button
                      className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-red-50 hover:text-red-600 w-full text-destructive transition-colors mt-2"
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="font-medium">Logout</span>
                    </button>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};