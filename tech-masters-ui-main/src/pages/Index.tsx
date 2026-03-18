import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Truck,
  Shield,
  Zap,
  BadgeCheck,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ProductCard } from '@/components/product/ProductCard';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
// @ts-ignore
import api from '@/api/axios'; 

const highlights = [
  {
    icon: Truck,
    title: '50-Hour Delivery',
    description: 'Lightning-fast dispatch from our local warehouse',
  },
  {
    icon: Shield,
    title: 'Trusted Components',
    description: 'Sourced from verified manufacturers only',
  },
  {
    icon: Zap,
    title: 'Local Fast Dispatch',
    description: 'Same-day processing for quick turnaround',
  },
  {
    icon: BadgeCheck,
    title: 'Quality Tested',
    description: 'Every component undergoes rigorous QC checks',
  },
];

const Index = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch Products from Backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await api.get('/products');
        
        // Map Backend Data for UI
        const mappedProducts = data.map((p: any) => ({
          id: p._id,
          name: p.name,
          category: p.category,
          price: p.finalPrice || p.price,
          originalPrice: p.basePrice || p.price,
          // Handle Images safely
          image: (p.images && p.images.length > 0) ? p.images[0] : p.image,
          stock: p.stock,
          rating: p.rating || 0,
          reviewCount: p.numReviews || 0,
          isNew: p.isNew
        }));

        setProducts(mappedProducts);
      } catch (error) {
        console.error("Failed to fetch products for home", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // ✅ 1. Dynamic Categories Generator
  const categories = useMemo(() => {
    const catMap = new Map();
    products.forEach(p => {
      if (!p.category) return;
      const current = catMap.get(p.category) || 0;
      catMap.set(p.category, current + 1);
    });

    return Array.from(catMap.entries()).map(([name, count], index) => ({
      id: index,
      name: name,
      slug: name,
      productCount: count
    })).slice(0, 8); // Top 8 Categories only
  }, [products]);

  // ✅ Utility: Shuffle array randomly
  const shuffleArray = (arr: any[]) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // ✅ 2. Section Data Logic – filtered to price > ₹250 and randomized
  const eligibleProducts = useMemo(() => products.filter(p => p.price > 250), [products]);
  const newArrivals = useMemo(() => shuffleArray(eligibleProducts).slice(0, 4), [eligibleProducts]);
  const featuredProducts = useMemo(() => shuffleArray(eligibleProducts).slice(0, 4), [eligibleProducts]);
  const popularProducts = useMemo(() => shuffleArray(eligibleProducts).slice(0, 4), [eligibleProducts]);

  if (loading) {
     return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
     );
  }

  return (
    <div className="min-h-[80vh] flex flex-col bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-hero text-primary-foreground">
        {/* Tech Grid Background */}
        <div className="absolute inset-0 tech-grid opacity-10" />
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-secondary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-primary-light/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />

        <div className="container mx-auto px-4 py-12 md:py-16 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-2xl inline-block mx-auto border border-white/40 transform hover:scale-[1.02] transition-transform duration-500">
              <h1 className="text-3xl md:text-5xl lg:text-5xl font-black leading-tight animate-fade-in mb-2">
                <span className="text-gradient-primary">Tech</span>
                <span className="text-gray-900">_</span>
                <span className="text-gradient-secondary">Masters</span>
              </h1>
              <p className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 tracking-tight mb-4">
                Your One-Stop IoT Components Store
              </p>
              <p className="text-sm md:text-base text-gray-600 font-mono tracking-wider animate-slide-up font-semibold">
                Sensors • Boards • Modules • Robotics • Electronics
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Button variant="hero" size="xl" asChild>
                <Link to="/products">
                  Explore Products
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="hero-outline" size="lg" asChild>
                <Link to="/products">
                  Browse Categories
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 110C120 100 240 80 360 75C480 70 600 80 720 85C840 90 960 90 1080 85C1200 80 1320 70 1380 65L1440 60V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(var(--background))"/>
          </svg>
        </div>
      </section>

      {/* Highlights Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {highlights.map((item, index) => (
              <Card key={index} className="border-border/50 card-hover">
                <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                  <div className="h-14 w-14 rounded-full gradient-primary flex items-center justify-center shadow-glow">
                    <item.icon className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Quick Access */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">Shop by Category</h2>
            <Button variant="ghost" asChild>
              <Link to="/products" className="gap-1">
                View All <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          {categories.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-4">
                {categories.map((category) => (
                <Link
                    key={category.id}
                    to={`/products?category=${category.slug}`}
                    className="group p-4 rounded-xl bg-card border border-border/50 hover:border-primary/50 hover:shadow-lg transition-all duration-300 text-center"
                >
                    <div className="h-12 w-12 mx-auto rounded-lg gradient-primary opacity-80 group-hover:opacity-100 flex items-center justify-center mb-3 transition-opacity">
                    <span className="text-primary-foreground text-lg font-bold">
                        {category.name.charAt(0)}
                    </span>
                    </div>
                    <p className="text-sm font-medium line-clamp-1">{category.name}</p>
                    <p className="text-xs text-muted-foreground">{category.productCount} items</p>
                </Link>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No categories found. Start uploading products!</div>
          )}
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">Featured Products</h2>
              <p className="text-muted-foreground mt-1">Hand-picked components for your next project</p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/products" className="gap-1">
                View All <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          {featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
                ))}
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">Loading products...</p>
          )}
        </div>
      </section>

      {/* Popular Components */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">Popular Components</h2>
              <p className="text-muted-foreground mt-1">Best sellers loved by makers worldwide</p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/products" className="gap-1">
                View All <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          {popularProducts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {popularProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
                ))}
            </div>
          )}
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">New Arrivals</h2>
              <p className="text-muted-foreground mt-1">Fresh stock just landed</p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/products" className="gap-1">
                View All <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          {newArrivals.length > 0 && (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {newArrivals.map((product) => (
                <ProductCard key={product.id} product={product} />
                ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 gradient-hero text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 tech-grid opacity-5" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to Build Something Amazing?
            </h2>
            <p className="text-primary-foreground/80 text-lg">
              Join thousands of makers and engineers who trust Tech_Masters for quality components.
            </p>
            <Button variant="secondary" size="xl" asChild>
              <Link to="/products">
                Start Shopping
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;