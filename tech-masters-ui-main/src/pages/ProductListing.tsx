import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, Grid3X3, List, ChevronDown, Loader2, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ProductCard } from '@/components/product/ProductCard';
import { useSearch } from '@/context/AppContext';
// @ts-ignore
import api from '../api/axios'; 

const ProductListing = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { query } = useSearch();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [maxPrice, setMaxPrice] = useState(50000);

  // Filter States
  const [priceRange, setPriceRange] = useState([0, 50000]);
  // Draft price range: updates only on blur/enter, not on every keystroke
  const [draftPriceRange, setDraftPriceRange] = useState([0, 50000]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [availability, setAvailability] = useState<'all' | 'in_stock'>('all');
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Commit draft price range to real priceRange on blur/enter
  const commitPriceRange = () => {
    const lo = Math.min(draftPriceRange[0], draftPriceRange[1]);
    const hi = Math.max(draftPriceRange[0], draftPriceRange[1]);
    setPriceRange([lo, hi]);
  };

  const categoryFromUrl = searchParams.get('category');

  // Fetch Products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/products');
        
        // Map Backend Data Correctly
        const mappedProducts = data.map((p: any) => ({
          id: p._id || p.productId, 
          name: p.name,
          description: p.description,
          price: p.finalPrice || p.price || 0, 
          originalPrice: p.basePrice || p.price || 0,
          category: p.category,
          stock: p.stock,
          image: p.images && p.images.length > 0 ? p.images[0] : '', 
          images: p.images || [],
          rating: p.rating || 0,
          reviewCount: p.numReviews || 0,
          isNew: p.isNew || false,
          tags: [] 
        }));

        setProducts(mappedProducts);

        if (mappedProducts.length > 0) {
          const highestPrice = Math.max(...mappedProducts.map((p: any) => p.price));
          const dynamicMax = highestPrice > 0 ? Math.ceil(highestPrice / 100) * 100 : 50000;
          setMaxPrice(dynamicMax);
          setPriceRange([0, dynamicMax]);
          setDraftPriceRange([0, dynamicMax]);
        }

      } catch (err) {
        console.error("Failed to fetch products", err);
        setError("Could not load products. Is backend running?");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Dynamic Categories 
  const categories = useMemo(() => {
    const uniqueCats = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
    return uniqueCats.map(cat => ({
      id: cat,
      name: cat,
      slug: cat,
      productCount: products.filter(p => p.category === cat).length
    }));
  }, [products]);

  // ✅ Shuffle utility (stable per session - shuffled once when products load)
  const [shuffledProducts, setShuffledProducts] = React.useState<any[]>([]);
  useEffect(() => {
    if (products.length > 0) {
      const arr = [...products];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      setShuffledProducts(arr);
    }
  }, [products]);

  // Filter Logic
  const filteredProducts = useMemo(() => {
    // Use shuffled base when no active sorting preference
    const base = (sortBy === 'popular' && !query && !categoryFromUrl && selectedCategories.length === 0)
      ? shuffledProducts
      : [...products];

    let result = [...base];

    if (query) {
      const lowerQuery = query.toLowerCase();
      result = result.filter(
        p =>
          p.name.toLowerCase().includes(lowerQuery) ||
          p.description.toLowerCase().includes(lowerQuery) ||
          p.category.toLowerCase().includes(lowerQuery)
      );
    }

    if (categoryFromUrl) {
      result = result.filter(p => p.category === categoryFromUrl);
    }

    if (selectedCategories.length > 0) {
      result = result.filter(p => selectedCategories.includes(p.category));
    }

    result = result.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    if (availability === 'in_stock') {
      result = result.filter(p => p.stock > 0);
    }

    if (minRating > 0) {
      result = result.filter(p => p.rating >= minRating);
    }

    switch (sortBy) {
      case 'price_asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
      case 'popular':
      default:
        // Already shuffled unless a filter is active
        if (query || categoryFromUrl || selectedCategories.length > 0) {
          result.sort((a, b) => b.reviewCount - a.reviewCount);
        }
        break;
    }

    return result;
  }, [products, shuffledProducts, categoryFromUrl, query, selectedCategories, priceRange, availability, minRating, sortBy]);

  const toggleCategory = (slug: string) => {
    setSelectedCategories(prev =>
      prev.includes(slug) ? prev.filter(c => c !== slug) : [...prev, slug]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setPriceRange([0, maxPrice]);
    setDraftPriceRange([0, maxPrice]);
    setAvailability('all');
    setMinRating(0);
    setSearchParams({});
  };

  const FilterContent = () => (
    <div className="space-y-6 pr-2"> {/* Added slight padding for the scrollbar */}
      {/* Categories */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 font-semibold">
          Categories
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 pt-2">
          {categories.length > 0 ? categories.map(category => (
            <div key={category.id} className="flex items-center space-x-2">
              <Checkbox
                id={category.slug}
                checked={selectedCategories.includes(category.slug) || categoryFromUrl === category.slug}
                onCheckedChange={() => toggleCategory(category.slug)}
              />
              <label
                htmlFor={category.slug}
                className="text-sm cursor-pointer flex-1 flex items-center justify-between"
              >
                <span>{category.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {category.productCount}
                </Badge>
              </label>
            </div>
          )) : <p className="text-sm text-gray-500">No categories found</p>}
        </CollapsibleContent>
      </Collapsible>

      {/* Price Range */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 font-semibold">
          Price Range
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-2">
          <Slider
            value={priceRange}
            onValueChange={setPriceRange}
            min={0}
            max={maxPrice} 
            step={10}
          />
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={draftPriceRange[0]}
              onChange={e => setDraftPriceRange([Number(e.target.value), draftPriceRange[1]])}
              onBlur={commitPriceRange}
              onKeyDown={e => e.key === 'Enter' && commitPriceRange()}
              className="h-9"
            />
            <span className="text-muted-foreground">to</span>
            <Input
              type="number"
              value={draftPriceRange[1]}
              onChange={e => setDraftPriceRange([draftPriceRange[0], Number(e.target.value)])}
              onBlur={commitPriceRange}
              onKeyDown={e => e.key === 'Enter' && commitPriceRange()}
              className="h-9"
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Availability */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 font-semibold">
          Availability
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 pt-2">
          {[
            { value: 'all', label: 'All Products' },
            { value: 'in_stock', label: 'In Stock' },
          ].map(option => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox
                id={option.value}
                checked={availability === option.value}
                onCheckedChange={() => setAvailability(option.value as typeof availability)}
              />
              <label htmlFor={option.value} className="text-sm cursor-pointer">
                {option.label}
              </label>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>

      <Button variant="outline" className="w-full mt-2 mb-4" onClick={clearFilters}>
        Clear All Filters
      </Button>
    </div>
  );

  return (
    <div className="min-h-[80vh] flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                {categoryFromUrl
                  ? categories.find(c => c.slug === categoryFromUrl)?.name || categoryFromUrl
                  : query
                  ? `Search Results for "${query}"`
                  : 'All Products'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {loading ? 'Loading...' : `${filteredProducts.length} products found`}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Mobile Filter Button */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterContent />
                  </div>
                </SheetContent>
              </Sheet>

              {/* Sort Dropdown */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                </SelectContent>
              </Select>

              {/* View Toggle */}
              <div className="hidden sm:flex border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="rounded-r-none"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="rounded-l-none"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex gap-8">
            {/* ✅ FIXED: Sidebar Filters now have independent scrolling */}
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-24 bg-card rounded-lg border border-border/50 p-6 max-h-[calc(100vh-120px)] overflow-y-auto scrollbar-thin scrollbar-thumb-border hover:scrollbar-thumb-primary/50 transition-colors">
                <h2 className="font-semibold text-lg mb-4">Filters</h2>
                <FilterContent />
              </div>
            </aside>

            {/* Product Grid */}
            <div className="flex-1">
              {loading || (products.length > 0 && shuffledProducts.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">Loading your electronics...</p>
                </div>
              ) : error ? (
                <div className="text-center py-20 text-red-500">
                  <p>{error}</p>
                </div>
              ) : filteredProducts.length > 0 ? (
                <div
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6'
                      : 'space-y-4'
                  }
                >
                  {filteredProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="flex justify-center mb-4">
                     <SearchX className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No products found</h3>
                  <p className="text-muted-foreground mb-6">
                    We couldn't find anything matching "{query}". <br/>
                    Try checking for typos or using different keywords.
                  </p>
                  <Button variant="outline" onClick={() => clearFilters()}>
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductListing;