import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DeliveryTimer } from '@/components/common/DeliveryTimer';
// @ts-ignore
import api from '../../api/axios'; 

// Helper to format price
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
};

// Dynamically calculate true total including delivery rules
const getOrderTotal = (order: any) => {
  if (!order || !order.orderItems) return 0;
  const subtotal = order.orderItems.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
  const delivery = subtotal > 199 ? 0 : 39;
  return subtotal + delivery;
};

// Updated Config to match Backend Enums
const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  'Pending': { label: 'Pending', variant: 'outline' },
  'Processing': { label: 'Processing', variant: 'secondary' },
  'Shipped': { label: 'Shipped', variant: 'default' },
  'Delivered': { label: 'Delivered', variant: 'secondary' },
  'Cancelled': { label: 'Cancelled', variant: 'destructive' },
};

const DashboardOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch Real Orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/orders/myorders');
        
        // Sort by newest first
        const sortedOrders = data.sort((a: any, b: any) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        setOrders(sortedOrders);
      } catch (err) {
        console.error("Failed to fetch orders", err);
        setError("Could not load your orders.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-12 text-center">
          <div className="h-16 w-16 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
          <p className="text-muted-foreground mb-4">
            Start shopping to see your orders here.
          </p>
          <Button variant="default" asChild>
            <Link to="/products">Browse Products</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            My Orders
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {orders.map(order => {
              // Handle Case Sensitivity for Status
              const statusKey = Object.keys(statusConfig).find(
                key => key.toLowerCase() === order.orderStatus.toLowerCase()
              ) || 'Processing';
              
              const statusInfo = statusConfig[statusKey];
              const isActive = !['Delivered', 'Cancelled'].includes(order.orderStatus);

              return (
                <div key={order._id} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Order Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* ✅ IMPLEMENTED PROFESSIONAL ORDER ID */}
                        <span className="font-mono text-sm font-semibold">
                          #{order.orderId || order._id.slice(-8).toUpperCase()}
                        </span>
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Products */}
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {order.orderItems.slice(0, 3).map((item: any, idx: number) => (
                            <div key={idx} className="h-10 w-10 rounded-lg border-2 border-background overflow-hidden bg-muted flex items-center justify-center">
                                {item.image || item.product?.image ? (
                                    <img 
                                        src={item.image || item.product?.image} 
                                        alt="" 
                                        className="h-full w-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                ) : (
                                    <Package className="h-5 w-5 text-muted-foreground" />
                                )}
                            </div>
                          ))}
                          {order.orderItems.length > 3 && (
                            <div className="h-10 w-10 rounded-lg border-2 border-background bg-muted flex items-center justify-center text-xs font-medium">
                              +{order.orderItems.length - 3}
                            </div>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {order.orderItems.reduce((sum: number, item: any) => sum + item.quantity, 0)} items
                        </span>
                      </div>

                      {/* Delivery Timer */}
                      {isActive && order.deliveryDeadline && (
                        <DeliveryTimer
                          createdAt={order.createdAt}
                          estimatedDelivery={order.deliveryDeadline}
                          compact
                        />
                      )}
                    </div>

                    {/* Price & Action */}
                    <div className="flex items-center justify-between lg:flex-col lg:items-end gap-2">
                      <div className="text-right">
                        <p className="font-bold text-lg">{formatPrice(getOrderTotal(order))}</p>
                        <p className="text-xs text-muted-foreground uppercase mt-0.5">
                          {order.paymentMethod}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        {/* Note: the link still uses _id for routing, which is correct for MongoDB lookups */}
                        <Link to={`/dashboard/orders/${order._id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardOrders;