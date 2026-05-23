import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { 
  Package, Clock, CheckCircle, TrendingUp, Truck, Loader2, 
  Eye, Printer, Mail, Phone, Upload, Search, Trash2, LayoutGrid, List 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
// @ts-ignore
import api from '@/api/axios'; 

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Delivered': return 'bg-green-100 text-green-700 hover:bg-green-100';
    case 'Shipped': return 'bg-blue-100 text-blue-700 hover:bg-blue-100';
    case 'Processing': return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100';
    case 'Cancelled': return 'bg-red-100 text-red-700 hover:bg-red-100';
    default: return 'bg-gray-100 text-gray-700 hover:bg-gray-100';
  }
};

// Helper function to calculate time left
const calculateTimeLeft = (deadline: string) => {
    if (!deadline) return "N/A";
    const now = new Date().getTime();
    const end = new Date(deadline).getTime();
    const diff = end - now;

    if (diff <= 0) return "Deadline Passed";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m left`;
};

// HELPER TO DYNAMICALLY GET ORDER TOTAL (Including Delivery)
const getOrderTotal = (order: any) => {
  if (!order || !order.orderItems) return 0;
  const subtotal = order.orderItems.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
  const delivery = subtotal > 199 ? 0 : 39;
  return subtotal + delivery;
};

const AdminDashboard = () => {
  const location = useLocation();

  // --- TABS STATE ---
  const [activeTab, setActiveTab] = useState('orders'); 

  // --- ORDERS STATE ---
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null); 
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');
  const invoiceRef = useRef(null); 

  // --- PRODUCTS STATE ---
  const [products, setProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- STATS STATE ---
  const [stats, setStats] = useState({
    totalOrders: 0,
    pending: 0,
    delivered: 0,
    revenue: 0
  });

  useEffect(() => {
    if (location.pathname.includes('products')) {
      setActiveTab('products');
    } else {
      setActiveTab('orders');
      if (location.pathname.includes('pending')) setOrderStatusFilter('Pending');
      else if (location.pathname.includes('delivered')) setOrderStatusFilter('Delivered');
      else setOrderStatusFilter('All');
    }
  }, [location.pathname]);

  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      const { data } = await api.get('/orders'); 
      const sortedOrders = data.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setOrders(sortedOrders);
      calculateStats(sortedOrders);
    } catch (error) {
      console.error("Failed to fetch admin orders:", error);
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
        setProductsLoading(true);
        const { data } = await api.get('/products');
        const productsList = Array.isArray(data) ? data : (data.items || []);
        setProducts(productsList);
    } catch (error) {
        console.error("Failed to fetch products:", error);
    } finally {
        setProductsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, []);

  const calculateStats = (data: any[]) => {
    const totalOrders = data.length;
    const pending = data.filter(o => ['Processing', 'Pending'].includes(o.orderStatus)).length;
    const delivered = data.filter(o => o.orderStatus === 'Delivered').length;
    const revenue = data.reduce((acc, order) => acc + getOrderTotal(order), 0); 
    setStats({ totalOrders, pending, delivered, revenue });
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, orderStatus: newStatus } : o));
        await api.put(`/orders/${orderId}/${newStatus}`);
        fetchOrders(); 
    } catch (error) {
       alert("Failed to update status.");
       fetchOrders(); 
    }
  };

  const handleApprovePayment = async (orderId: string) => {
    try {
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, paymentStatus: 'Paid' } : o));
        await api.put(`/orders/${orderId}/approve-payment`);
        fetchOrders(); 
    } catch (error) {
       alert("Failed to approve payment.");
       fetchOrders(); 
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
        setUploading(true);
        const response = await api.post('/products/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' }});
        alert(`Success! ${response.data.count} products added/updated.`);
        fetchProducts(); 
    } catch (error: any) {
        alert(error.response?.data?.message || 'Upload failed.');
    } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteAllProducts = async () => {
    if (!window.confirm("⚠️ WARNING: Are you sure you want to delete ALL products?\nThis action cannot be undone!")) return;
    try {
        setProductsLoading(true);
        await api.delete('/products/delete-all'); 
        setProducts([]);
        alert("All products deleted successfully.");
    } catch (error) {
        alert("Failed to delete all products.");
    } finally {
        setProductsLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
      if(!window.confirm("Are you sure you want to delete this product?")) return;
      try {
          await api.delete(`/products/${id}`); 
          setProducts(prev => prev.filter(p => p._id !== id));
      } catch (error) {
          alert("Failed to delete product");
      }
  };

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category || 'Uncategorized')))];
  
  const filteredProducts = products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(productSearchTerm.toLowerCase());
      const matchesCat = selectedCategory === 'All' || p.category === selectedCategory || (!p.category && selectedCategory === 'Uncategorized');
      return matchesSearch && matchesCat;
  });

  const filteredOrders = orders.filter(o => {
      // ✅ SEARCH BY NEW orderId OR OLD _id
      const displayId = o.orderId || o._id;
      const matchesSearch = displayId.toLowerCase().includes(orderSearchTerm.toLowerCase());
      
      const matchesStatus = orderStatusFilter === 'All' || 
                            (orderStatusFilter === 'Pending' && ['Processing', 'Pending'].includes(o.orderStatus)) ||
                            o.orderStatus === orderStatusFilter;
      return matchesSearch && matchesStatus;
  });

  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: `Invoice_${selectedOrder?.orderId || selectedOrder?._id}`,
    pageStyle: `
      @media print {
        body { visibility: hidden; margin: 0; padding: 0; }
        .print-container { visibility: visible; position: absolute; left: 0; top: 0; width: 100%; border: none !important; box-shadow: none !important; margin: 0; padding: 20px; }
        .no-print { display: none !important; }
        @page { margin: 0; size: auto; }
      }
    `
  });

  const openInvoice = (order: any) => {
    setSelectedOrder(order);
    setIsSheetOpen(true);
  };

  if (ordersLoading && products.length === 0) {
    return <div className="flex justify-center items-center h-96"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const selectedOrderSubtotal = selectedOrder ? selectedOrder.orderItems.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0) : 0;
  const selectedOrderDelivery = selectedOrderSubtotal > 199 ? 0 : 39;
  const selectedOrderGrandTotal = selectedOrderSubtotal + selectedOrderDelivery;

  return (
    <div className="space-y-6">
      
      {/* HEADER & TABS CONTROLLER */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground text-sm">Manage your store efficiently.</p>
        </div>

        <div className="flex p-1 bg-muted rounded-lg">
            <button 
                onClick={() => { setActiveTab('orders'); setOrderStatusFilter('All'); }}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'orders' ? 'bg-white shadow text-primary' : 'text-muted-foreground hover:text-primary'}`}
            >
                Orders
            </button>
            <button 
                onClick={() => setActiveTab('products')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'products' ? 'bg-white shadow text-primary' : 'text-muted-foreground hover:text-primary'}`}
            >
                Products
            </button>
        </div>
      </div>

      {activeTab === 'orders' && (
        <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-border/50"><CardContent className="p-6 flex justify-between items-center"><div><p className="text-sm text-muted-foreground">Total Orders</p><p className="text-2xl font-bold text-primary">{stats.totalOrders}</p></div><Package className="h-8 w-8 text-primary/50" /></CardContent></Card>
                <Card className="border-border/50"><CardContent className="p-6 flex justify-between items-center"><div><p className="text-sm text-muted-foreground">Pending</p><p className="text-2xl font-bold text-orange-600">{stats.pending}</p></div><Clock className="h-8 w-8 text-orange-600/50" /></CardContent></Card>
                <Card className="border-border/50"><CardContent className="p-6 flex justify-between items-center"><div><p className="text-sm text-muted-foreground">Delivered</p><p className="text-2xl font-bold text-green-600">{stats.delivered}</p></div><CheckCircle className="h-8 w-8 text-green-600/50" /></CardContent></Card>
                <Card className="border-border/50"><CardContent className="p-6 flex justify-between items-center"><div><p className="text-sm text-muted-foreground">Revenue</p><p className="text-2xl font-bold text-blue-600">{formatPrice(stats.revenue)}</p></div><TrendingUp className="h-8 w-8 text-blue-600/50" /></CardContent></Card>
            </div>

            <Card className="border-border/50">
                <CardHeader className="flex flex-col md:flex-row gap-4 justify-between md:items-center py-4 border-b bg-muted/20">
                    <CardTitle className="text-lg">{orderStatusFilter} Orders</CardTitle>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search by Order ID..." 
                            className="pl-9 h-9"
                            value={orderSearchTerm}
                            onChange={(e) => setOrderSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                <div className="divide-y divide-border">
                    {filteredOrders.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground">No orders found matching "{orderSearchTerm}" in {orderStatusFilter}.</div>
                    ) : (
                        filteredOrders.map(order => (
                        <div key={order._id} className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-muted/20 transition-colors">
                            <div className="flex-1 cursor-pointer" onClick={() => openInvoice(order)}>
                            <div className="flex items-center gap-2 mb-1">
                                {/* ✅ PROFESSIONAL ORDER ID */}
                                <span className="font-mono font-bold text-lg">#{order.orderId || order._id.slice(-6).toUpperCase()}</span>
                                <Badge className={getStatusColor(order.orderStatus)} variant="secondary">{order.orderStatus}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">{order.user?.name || "Guest"} • {new Date(order.createdAt).toLocaleDateString()}</p>
                            <p className="text-sm font-medium">{order.orderItems.length} Items • {formatPrice(getOrderTotal(order))}</p>
                            </div>
                            <div className="flex flex-wrap items-center justify-end gap-2 mt-2 md:mt-0">
                            {order.paymentStatus === 'Pending Verification' && (
                                <Button size="sm" variant="outline" className="border-orange-500 text-orange-600 hover:bg-orange-50" onClick={() => handleApprovePayment(order._id)}>
                                    Approve Payment
                                </Button>
                            )}
                            <Button variant="outline" size="sm" onClick={() => openInvoice(order)}><Eye className="h-4 w-4 mr-1" /> Details</Button>
                            {(order.orderStatus === 'Processing' || order.orderStatus === 'Pending') && (
                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleUpdateStatus(order._id, 'Shipped')}><Truck className="h-4 w-4 mr-1" /> Ship</Button>
                            )}
                            {order.orderStatus === 'Shipped' && (
                                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleUpdateStatus(order._id, 'Delivered')}><CheckCircle className="h-4 w-4 mr-1" /> Deliver</Button>
                            )}
                            </div>
                        </div>
                        ))
                    )}
                </div>
                </CardContent>
            </Card>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search products by name..." 
                        className="pl-9"
                        value={productSearchTerm}
                        onChange={(e) => setProductSearchTerm(e.target.value)}
                    />
                </div>
                
                <div className="flex gap-2">
                    {products.length > 0 && (
                        <Button variant="destructive" onClick={handleDeleteAllProducts} disabled={productsLoading}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete All
                        </Button>
                    )}
                    <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileUpload} />
                    <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                        {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                        {uploading ? 'Importing...' : 'Import CSV'}
                    </Button>
                </div>
            </div>

            <Card className="border-border/50">
                <CardHeader className="py-4 border-b bg-muted/20">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        <span className="text-sm font-bold text-muted-foreground uppercase mr-2 shrink-0">Categories:</span>
                        {categories.map(cat => (
                            <Badge 
                                key={cat} 
                                variant={selectedCategory === cat ? 'default' : 'outline'}
                                className="cursor-pointer shrink-0 py-1.5 px-3 text-sm"
                                onClick={() => setSelectedCategory(cat)}
                            >
                                {cat}
                            </Badge>
                        ))}
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="relative w-full overflow-auto max-h-[600px]">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs uppercase bg-muted/50 text-muted-foreground sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3">Product</th>
                                    <th className="px-4 py-3">Category</th>
                                    <th className="px-4 py-3">Price</th>
                                    <th className="px-4 py-3 text-center">Stock</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {productsLoading ? (
                                    <tr><td colSpan={5} className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto"/></td></tr>
                                ) : filteredProducts.length === 0 ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No products found matching your search or category.</td></tr>
                                ) : (
                                    filteredProducts.map((product) => (
                                        <tr key={product._id} className="hover:bg-muted/10">
                                            <td className="px-4 py-3 font-medium flex items-center gap-3">
                                                {product.images && product.images[0] && (
                                                    <img src={product.images[0]} alt="" className="h-10 w-10 rounded object-cover border" />
                                                )}
                                                <span className="line-clamp-1">{product.name}</span>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">{product.category}</td>
                                            <td className="px-4 py-3 font-semibold">{formatPrice(product.finalPrice || product.price)}</td>
                                            <td className="px-4 py-3 text-center"><Badge variant="outline">{product.stock || 0}</Badge></td>
                                            <td className="px-4 py-3 text-right">
                                                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteProduct(product._id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
      )}

      {/* ✅ UPDATED INVOICE SHEET */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-[95vw] sm:max-w-3xl overflow-y-auto">
          <SheetHeader className="mb-6 flex flex-row items-center justify-between">
              <SheetTitle>Order Invoice</SheetTitle>
              <Button size="sm" variant="outline" onClick={() => handlePrint()}><Printer className="h-4 w-4 mr-2" /> Print Invoice</Button>
          </SheetHeader>
          
          {selectedOrder && (
          <div ref={invoiceRef} className="print-container p-6 sm:p-8 bg-white text-black border rounded-lg shadow-sm">
                
                <div className="flex flex-col sm:flex-row justify-between border-b-2 border-gray-200 pb-6 mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                          <img src="/logo.png" alt="Tech_Masters Logo" className="h-10 w-10 object-contain" />
                          <h2 className="text-3xl font-black tracking-tight">
                            <span style={{color: '#6d28d9'}}>Tech</span>
                            <span style={{color: '#111'}}>_</span>
                            <span style={{color: '#f59e0b'}}>Masters</span>
                          </h2>
                        </div>
                        <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Official Invoice</p>
                    </div>
                    <div className="text-left sm:text-right mt-4 sm:mt-0">
                        {/* ✅ PROFESSIONAL ORDER ID ON INVOICE */}
                        <p className="text-xl font-bold">#{selectedOrder.orderId || selectedOrder._id.slice(-8).toUpperCase()}</p>
                        <p className="text-sm text-gray-600 mt-1">Date: {new Date(selectedOrder.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border border-gray-100">
                    <div className="flex items-center gap-3 mb-2 sm:mb-0">
                        <span className="text-xs font-bold text-gray-500 uppercase">Status:</span>
                        <Badge className={`${getStatusColor(selectedOrder.orderStatus)}`}>{selectedOrder.orderStatus}</Badge>
                    </div>
                    {['Processing', 'Shipped'].includes(selectedOrder.orderStatus) && (
                        <div className="flex items-center gap-2 text-orange-600 font-bold">
                            <Clock className="h-4 w-4" /> 
                            <span>Deliver By: {calculateTimeLeft(selectedOrder.deliveryDeadline)}</span>
                        </div>
                    )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Customer Info</p>
                        <p className="font-bold text-lg text-gray-900">{selectedOrder.user?.name || 'Guest User'}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-2"><Mail className="h-4 w-4" /> {selectedOrder.user?.email || 'N/A'}</div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1"><Phone className="h-4 w-4" /> {selectedOrder.shippingAddress?.phone || 'N/A'}</div>
                        {selectedOrder.user?.altPhone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1"><Phone className="h-4 w-4" /> {selectedOrder.user.altPhone} (Alt)</div>
                        )}
                    </div>
                    
                    <div className="sm:text-right">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Shipping Address</p>
                        <p className="text-sm font-medium text-gray-900 leading-relaxed">
                            {selectedOrder.shippingAddress?.address}<br/>
                            {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.postalCode}<br/>
                            {selectedOrder.shippingAddress?.country || 'India'}
                        </p>
                    </div>
                </div>

                <table className="w-full text-sm mb-8">
                    <thead className="bg-gray-100 border-y-2 border-gray-200">
                        <tr>
                            <th className="text-left py-3 px-4 font-bold text-gray-700">Item Description</th>
                            <th className="text-center py-3 px-4 font-bold text-gray-700 w-24">Qty</th>
                            <th className="text-right py-3 px-4 font-bold text-gray-700 w-32">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {selectedOrder.orderItems.map((item: any, idx: number) => (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                <td className="py-4 px-4 font-medium text-gray-900">{item.name}</td>
                                <td className="text-center py-4 px-4 text-gray-600">{item.quantity}</td>
                                <td className="text-right py-4 px-4 font-bold text-gray-900">{formatPrice(item.price * item.quantity)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="flex flex-col sm:flex-row justify-between items-end border-t-2 border-gray-200 pt-6">
                    <div className="w-full sm:w-auto mb-4 sm:mb-0">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Payment Details</p>
                        <p className="text-sm text-gray-700 mb-1"><span className="font-semibold">Method:</span> <span className="uppercase">{selectedOrder.paymentMethod}</span></p>
                        {selectedOrder.transactionId && (
                            <p className="text-sm text-gray-700 mb-1"><span className="font-semibold">UTR/Ref:</span> {selectedOrder.transactionId}</p>
                        )}
                        <p className="text-sm text-gray-700"><span className="font-semibold">Status:</span> <Badge variant="outline" className={selectedOrder.paymentStatus === 'Paid' ? 'text-green-600 border-green-600' : 'text-orange-600 border-orange-600'}>{selectedOrder.paymentStatus || 'Pending'}</Badge></p>
                    </div>
                    
                    <div className="w-full sm:w-64 bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-center mb-2 text-sm text-gray-600">
                            <span>Subtotal</span>
                            <span className="font-medium text-gray-900">{formatPrice(selectedOrderSubtotal)}</span>
                        </div>
                        
                        <div className="flex justify-between items-center mb-4 text-sm text-gray-600">
                            <span>Delivery</span>
                            <span className={selectedOrderDelivery === 0 ? "font-bold text-green-600" : "font-medium text-gray-900"}>
                              {selectedOrderDelivery === 0 ? 'Free' : formatPrice(selectedOrderDelivery)}
                            </span>
                        </div>

                        <div className="flex justify-between text-2xl font-black text-blue-900 border-t border-gray-200 pt-3 pb-1">
                            <span>Total</span>
                            <span>{formatPrice(selectedOrderGrandTotal)}</span>
                        </div>
                        <p className="text-[10px] text-gray-500 text-right uppercase tracking-wider">Inclusive of all taxes</p>
                    </div>
                </div>

                <div className="mt-16 text-center text-xs text-gray-400 border-t border-gray-200 pt-4">
                    <p className="font-bold mb-1 text-gray-500">Thank you for shopping with Tech_Masters!</p>
                    <p>This is a computer-generated document. No signature is required.</p>
                </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AdminDashboard;