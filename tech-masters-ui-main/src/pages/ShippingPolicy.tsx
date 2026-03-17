import React, { useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Truck } from 'lucide-react';

const ShippingPolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      {/* Header Banner matching your Home Page */}
      <section className="relative overflow-hidden gradient-hero text-primary-foreground py-16">
        <div className="absolute inset-0 tech-grid opacity-10" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="h-16 w-16 mx-auto rounded-full bg-secondary/20 flex items-center justify-center mb-6 shadow-glow-secondary">
            <Truck className="h-8 w-8 text-secondary" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4 animate-fade-in">Shipping & Delivery Policy</h1>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto text-lg animate-slide-up">
            Lightning-fast 50-Hour delivery exclusively for Kanpur.
          </p>
        </div>
      </section>

      {/* Main Legal Content */}
      <main className="flex-grow container mx-auto px-4 py-12 max-w-4xl">
        <Card className="border-border/50 shadow-lg animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <CardContent className="p-8 md:p-12 space-y-8">
            
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3 flex items-center gap-2">
                <span className="text-primary">1.</span> Coverage Area & Feasibility
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Tech_Masters currently limits its primary fulfillment and delivery operations strictly within the geographical boundaries of Kanpur, Uttar Pradesh. We specialize in providing hyper-local, rapid delivery for electronics enthusiasts, DIY creators, and hardware engineers. Orders placed from outside our serviceable pin codes may be automatically cancelled and refunded.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3 flex items-center gap-2">
                <span className="text-primary">2.</span> The 50-Hour Fulfillment Guarantee
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Our unique value proposition is the 50-Hour Delivery window. The countdown commences exactly when our payment gateway partner (Razorpay) confirms the successful capture of your funds. Our logistics team is mandated to ensure the physical handover of your package within 50 working hours.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3 flex items-center gap-2">
                <span className="text-primary">3.</span> Shipping Charges
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Shipping costs are calculated dynamically at checkout based on the volumetric weight of your electronic components and your specific Kanpur pin code. All shipping fees are non-refundable once the package has been dispatched from our facility.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3 flex items-center gap-2">
                <span className="text-primary">4.</span> Order Tracking & Updates
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Once your order is processed, you will receive an automated email and SMS notification containing your order invoice and live tracking details. You can also monitor the 50-hour countdown directly from your Tech_Masters User Dashboard under the 'Orders' section.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3 flex items-center gap-2">
                <span className="text-primary">5.</span> Force Majeure & Unexpected Delays
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                While we strictly adhere to our 50-hour policy, Tech_Masters shall not be held liable for delivery delays caused by "Force Majeure" events. This includes, but is not limited to, severe weather conditions, acts of God, local curfews, administrative lock-downs, or strikes within the Kanpur region.
              </p>
            </section>

          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
};

export default ShippingPolicy;