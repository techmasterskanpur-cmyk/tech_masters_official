import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { ArrowLeft, MapPin, CreditCard, Package, Loader2, AlertCircle, Printer, Mail, Phone, Clock as ClockIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DeliveryTimer } from '@/components/common/DeliveryTimer';
import { useAuth } from '@/context/AppContext'; 
// @ts-ignore
import api from '@/api/axios'; 

// Helper to format price
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
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

// Status Configuration
const statusConfig: Record<string, { label: string; color: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  'Pending': { label: 'Pending', color: 'text-muted-foreground', variant: 'outline' },
  'Processing': { label: 'Processing', color: 'text-primary', variant: 'secondary' },
  'Shipped': { label: 'Shipped', color: 'text-blue-600', variant: 'default' },
  'Delivered': { label: 'Delivered', color: 'text-green-600', variant: 'secondary' },
  'Cancelled': { label: 'Cancelled', color: 'text-red-600', variant: 'destructive' },
};

// Global Print Styles
const printStyles = `
  @media print {
    body * { visibility: hidden; }
    .print-container, .print-container * { visibility: visible; }
    .print-container { position: absolute; left: 0; top: 0; width: 100% !important; margin: 0 !important; padding: 0 !important; }
    @page { margin: 10mm; }
  }
`;

const OrderDetail = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { user: currentUser } = useAuth();
  const invoiceRef = useRef(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/orders/myorders');
        
        // Match the URL parameter with either the internal _id or the custom orderId
        const foundOrder = data.find((o: any) => o._id === orderId || o.orderId === orderId);
        
        if (foundOrder) {
          setOrder(foundOrder);
        } else {
          setError('Order not found.');
        }
      } catch (err) {
        console.error("Error fetching order details:", err);
        setError('Failed to load order details.');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
    // Use professional ID for the saved PDF filename
    documentTitle: `Invoice_${order?.orderId || order?._id}`,
    pageStyle: printStyles
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-12">
        <div className="flex justify-center mb-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold mb-4">{error || 'Order not found'}</h2>
        <Button asChild>
          <Link to="/dashboard/orders">Back to Orders</Link>
        </Button>
      </div>
    );
  }

  const statusKey = Object.keys(statusConfig).find(
    key => key.toLowerCase() === (order.orderStatus || '').toLowerCase()
  ) || 'Processing';
  
  const statusInfo = statusConfig[statusKey];
  const isActive = !['Delivered', 'Cancelled'].includes(order.orderStatus);

  const steps = ['Processing', 'Shipped', 'Delivered'];
  const currentStep = {
    'Pending': 0,
    'Processing': 0,
    'Shipped': 1,
    'Delivered': 2,
    'Cancelled': -1,
  }[order.orderStatus] || 0;

  const subtotal = order.orderItems.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
  const deliveryCharge = subtotal > 199 ? 0 : 39;
  const grandTotal = subtotal + deliveryCharge;

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link to="/dashboard/orders">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Link>
          </Button>

          <Button onClick={() => handlePrint()} variant="outline" className="gap-2 border-primary/20 hover:bg-primary/5">
             <Printer className="h-4 w-4" /> Download Invoice
          </Button>
      </div>

      {/* Order Header */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              {/* ✅ PROFESSIONAL ORDER ID */}
              <CardTitle className="font-mono text-lg">Order #{order.orderId || order._id.slice(-8).toUpperCase()}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                })}
              </p>
            </div>
            <Badge variant={statusInfo.variant} className={`text-sm px-3 py-1`}>
              {statusInfo.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {order.orderStatus !== 'Cancelled' && (
            <div className="mb-8 mt-2">
              <div className="flex items-center justify-between relative z-10">
                {steps.map((step, index) => (
                  <div key={step} className={`flex flex-col items-center ${index <= currentStep ? 'text-primary' : 'text-muted-foreground'}`}>
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors duration-300 ${index <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      {index < currentStep ? '✓' : index + 1}
                    </div>
                    <span className="text-xs mt-2 font-medium">{step}</span>
                  </div>
                ))}
              </div>
              <div className="relative -mt-6 mx-4 h-1 bg-muted rounded z-0">
                <div className="absolute top-0 left-0 h-1 bg-primary rounded transition-all duration-500" style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }} />
              </div>
            </div>
          )}

          {isActive && order.deliveryDeadline && (
            <div className="mb-2 p-4 bg-secondary/10 rounded-lg border border-secondary/20">
              <DeliveryTimer createdAt={order.createdAt} estimatedDelivery={order.deliveryDeadline} />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-border/50 h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-5 w-5 text-primary" /> Order Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.orderItems.map((item: any, index: number) => (
                <div key={index} className="flex gap-4">
                  <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0 border">
                      {item.image || (item.product && item.product.image) ? (
                        <img src={item.image || item.product.image} alt="" className="h-full w-full object-cover" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
                      ) : (
                        <Package className="h-6 w-6 text-muted-foreground" />
                      )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium line-clamp-2">{item.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-6" />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery</span>
                <span className={deliveryCharge === 0 ? "text-green-600 font-medium" : "text-foreground font-medium"}>
                  {deliveryCharge === 0 ? 'Free' : formatPrice(deliveryCharge)}
                </span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatPrice(grandTotal)}</span> 
              </div>
              <p className="text-xs text-muted-foreground text-right -mt-1">Inclusive of all taxes</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-5 w-5 text-primary" /> Delivery Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.shippingAddress ? (
                  <>
                      <p className="font-semibold text-base mb-1">{order.user?.name || currentUser?.name || "Customer"}</p>
                      <p className="text-muted-foreground">{order.shippingAddress.address}</p>
                      <p className="text-muted-foreground">{order.shippingAddress.city}, {order.shippingAddress.postalCode}</p>
                      <p className="text-muted-foreground">{order.shippingAddress.country || 'India'}</p>
                      
                      <div className="flex flex-col gap-1 mt-3">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <span className="bg-primary/10 text-primary px-2 py-1 rounded flex items-center gap-1 w-fit">
                             <Phone className="h-3 w-3" /> {order.shippingAddress.phone}
                          </span>
                        </div>
                        {(order.user?.altPhone || (currentUser as any)?.altPhone) && (
                           <div className="flex items-center gap-2 text-sm font-medium mt-1">
                             <span className="bg-muted text-muted-foreground px-2 py-1 rounded flex items-center gap-1 w-fit">
                                <Phone className="h-3 w-3" /> {order.user?.altPhone || (currentUser as any)?.altPhone} (Alt)
                             </span>
                           </div>
                        )}
                      </div>
                  </>
              ) : (
                  <p className="text-muted-foreground italic">Address details unavailable</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-5 w-5 text-primary" /> Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center p-2 bg-muted/30 rounded">
                <span className="text-muted-foreground">Method</span>
                <span className="font-medium uppercase text-sm">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted/30 rounded">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={order.paymentStatus === 'Paid' ? 'secondary' : 'outline'} className={order.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : 'text-orange-600 border-orange-200 bg-orange-50'}>
                  {order.paymentStatus || 'Pending'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ✅ PROFESSIONAL INVOICE TEMPLATE (Print Only) */}
      <div className="hidden print:block">
        <div ref={invoiceRef} className="print-container p-6 sm:p-8 bg-white text-black font-sans">
            <div className="flex justify-between items-start border-b-2 border-gray-200 pb-6 mb-6">
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
                <div className="text-right">
                    {/* ✅ PROFESSIONAL ORDER ID ON INVOICE */}
                    <p className="text-xl font-bold">#{order.orderId || order._id.slice(-8).toUpperCase()}</p>
                    <p className="text-sm text-gray-600 mt-1">Date: {new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center mb-8 border border-gray-100">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-500 uppercase">Status:</span>
                    <span className={`px-2 py-1 text-xs font-bold rounded uppercase ${order.orderStatus === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {order.orderStatus}
                    </span>
                </div>
                {['Processing', 'Shipped'].includes(order.orderStatus) && (
                    <div className="flex items-center gap-2 text-orange-600 font-bold text-sm">
                        <ClockIcon className="h-4 w-4" /> 
                        <span>Deliver By: {calculateTimeLeft(order.deliveryDeadline)}</span>
                    </div>
                )}
            </div>
            
            <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 border-b pb-1 w-fit">Billed To</p>
                    <p className="font-bold text-lg text-gray-900">{order.user?.name || currentUser?.name || 'Guest User'}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-2"><Mail className="h-4 w-4" /> {order.user?.email || currentUser?.email || 'N/A'}</div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1"><Phone className="h-4 w-4" /> {order.shippingAddress?.phone || 'N/A'}</div>
                    {(order.user?.altPhone || (currentUser as any)?.altPhone) && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1"><Phone className="h-4 w-4" /> {order.user?.altPhone || (currentUser as any)?.altPhone} (Alt)</div>
                    )}
                </div>
                
                <div className="text-right">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 border-b pb-1 w-fit ml-auto">Shipped To</p>
                    <p className="text-sm font-medium text-gray-900 leading-relaxed">
                        {order.shippingAddress?.address}<br/>
                        {order.shippingAddress?.city}, {order.shippingAddress?.postalCode}<br/>
                        {order.shippingAddress?.country || 'India'}
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
                    {order.orderItems.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                            <td className="py-4 px-4 font-medium text-gray-900">{item.name}</td>
                            <td className="text-center py-4 px-4 text-gray-600">{item.quantity}</td>
                            <td className="text-right py-4 px-4 font-bold text-gray-900">{formatPrice(item.price * item.quantity)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="flex justify-between items-end border-t-2 border-gray-200 pt-6">
                <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Payment Details</p>
                    <p className="text-sm text-gray-700 mb-1"><span className="font-semibold">Method:</span> <span className="uppercase">{order.paymentMethod}</span></p>
                    <p className="text-sm text-gray-700">
                        <span className="font-semibold">Status:</span> 
                        <span className={`ml-2 px-2 py-0.5 rounded text-xs font-bold uppercase ${order.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                            {order.paymentStatus || 'Pending'}
                        </span>
                    </p>
                </div>
                
                <div className="w-64">
                    <div className="flex justify-between items-center mb-2 text-sm text-gray-600">
                        <span>Subtotal</span>
                        <span className="font-medium text-gray-900">{formatPrice(subtotal)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center mb-4 text-sm text-gray-600">
                        <span>Delivery</span>
                        <span className={deliveryCharge === 0 ? "font-bold text-green-600" : "font-medium text-gray-900"}>
                          {deliveryCharge === 0 ? 'Free' : formatPrice(deliveryCharge)}
                        </span>
                    </div>
                    
                    <div className="flex justify-between text-xl font-black text-blue-900 border-t-2 border-gray-200 pt-2 pb-1">
                        <span>Grand Total</span>
                        <span>{formatPrice(grandTotal)}</span>
                    </div>
                    <p className="text-[10px] text-gray-500 text-right uppercase tracking-wider">Inclusive of all taxes</p>
                </div>
            </div>

            <div className="mt-16 text-center text-xs text-gray-400 border-t border-gray-200 pt-4">
                <p className="font-bold mb-1 text-gray-500">Thank you for shopping with Tech_Masters!</p>
                <p>This is a computer-generated document. No signature is required.</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;