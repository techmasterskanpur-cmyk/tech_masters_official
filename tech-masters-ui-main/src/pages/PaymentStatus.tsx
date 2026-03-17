import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Package, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { formatPrice } from '@/data/mockData';
import { verifyPayment, handlePaymentSuccess, handlePaymentFailure } from '@/lib/handlers';
import { useCart } from '@/context/AppContext';

type PaymentState = 'processing' | 'success' | 'failed';

const PaymentStatus = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [status, setStatus] = useState<PaymentState>('processing');
  const [progress, setProgress] = useState(0);
  const [transactionId, setTransactionId] = useState<string>('');

  const { orderId, paymentId, amount, method } = location.state || {};

  useEffect(() => {
    if (!orderId) {
      navigate('/cart');
      return;
    }

    // If COD, immediately show success
    if (method === 'cod') {
      setStatus('success');
      clearCart();
      return;
    }

    // Simulate payment verification
    const verifyAndProcess = async () => {
      // Progress animation
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      try {
        const result = await verifyPayment(paymentId);
        clearInterval(progressInterval);
        setProgress(100);

        if (result.success) {
          setTransactionId(result.transactionId || '');
          handlePaymentSuccess(orderId, result.transactionId || '');
          setStatus('success');
          clearCart();
        } else {
          handlePaymentFailure(orderId, 'Payment verification failed');
          setStatus('failed');
        }
      } catch (error) {
        clearInterval(progressInterval);
        handlePaymentFailure(orderId, 'Payment error');
        setStatus('failed');
      }
    };

    verifyAndProcess();
  }, [orderId, paymentId, method, navigate, clearCart]);

  const renderContent = () => {
    switch (status) {
      case 'processing':
        return (
          <Card className="border-border/50 max-w-md mx-auto">
            <CardContent className="p-8 text-center space-y-6">
              <div className="relative">
                <div className="h-24 w-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="h-12 w-12 text-primary animate-spin" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold">Processing Payment</h1>
                <p className="text-muted-foreground mt-2">
                  Please wait while we verify your payment...
                </p>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground">
                Do not close this window or press back
              </p>
            </CardContent>
          </Card>
        );

      case 'success':
        return (
          <Card className="border-success/30 max-w-lg mx-auto overflow-hidden">
            <div className="h-2 bg-success" />
            <CardContent className="p-8 text-center space-y-6">
              <div className="h-24 w-24 mx-auto rounded-full bg-success/10 flex items-center justify-center animate-fade-in">
                <CheckCircle className="h-16 w-16 text-success" />
              </div>
              
              <div>
                <h1 className="text-2xl font-bold text-success">Payment Successful!</h1>
                <p className="text-muted-foreground mt-2">
                  Your order has been placed successfully.
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order ID</span>
                  <span className="font-mono font-semibold">{orderId}</span>
                </div>
                {transactionId && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Transaction ID</span>
                    <span className="font-mono text-sm">{transactionId}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount Paid</span>
                  <span className="font-bold text-lg">{formatPrice(amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Method</span>
                  <span>{method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</span>
                </div>
              </div>

              {/* Delivery Timer Preview */}
              <div className="bg-secondary/10 rounded-lg p-4">
                <div className="flex items-center justify-center gap-2 text-secondary-dark">
                  <Clock className="h-5 w-5" />
                  <span className="font-semibold">Delivery within 50 hours</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Track your order in the dashboard to see real-time delivery status
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="cta" className="flex-1" asChild>
                  <Link to="/dashboard/orders">
                    <Package className="mr-2 h-4 w-4" />
                    View My Orders
                  </Link>
                </Button>
                <Button variant="outline" className="flex-1" asChild>
                  <Link to="/products">
                    Continue Shopping
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'failed':
        return (
          <Card className="border-destructive/30 max-w-md mx-auto overflow-hidden">
            <div className="h-2 bg-destructive" />
            <CardContent className="p-8 text-center space-y-6">
              <div className="h-24 w-24 mx-auto rounded-full bg-destructive/10 flex items-center justify-center animate-fade-in">
                <XCircle className="h-16 w-16 text-destructive" />
              </div>
              
              <div>
                <h1 className="text-2xl font-bold text-destructive">Payment Failed</h1>
                <p className="text-muted-foreground mt-2">
                  We couldn't process your payment. Please try again.
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm">
                  If money was debited from your account, it will be refunded within 5-7 business days.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="cta" className="flex-1" asChild>
                  <Link to="/checkout">Try Again</Link>
                </Button>
                <Button variant="outline" className="flex-1" asChild>
                  <Link to="/cart">Back to Cart</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4">
        {renderContent()}
      </main>
      <Footer />
    </div>
  );
};

export default PaymentStatus;
