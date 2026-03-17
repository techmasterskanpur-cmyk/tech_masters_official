import React, { useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Shield } from 'lucide-react';

const TermsOfUse = () => {
  useEffect(() => {
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
          <h1 className="text-3xl md:text-5xl font-bold mb-4 animate-fade-in">Terms of Use & Cancellations</h1>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto text-lg animate-slide-up">
            Please read these terms carefully before utilizing our platform.
          </p>
        </div>
      </section>

      <main className="flex-grow container mx-auto px-4 py-12 max-w-4xl">
        <Card className="border-border/50 shadow-lg animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <CardContent className="p-8 md:p-12 space-y-8">
            
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3 flex items-center gap-2">
                <span className="text-primary">1.</span> Strict Cancellation Policy
              </h2>
              <ul className="list-disc pl-5 space-y-2 text-muted-foreground leading-relaxed">
                <li><strong>Pre-Dispatch:</strong> Due to our hyper-fast 50-hour fulfillment system, cancellation requests are only entertained if submitted before the order is marked as "Processing" or "Dispatched".</li>
                <li><strong>Post-Dispatch:</strong> Once a package has left our facility, the order is finalized and cannot be cancelled, modified, or rerouted under any legal circumstances.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3 flex items-center gap-2">
                <span className="text-primary">2.</span> Return & Replacement Policy (DOA Clause)
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Microcontrollers, sensors, and bare-board electronics are highly susceptible to electrostatic discharge (ESD) and incorrect voltage application. Consequently, we operate on a strict NO RETURN policy for "Change of Mind" or "Ordered by Mistake" scenarios.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-muted-foreground leading-relaxed">
                <li><strong>Dead on Arrival (DOA):</strong> Replacements are exclusively issued for items that are physically damaged in transit or mathematically proven to be manufacturing defects.</li>
                <li><strong className="text-secondary-dark dark:text-secondary">Evidentiary Requirement:</strong> An uncut, continuous unboxing video starting from the sealed external packaging is completely mandatory to claim a DOA replacement. Claims lacking continuous video evidence will be summarily rejected.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3 flex items-center gap-2">
                <span className="text-primary">3.</span> Refund Processing
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Authorized refunds (from pre-dispatch cancellations or out-of-stock replacements) are processed back to the original source of payment via our gateway aggregator. Please allow 5-7 business days for the credit to reflect in your bank statement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3 flex items-center gap-2">
                <span className="text-primary">4.</span> Limitation of Liability
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Tech_Masters shall not be liable for any direct, indirect, incidental, or consequential damages arising from the use or inability to use our electronic components. You agree to indemnify and hold Tech_Masters harmless from any claims resulting from your DIY projects or improper electrical wiring.
              </p>
            </section>

          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
};

export default TermsOfUse;