import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useWishlist, useCart } from '@/context/AppContext';
import { ProductCard } from '@/components/product/ProductCard';

const Wishlist = () => {
  const { items, toggleItem, itemCount } = useWishlist();
  const { addItem } = useCart();

  return (
    <div className="min-h-[80vh] flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">My Wishlist</h1>
          <span className="text-muted-foreground ml-2">({itemCount} items)</span>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20 bg-muted/30 rounded-2xl border border-dashed border-border/50">
            <div className="mx-auto w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <Heart className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Your wishlist is empty</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              Looks like you haven't saved any items yet. Start exploring our components and add your favorites here!
            </p>
            <Button asChild size="lg" className="px-8">
              <Link to="/products">
                Browse Products <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Wishlist;
