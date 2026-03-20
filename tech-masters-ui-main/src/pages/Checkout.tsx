import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Truck, CreditCard, Banknote, Clock, Loader2, Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useCart, useAuth } from '@/context/AppContext';
// @ts-ignore
import api from '../api/axios'; 

// Helper to format price
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
};

const Checkout = () => {
  const navigate = useNavigate();
  // @ts-ignore
  // ✅ PULLING deliveryCharge INSTEAD OF gst
  const { items, subtotal, deliveryCharge, total, clearCart, updateQuantity, removeItem } = useCart();
  // @ts-ignore
  const { user, isAuthenticated } = useAuth();
  
  // Initialize state
  const initialAddress = (user && user.addresses && user.addresses.length > 0) ? "0" : 'new';
  const [selectedAddressId, setSelectedAddressId] = useState<string>(initialAddress);
  
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('online');
  const [isLoading, setIsLoading] = useState(false);
  
  const [showNewAddress, setShowNewAddress] = useState(initialAddress === 'new');

  // New Address Form State
  const [newAddress, setNewAddress] = useState({
    name: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
  });

  // Protect the route! Redirect if not logged in.
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground">
        <h2 className="text-2xl font-bold mb-2">You are almost there!</h2>
        <p className="text-muted-foreground mb-6">Please log in or create an account to securely place your order.</p>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => navigate('/products')}>Continue Shopping</Button>
          <Button onClick={() => navigate('/login')}>Log In / Sign Up</Button>
        </div>
      </div>
    );
  }

  // Redirect if cart is empty
  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h2 className="text-xl font-bold">Your cart is empty</h2>
        <Button className="mt-4" onClick={() => navigate('/products')}>Go Shopping</Button>
      </div>
    );
  }

  const handleProceedToPayment = async () => {
    setIsLoading(true);
    try {
      // 1. Prepare Shipping Address
      let shippingAddress;

      if (showNewAddress || selectedAddressId === 'new') {
        // Validation
        if (!newAddress.line1 || !newAddress.city || !newAddress.phone || !newAddress.pincode) {
          alert("Please fill in address line 1, city, pincode, and phone number.");
          setIsLoading(false);
          return;
        }
        
        shippingAddress = {
          address: `${newAddress.line1}, ${newAddress.line2 || ''}`, 
          city: newAddress.city,
          postalCode: newAddress.pincode, 
          country: 'India',
          phone: newAddress.phone
        };
      } else {
        // Use Saved Address based on array index
        const addressIndex = parseInt(selectedAddressId);
        
        // BYPASS TYPESCRIPT ERROR
        const savedAddr: any = user?.addresses[addressIndex];
        
        if (!savedAddr) {
          alert("Please select a valid address.");
          setIsLoading(false);
          return;
        }
        
        // Extract the actual street data without the [Label]
        let cleanStreet = savedAddr.street;
        if (cleanStreet?.startsWith('[')) {
            const closeBracketIdx = cleanStreet.indexOf(']');
            if (closeBracketIdx > -1) {
                cleanStreet = cleanStreet.substring(closeBracketIdx + 1).trim();
            }
        }

        // Map Saved Address to Backend Order Format
        shippingAddress = {
          address: cleanStreet,
          city: savedAddr.city,
          postalCode: savedAddr.zip,
          country: 'India',
          phone: savedAddr.phone || user.phone || "Not Provided"
        };
      }

      // 2. Prepare Order Data
      const orderPayload = {
        orderItems: items.map((item: any) => ({
          product: item.product.id || item.product._id, 
          name: item.product.name,
          quantity: item.quantity, 
          price: item.product.price,
          image: item.product.image || (item.product.images ? item.product.images[0] : null)
        })),
        shippingAddress: shippingAddress, 
        paymentMethod: paymentMethod, 
        totalAmount: total,
        deliveryCharge: deliveryCharge // sending delivery charge to backend just in case
      };

      console.log("Sending Order Payload:", orderPayload); 

      // 3. API Call
      const { data } = await api.post('/orders', orderPayload);

      // 4. Success
      alert(`Order Placed Successfully!\n\nWe will contact you shortly for payment and confirmation.`);
      
      if(clearCart) clearCart(); 
      
      // Navigate to Orders page to see status
      navigate('/dashboard/orders'); 

    } catch (error: any) {
      console.error("Order Failed:", error);
      const errMsg = error.response?.data?.message || error.message || "Failed to place order";
      alert(`Error: ${errMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-8">Checkout</h1>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Side: Address & Payment */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Address Section */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Delivery Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {user && user.addresses && user.addresses.length > 0 && (
                    <RadioGroup 
                      value={showNewAddress ? "new" : selectedAddressId} 
                      onValueChange={(val) => {
                        if (val === "new") {
                          setShowNewAddress(true);
                          setSelectedAddressId("new");
                        } else {
                          setShowNewAddress(false);
                          setSelectedAddressId(val);
                        }
                      }}
                    >
                      {user.addresses.map((address: any, index: number) => {
                        // Display logic to cleanly show the address
                        let label = `Address ${index + 1}`;
                        let displayStreet = address.street;
                        
                        if (displayStreet?.startsWith('[')) {
                            const closeBracketIdx = displayStreet.indexOf(']');
                            if (closeBracketIdx > -1) {
                                label = displayStreet.substring(1, closeBracketIdx);
                                displayStreet = displayStreet.substring(closeBracketIdx + 1).trim();
                            }
                        }

                        return (
                          <div key={index} className={`flex items-start space-x-3 p-4 rounded-lg border transition-colors ${selectedAddressId === index.toString() && !showNewAddress ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/50'}`}>
                            <RadioGroupItem value={index.toString()} id={`addr-${index}`} className="mt-1" />
                            <label htmlFor={`addr-${index}`} className="flex-1 cursor-pointer">
                              <span className="font-semibold text-base">{label}</span>
                              <p className="text-sm text-foreground font-medium mt-1">{displayStreet}</p>
                              <p className="text-sm text-muted-foreground">{address.city}, {address.state} - {address.zip}</p>
                              <p className="text-sm text-muted-foreground mt-1">Phone: {address.phone}</p>
                            </label>
                          </div>
                        )
                      })}
                      
                      <div className="flex items-center space-x-3 p-4 rounded-lg border border-dashed border-border hover:border-primary/50 transition-colors mt-4">
                        <RadioGroupItem value="new" id="new-addr" />
                        <Label htmlFor="new-addr" className="cursor-pointer flex-1 font-medium">Add a new delivery address</Label>
                      </div>
                    </RadioGroup>
                  )}

                  {/* New Address Form */}
                  {(showNewAddress || !user?.addresses?.length) && (
                    <div className="space-y-4 p-5 border rounded-lg bg-muted/10 mt-4 shadow-inner">
                      <h4 className="font-semibold border-b pb-2">Enter Details</h4>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Full Name</Label>
                          <Input value={newAddress.name} onChange={e => setNewAddress({...newAddress, name: e.target.value})} placeholder="Full Name" />
                        </div>
                        <div className="space-y-2">
                          <Label>Phone (Required)</Label>
                          <Input value={newAddress.phone} onChange={e => setNewAddress({...newAddress, phone: e.target.value})} placeholder="9876543210" />
                        </div>
                      </div>
                      <div className="space-y-2">
                          <Label>Address Line 1</Label>
                          <Input value={newAddress.line1} onChange={e => setNewAddress({...newAddress, line1: e.target.value})} placeholder="House/Flat No., Building Name" />
                      </div>
                      <div className="space-y-2">
                          <Label>Address Line 2</Label>
                          <Input value={newAddress.line2} onChange={e => setNewAddress({...newAddress, line2: e.target.value})} placeholder="Area/Colony/Street (Optional)" />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-2">
                          <Label>City</Label>
                          <Input value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} placeholder="City" />
                        </div>
                        <div className="space-y-2">
                          <Label>State</Label>
                          <Input value={newAddress.state} onChange={e => setNewAddress({...newAddress, state: e.target.value})} placeholder="State" />
                        </div>
                        <div className="space-y-2">
                          <Label>Pincode</Label>
                          <Input value={newAddress.pincode} onChange={e => setNewAddress({...newAddress, pincode: e.target.value})} placeholder="Postal Code" />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)} className="space-y-3">
                    <div className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors ${paymentMethod === 'online' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/50'}`}>
                      <RadioGroupItem value="online" id="online" />
                      <Label htmlFor="online" className="cursor-pointer flex-1 font-medium">Online Payment (UPI/Card)</Label>
                    </div>
                    <div className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors ${paymentMethod === 'cod' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/50'}`}>
                      <RadioGroupItem value="cod" id="cod" />
                      <Label htmlFor="cod" className="cursor-pointer flex-1 font-medium">Cash on Delivery</Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            </div>

            {/* Right Side: Order Summary */}
            <div>
              <Card className="border-border/50 sticky top-24 shadow-md overflow-hidden">
                <CardHeader className="bg-muted/30 border-b pb-4">
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  
                  {/* INTERACTIVE CART ITEMS */}
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                    {items.map((item: any) => (
                      <div key={item.product.id || item.product._id} className="flex gap-3 items-start border-b border-border/50 pb-4 last:border-0 last:pb-0">
                        <div className="h-16 w-16 rounded-md border overflow-hidden shrink-0">
                          <img src={item.product.image || (item.product.images ? item.product.images[0] : '')} className="h-full w-full object-cover bg-muted" alt="" />
                        </div>
                        
                        <div className="flex-1 flex flex-col justify-between min-h-[4rem]">
                          <p className="text-sm font-semibold line-clamp-2 leading-tight pr-4">{item.product.name}</p>
                          
                          {/* New Quantity Controls */}
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center border rounded-md overflow-hidden">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 rounded-none hover:bg-muted"
                                onClick={() => updateQuantity(item.product.id || item.product._id, item.quantity - 1)}
                              >
                                {item.quantity === 1 ? <Trash2 className="h-3 w-3 text-destructive" /> : <Minus className="h-3 w-3" />}
                              </Button>
                              <span className="w-6 text-center text-xs font-medium">
                                {item.quantity}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 rounded-none hover:bg-muted"
                                onClick={() => updateQuantity(item.product.id || item.product._id, item.quantity + 1)}
                                disabled={item.quantity >= (item.product.stock || 99)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="text-sm font-bold text-right">{formatPrice(item.product.price * item.quantity)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />
                  
                  {/* ✅ DYNAMIC DELIVERY CHARGE UI */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm text-muted-foreground"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Delivery</span>
                      <span className={deliveryCharge === 0 ? "text-green-600 font-medium" : "text-foreground font-medium"}>
                        {deliveryCharge === 0 ? 'Free' : formatPrice(deliveryCharge)}
                      </span>
                    </div>
                    
                    <Separator className="my-2" />
                    
                    <div className="flex justify-between text-lg"><span>Total</span><span className="font-black text-primary">{formatPrice(total)}</span></div>
                    <p className="text-xs text-muted-foreground text-right -mt-2">Inclusive of all taxes</p>
                  </div>

                  {/* 50-HOUR DELIVERY BANNER */}
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mt-4 flex items-start gap-3">
                    <div className="bg-blue-100 p-2 rounded-full shrink-0">
                      <Clock className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-blue-900 leading-none mb-1">Guaranteed 50-Hour Delivery</p>
                      <p className="text-xs text-blue-700 leading-tight">Order now and receive your components within 50 hours, straight to your lab or workshop.</p>
                    </div>
                  </div>

                  <Button onClick={handleProceedToPayment} className="w-full h-12 text-base font-bold shadow-lg mt-2" disabled={isLoading || items.length === 0}>
                    {isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</> : 'Place Order Securely'}
                  </Button>
                </CardContent>
              </Card>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;