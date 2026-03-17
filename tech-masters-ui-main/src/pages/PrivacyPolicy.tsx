import React, { useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Shield } from 'lucide-react';

const PrivacyPolicy = () => {
  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <section className="relative overflow-hidden gradient-hero text-primary-foreground py-16">
        <div className="absolute inset-0 tech-grid opacity-10" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="h-16 w-16 mx-auto rounded-full bg-secondary/20 flex items-center justify-center mb-6 shadow-glow-secondary">
            <Shield className="h-8 w-8 text-secondary" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4 animate-fade-in">Privacy Policy</h1>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto text-lg animate-slide-up">
            How we collect, use, and protect your personal data.
          </p>
        </div>
      </section>

      <main className="flex-grow container mx-auto px-4 py-12 max-w-4xl">
        <Card className="border-border/50 shadow-lg animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <CardContent className="p-8 md:p-12 space-y-8">
            
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3 flex items-center gap-2">
                <span className="text-primary">1.</span> Information We Collect
              </h2>
              <ul className="list-disc pl-5 space-y-2 text-muted-foreground leading-relaxed">
                <li><strong>Personal Identity Data:</strong> Name, billing address, delivery address, email address, and phone number required for order fulfillment.</li>
                <li><strong>Automated Data (Cookies):</strong> We may collect your IP address, browser type, and device information to optimize your browsing experience.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3 flex items-center gap-2">
                <span className="text-primary">2.</span> Payment Security
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Tech_Masters utilizes Razorpay, an RBI-authorized payment aggregator, to process transactions. We do not directly capture, store, or process your credit/debit card numbers, CVV, or UPI PINs on our own servers. All financial data is encrypted through PCI-DSS compliant protocols.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3 flex items-center gap-2">
                <span className="text-primary">3.</span> How We Use Your Data
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Your data is strictly utilized for core business operations: fulfilling your 50-hour delivery, providing tracking updates, and preventing fraudulent transactions. We absolutely do not sell, rent, or trade your data to third-party marketing or advertising agencies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3 flex items-center gap-2">
                <span className="text-primary">4.</span> Grievance Officer
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                In accordance with the Information Technology Act, 2000, if you have any discrepancies or grievances regarding the processing of your data, you may contact our Grievance Officer at:
              </p>
              <div className="p-4 bg-muted/50 border border-border rounded-lg text-foreground font-medium">
                Tech_Masters Support<br />
                Flat no. 502, Royal Galaxy Apartment<br />
                B Block, Panki, Kanpur, 208020<br />
                Email: techmasterskanpur@gmail.com
              </div>
            </section>

          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;