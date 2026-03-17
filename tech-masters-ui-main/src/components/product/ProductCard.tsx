import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Eye, Star } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/types';
import { formatPrice } from '@/data/mockData';
import { useCart } from '@/context/AppContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addItem } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
  };

  // ✅ SIMPLE LOGIC: Use direct image, fallback to placeholder if error
  const imageSrc = (product as any).image || ((product as any).images && (product as any).images[0]) || "https://placehold.co/400x400?text=Tech_Masters";

  // Price logic: ensure MRP (originalPrice) is always HIGHER than actual price
  // Use a deterministic varied markup per product (seeded on product id) so discounts are diverse
  const actualPrice = product.price;
  const rawId = product.id ? String(product.id) : String(product.name);
  // Derive a stable pseudo-random multiplier in range 1.08 - 1.42 from the product id characters
  const seed = rawId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const discountRange = 8 + (seed % 35); // 8% to 42%
  const computedMrp = Math.round(actualPrice * (1 + discountRange / 100));
  const mrp = (product.originalPrice && product.originalPrice > product.price)
    ? product.originalPrice
    : computedMrp;

  const discount = mrp > 0
    ? Math.round(((mrp - actualPrice) / mrp) * 100)
    : 0;

  return (
    <Card className="group relative overflow-hidden card-hover border-border/50 bg-card">
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
        {product.isNew && <Badge className="bg-primary text-primary-foreground">New</Badge>}
        {discount > 0 && <Badge className="bg-secondary text-secondary-foreground">-{discount}%</Badge>}
        {product.stock <= 5 && product.stock > 0 && <Badge variant="destructive">Low Stock</Badge>}
      </div>

      <Link to={`/product/${product.id}`}>
        <div className="relative aspect-square overflow-hidden bg-muted/50 flex items-center justify-center">
          <img
            src={imageSrc} 
            alt={product.name}
            className="object-contain w-full h-full transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
                // Agar image load nahi hui to Placeholder dikhao
                (e.target as HTMLImageElement).src = "https://placehold.co/400x400?text=Tech_Masters";
            }}
          />
          
          <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors duration-300" />
          <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" className="flex-1" onClick={handleAddToCart} disabled={product.stock === 0}>
                <ShoppingCart className="h-4 w-4 mr-1" /> Add to Cart
              </Button>
              <Button variant="outline" size="icon" className="shrink-0 bg-card">
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">{product.category.replace('-', ' ')}</p>
          <h3 className="font-semibold text-foreground line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors">{product.name}</h3>
          <div className="flex items-center gap-1 mt-2">
            {product.rating > 0 ? (
              <>
                <Star className="h-4 w-4 fill-secondary text-secondary" />
                <span className="text-sm font-medium">{product.rating.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">({product.reviewCount})</span>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">No reviews yet</span>
            )}
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-lg font-bold text-foreground">{formatPrice(actualPrice)}</span>
            <span className="text-sm text-muted-foreground line-through">{formatPrice(mrp)}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">GST included</p>
        </CardContent>
      </Link>
    </Card>
  );
};