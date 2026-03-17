import React, { useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Info, Users, Cpu, PackageCheck, Truck, BadgeCheck, MapPin, Mail } from 'lucide-react';

const AboutUs = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden gradient-hero text-primary-foreground py-16">
        <div className="absolute inset-0 tech-grid opacity-10" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="h-16 w-16 mx-auto rounded-full bg-secondary/20 flex items-center justify-center mb-6 shadow-glow-secondary">
            <Info className="h-8 w-8 text-secondary" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4 animate-fade-in">About Us</h1>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto text-lg animate-slide-up">
            Kanpur's trusted source for premium IoT components, development boards, and electronics — delivering fast, reliable, and quality-first.
          </p>
        </div>
      </section>

      <main className="flex-grow container mx-auto px-4 py-12 max-w-4xl">
        <Card className="border-border/50 shadow-lg animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <CardContent className="p-8 md:p-12 space-y-10">

            {/* Our Story */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3 flex items-center gap-2">
                <span className="text-primary">1.</span> Our Story
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Tech_Masters was founded with a simple mission: to make professional-grade IoT components, sensors, development boards, and electronics accessible to everyone in India — especially students, makers, and engineers in Tier-2 cities like Kanpur who previously had to wait days or weeks for components to arrive.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-3">
                We're a <strong>reseller</strong> — we source components in bulk from trusted suppliers and make them available to you at fair prices, right here in Kanpur. We're a new, growing business and every order helps us build the local electronics community.
              </p>
            </section>

            {/* What We Offer */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="text-primary">2.</span> What We Offer
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { icon: Cpu, title: '1500+ IoT Components', desc: 'Sensors, microcontrollers, modules, dev boards, and robotics spares.' },
                  { icon: Truck, title: '50-Hour Express Delivery', desc: 'Lightning-fast dispatch from our Kanpur warehouse directly to your doorstep.' },
                  { icon: BadgeCheck, title: 'Sourced from Trusted Suppliers', desc: 'We carefully choose our bulk suppliers so the products we stock are genuine and reliable.' },
                  { icon: PackageCheck, title: '30+ Product Categories', desc: 'From Arduino to stepper motors, 3D printer parts to surveillance cameras — we cover it all.' },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-3 p-4 rounded-lg bg-muted/40 border border-border/50">
                    <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Our Values */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3 flex items-center gap-2">
                <span className="text-primary">3.</span> Our Values
              </h2>
              <ul className="list-disc pl-5 space-y-2 text-muted-foreground leading-relaxed">
                <li><strong>Honesty:</strong> We're a new business. We won't exaggerate. We tell you exactly what we sell, where it's sourced from, and what to expect.</li>
                <li><strong>Speed:</strong> We understand that project deadlines don't wait. Our 50-hour delivery commitment is at the core of everything we do.</li>
                <li><strong>Fair Pricing:</strong> We buy in bulk and pass the savings to you. No hidden charges, no inflated pricing.</li>
                <li><strong>Approachability:</strong> We're a small team — easy to reach and quick to respond if there's ever an issue with your order.</li>
              </ul>
            </section>

            {/* Team */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3 flex items-center gap-2">
                <span className="text-primary">4.</span> The Team Behind Tech_Masters
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We are a small team of tech enthusiasts based in Kanpur, Uttar Pradesh. We don't manufacture anything — we source, stock, and ship the components you need. Every order is packed and dispatched with care by our own hands.
              </p>
              <div className="mt-4 flex items-center gap-3 p-4 bg-muted/40 rounded-lg border border-border/50">
                <Users className="h-8 w-8 text-primary shrink-0" />
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">We're just getting started.</strong> — We're building this business from the ground up, and every customer matters to us personally. Your support and feedback help us grow.
                </p>
              </div>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3 flex items-center gap-2">
                <span className="text-primary">5.</span> Get In Touch
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Have questions, suggestions, or partnership inquiries? We'd love to hear from you.
              </p>
              <div className="p-4 bg-muted/50 border border-border rounded-lg space-y-2 text-foreground font-medium">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <span>Flat no. 502, Royal Galaxy Apartment, B Block, Panki, Kanpur — 208020</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-primary shrink-0" />
                  <span>techmasterskanpur@gmail.com</span>
                </div>
              </div>
            </section>

          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default AboutUs;
