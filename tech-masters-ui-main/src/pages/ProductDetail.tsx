import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  ShoppingCart,
  Zap,
  Truck,
  Shield,
  Star,
  Share2,
  Heart,
  Loader2,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ProductCard } from '@/components/product/ProductCard';
import { useAuth, useCart, useWishlist } from '@/context/AppContext';
// @ts-ignore
import api from '../api/axios';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);
};

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [product, setProduct] = useState<any | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [visibleRelated, setVisibleRelated] = useState(16); // Show 4 rows of 4 initially
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({});
  
  const [newReview, setNewReview] = useState({ rating: 0, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  const handleWishlistToggle = () => {
    if (!product) return;
    const currentlyWishlisted = isInWishlist(product.id);
    toggleItem(product);
    
    toast({
      title: !currentlyWishlisted ? "Added to Wishlist" : "Removed from Wishlist",
      description: !currentlyWishlisted 
        ? `${product.name} has been saved to your wishlist.`
        : `${product.name} has been removed.`,
    });
  };

  const handleShare = async () => {
    const shareData = {
      title: product?.name,
      text: `Check out ${product?.name} on Tech_Masters!`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link Copied!",
          description: "Product link copied to your clipboard.",
        });
      }
    } catch (err) {
      console.log('Error sharing:', err);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      transformOrigin: `${x}% ${y}%`,
      transform: 'scale(2.5)' // Increased zoom further
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({
      transformOrigin: 'center center',
      transform: 'scale(1)'
    });
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/products');
        const found = data.find((p: any) => p._id === id || p.productId === id);

        if (found) {
          // Robust Image Logic: Use direct URL
          const imagesArray = (found.images && found.images.length > 0) 
            ? found.images 
            : [found.image || 'https://placehold.co/600x600?text=No+Image'];

          setProduct({
            id: found._id,
            name: found.name,
            description: found.description,
            price: found.finalPrice || found.price || 0,
            originalPrice: found.basePrice || found.price || 0,
            category: found.category || 'Component',
            stock: found.stock || 0,
            image: imagesArray[0], 
            images: imagesArray,
            rating: found.rating || 0,
            reviewCount: found.reviews ? found.reviews.length : 0,
            reviews: found.reviews || [],
            isNew: found.isNew || false,
            subcategory: found.subCategories ? found.subCategories.join(', ') : "",
            tags: found.subCategories || ["Gadget", "Tech", found.category],
            specifications: found.specifications || {}
          });

          const related = data
            .filter((p: any) => p.category === found.category && p._id !== found._id)
            .slice(0, 40)
            .map((p: any) => ({
              id: p._id,
              name: p.name,
              price: p.finalPrice || p.price,
              originalPrice: p.basePrice || p.price,
              image: (p.images && p.images.length > 0) ? p.images[0] : p.image,
              category: p.category,
              rating: p.rating || 0,
              reviewCount: p.numReviews || 0,
              isNew: p.isNew
            }));
          setRelatedProducts(related);
        }
      } catch (error) {
        console.error("Error fetching details", error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProduct();
  }, [id]);

  const handleAddToCart = () => { if (product) addItem(product, quantity); };
  const handleBuyNow = () => { if (product) { addItem(product, quantity); navigate('/checkout'); } };

  const handleReviewSubmit = async () => {
    if (!user) {
      toast({ title: "Please Login", description: "You need to be logged in to post a review.", variant: "destructive" });
      return;
    }
    
    try {
      setSubmittingReview(true);
      await api.post(`/products/${product.id}/reviews`, newReview);
      
      toast({
        title: "Review Submitted!",
        description: "Thank you for your feedback. It is now visible to everyone.",
      });
      
      setNewReview({ rating: 0, comment: '' });
      // Refresh product data
      if (id) {
          const { data } = await api.get('/products');
          const found = data.find((p: any) => p._id === id || p.productId === id);
          if (found) {
              setProduct({
                  ...product,
                  rating: found.rating,
                  reviewCount: found.reviews ? found.reviews.length : 0,
                  reviews: found.reviews || []
              });
          }
      }
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.response?.data?.message || "Could not post your review.",
        variant: "destructive"
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
            <Button asChild>
              <Link to="/products">Browse Products</Link>
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const discount = product.originalPrice > product.price 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
    : 0;

  return (
    <div className="min-h-[80vh] flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <Link to="/products" className="hover:text-foreground">Products</Link>
            <ChevronRight className="h-4 w-4" />
            <Link to={`/products?category=${product.category}`} className="hover:text-foreground capitalize">
              {product.category?.replace('-', ' ')}
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground truncate max-w-[200px]">{product.name}</span>
          </nav>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Image Gallery */}
            <div className="space-y-4">
              {/* Main Image */}
              <div 
                className="relative h-[300px] sm:h-[400px] lg:h-[450px] w-full rounded-lg overflow-hidden bg-muted/50 border border-border/50 cursor-crosshair group isolate z-10"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                <img
                  src={product.images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-contain bg-white transition-transform duration-200 ease-out"
                  style={zoomStyle}
                  onError={(e) => (e.target as HTMLImageElement).src = "https://placehold.co/600x600?text=Tech_Masters"}
                />
                {discount > 0 && (
                  <Badge className="absolute top-4 left-4 bg-secondary text-secondary-foreground">
                    -{discount}%
                  </Badge>
                )}
                {product.isNew && (
                  <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground">
                    New
                  </Badge>
                )}

                {/* Image Navigation */}
                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedImage(prev => (prev > 0 ? prev - 1 : product.images.length - 1))}
                      onMouseEnter={(e) => { e.stopPropagation(); handleMouseLeave(); }}
                      onMouseMove={(e) => { e.stopPropagation(); handleMouseLeave(); }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors shadow-md"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setSelectedImage(prev => (prev < product.images.length - 1 ? prev + 1 : 0))}
                      onMouseEnter={(e) => { e.stopPropagation(); handleMouseLeave(); }}
                      onMouseMove={(e) => { e.stopPropagation(); handleMouseLeave(); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors shadow-md"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {product.images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {product.images.map((img: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 bg-white transition-colors ${
                        selectedImage === index ? 'border-primary' : 'border-transparent'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-contain" onError={(e) => (e.target as HTMLImageElement).src = "https://placehold.co/100x100?text=Error"} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              {/* Category */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="uppercase text-xs">
                  {product.category?.replace('-', ' ')}
                </Badge>
                {product.subcategory && (
                  <Badge variant="secondary" className="text-xs">
                    {product.subcategory?.replace('-', ' ')}
                  </Badge>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl md:text-3xl font-bold">{product.name}</h1>

              {/* Rating */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        product.rating > 0 && star <= Math.floor(product.rating)
                          ? 'fill-secondary text-secondary'
                          : 'text-muted-foreground/30'
                      }`}
                    />
                  ))}
                </div>
                {product.rating > 0 ? (
                  <>
                    <span className="font-medium">{product.rating.toFixed(1)}</span>
                    <span className="text-muted-foreground">({product.reviewCount} reviews)</span>
                  </>
                ) : (
                  <span className="text-muted-foreground text-sm">No reviews yet</span>
                )}
              </div>

              {/* Price */}
              <div className="space-y-1">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold">{formatPrice(product.price)}</span>
                  {/* Always show MRP as higher – if originalPrice equals price, compute 20% higher */}
                  <span className="text-lg text-muted-foreground line-through">
                    {formatPrice(
                      product.originalPrice > product.price
                        ? product.originalPrice
                        : Math.round(product.price * 1.22)
                    )}
                  </span>
                  {discount > 0 && (
                    <Badge className="bg-success text-success-foreground hover:bg-success/90">Save {discount}%</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">GST included • Free shipping on orders over ₹199</p>
              </div>

              {/* Stock */}
              <div className="flex items-center gap-2">
                {product.stock > 10 ? (
                  <Badge variant="outline" className="text-success border-success bg-success/10">
                    In Stock
                  </Badge>
                ) : product.stock > 0 ? (
                  <Badge variant="outline" className="text-warning border-warning bg-warning/10">
                    Only {product.stock} left
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-destructive border-destructive bg-destructive/10">
                    Out of Stock
                  </Badge>
                )}
              </div>

              <Separator />

              {/* Quantity Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Quantity</label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border rounded-lg bg-card">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1 || product.stock === 0}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-medium">{product.stock === 0 ? 0 : quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      disabled={quantity >= product.stock || product.stock === 0}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {product.stock} units available
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Add to Cart
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  className="flex-1"
                  onClick={handleBuyNow}
                  disabled={product.stock === 0}
                >
                  <Zap className="h-5 w-5 mr-2" />
                  Buy Now
                </Button>
              </div>

              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`hover:text-primary transition-colors ${product && isInWishlist(product.id) ? 'text-red-500 hover:text-red-600' : ''}`}
                  onClick={handleWishlistToggle}
                >
                  <Heart className={`h-4 w-4 mr-2 ${product && isInWishlist(product.id) ? 'fill-current' : ''}`} />
                  {product && isInWishlist(product.id) ? 'Saved to Wishlist' : 'Add to Wishlist'}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="hover:text-primary transition-colors"
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>

              <Separator />

              {/* Features */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-border/50 shadow-sm">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Truck className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Fast Delivery</p>
                      <p className="text-xs text-muted-foreground">Quick dispatch</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/50 shadow-sm">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Quality Tested</p>
                      <p className="text-xs text-muted-foreground">100% genuine</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/50 shadow-sm">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-secondary/20 flex items-center justify-center">
                      <Zap className="h-5 w-5 text-secondary-dark" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Best Value</p>
                      <p className="text-xs text-muted-foreground">Market leading prices</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Product Details Tabs */}
          <div className="mt-12">
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent flex-wrap">
                <TabsTrigger
                  value="description"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                >
                  Description
                </TabsTrigger>
                <TabsTrigger
                  value="specifications"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                >
                  Specifications
                </TabsTrigger>
                <TabsTrigger
                  value="reviews"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                >
                  Reviews ({product.reviewCount})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="description" className="mt-6">
                <Card className="border-border/50 shadow-sm">
                  <CardContent className="p-6">
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{product.description}</p>
                    {product.tags && product.tags.length > 0 && (
                      <div className="mt-6 flex flex-wrap gap-2">
                        {product.tags.map((tag: string) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="specifications" className="mt-6">
                <Card className="border-border/50 shadow-sm">
                  <CardContent className="p-6">
                    {(() => {
                      const specs = product.specifications;
                      // Handle plain-text string specs (from AI generator)
                      if (typeof specs === 'string' && specs.trim() && specs !== 'N/A') {
                        return (
                          <div className="grid gap-0">
                            {specs.split('\n').map((line: string, idx: number) => {
                              const colonIdx = line.indexOf(':');
                              if (colonIdx < 0) return null;
                              const key = line.slice(0, colonIdx).trim();
                              const val = line.slice(colonIdx + 1).trim();
                              if (!key || !val) return null;
                              return (
                                <div key={idx} className="flex justify-between py-2 border-b border-border/50 last:border-0">
                                  <span className="text-muted-foreground">{key}</span>
                                  <span className="font-medium text-right max-w-[60%]">{val}</span>
                                </div>
                              );
                            })}
                          </div>
                        );
                      }
                      // Handle Map/Object specs
                      if (specs && typeof specs === 'object' && Object.keys(specs).length > 0) {
                        return (
                          <div className="grid gap-4">
                            {Object.entries(specs).map(([key, value]) => (
                              <div key={key} className="flex justify-between py-2 border-b border-border/50 last:border-0">
                                <span className="text-muted-foreground">{key}</span>
                                <span className="font-medium">{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return <p className="text-muted-foreground">No specifications available for this product yet.</p>;
                    })()}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews" className="mt-6">
                <div className="grid lg:grid-cols-3 gap-8">
                  {/* Review Stats */}
                  <div className="lg:col-span-1 space-y-6">
                    <Card className="border-border/50 shadow-sm">
                      <CardContent className="p-6">
                        <h3 className="text-xl font-bold mb-4">Customer Reviews</h3>
                        <div className="flex items-center gap-4 mb-6">
                          <div className="text-4xl font-bold">{product.rating.toFixed(1)}</div>
                          <div>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star
                                  key={star}
                                  className={`h-4 w-4 ${
                                    star <= Math.floor(product.rating)
                                      ? 'fill-secondary text-secondary'
                                      : 'text-muted-foreground/30'
                                  }`}
                                />
                              ))}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">Based on {product.reviewCount} reviews</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Write a Review Section */}
                    {user ? (
                      <Card className="border-border/50 shadow-sm overflow-hidden">
                        <div className="p-4 bg-muted/50 border-b border-border/50">
                          <h4 className="font-semibold">Write a Review</h4>
                        </div>
                        <CardContent className="p-4 space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Rating</label>
                            <div className="flex items-center gap-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setNewReview({ ...newReview, rating: star })}
                                  className="focus:outline-none transition-transform hover:scale-110"
                                >
                                  <Star
                                    className={`h-6 w-6 ${
                                      star <= newReview.rating
                                        ? 'fill-secondary text-secondary'
                                        : 'text-muted-foreground/30'
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Comment</label>
                            <textarea
                              className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background resize-none focus:ring-2 focus:ring-primary outline-none transition-all text-sm"
                              placeholder="Share your thoughts about this product..."
                              value={newReview.comment}
                              onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                            />
                          </div>
                          <Button 
                            className="w-full" 
                            onClick={handleReviewSubmit}
                            disabled={submittingReview || !newReview.comment || newReview.rating === 0}
                          >
                            {submittingReview ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Post Review
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="border-border/50 shadow-sm bg-muted/30">
                        <CardContent className="p-6 text-center">
                          <p className="text-sm text-muted-foreground mb-4">Please log in to share your review with the community.</p>
                          <Button variant="outline" size="sm" asChild>
                            <Link to="/login">Login Now</Link>
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Reviews List */}
                  <div className="lg:col-span-2 space-y-4">
                    {product.reviews && product.reviews.length > 0 ? (
                      product.reviews.map((rev: any, idx: number) => (
                        <Card key={idx} className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
                          <CardContent className="p-4 sm:p-6 space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <div className="font-semibold text-foreground flex items-center gap-2">
                                  {rev.name}
                                  {rev.verified && <Badge variant="secondary" className="text-[10px] h-4 py-0">Verified</Badge>}
                                </div>
                                <div className="flex items-center gap-1">
                                  {[1, 2, 3, 4, 5].map(star => (
                                    <Star
                                      key={star}
                                      className={`h-3 w-3 ${
                                        star <= rev.rating
                                          ? 'fill-secondary text-secondary'
                                          : 'text-muted-foreground/30'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {new Date(rev.createdAt || Date.now()).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed italic">
                              "{rev.comment}"
                            </p>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center py-12 text-center bg-muted/20 rounded-xl border border-dashed border-border/50">
                        <div className="bg-muted p-4 rounded-full mb-4">
                          <Star className="h-8 w-8 text-muted-foreground/40" />
                        </div>
                        <h4 className="text-lg font-medium text-foreground">No Reviews Yet</h4>
                        <p className="text-sm text-muted-foreground max-w-[250px] mx-auto mt-1">
                          Be the first to share your experience with this product!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <section className="mt-16">
              <h2 className="text-2xl font-bold mb-6">Related Products</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.slice(0, visibleRelated).map(p => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              {visibleRelated < relatedProducts.length && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={() => setVisibleRelated(prev => prev + 10)}
                    className="flex items-center gap-2 px-6 py-3 rounded-full border-2 border-primary text-primary font-semibold hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                  >
                    <span>Load More</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                  </button>
                </div>
              )}
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetail;