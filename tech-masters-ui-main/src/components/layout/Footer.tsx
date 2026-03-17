import React from 'react';
import { Link } from 'react-router-dom';
import { Cpu, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, Youtube } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="bg-white/95 rounded-xl p-2 inline-block shadow-md transform hover:scale-105 transition-transform duration-300">
              <Link to="/" className="flex items-center gap-2 group">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background overflow-hidden p-0.5 shadow-sm">
                  <img src="/logo.png" alt="Tech Masters" className="h-[90%] w-[90%] object-contain group-hover:scale-110 transition-transform duration-300" />
                </div>
                <span className="text-xl font-black">
                  <span className="text-gradient-primary">Tech</span>
                  <span className="text-gray-900">_</span>
                  <span className="text-gradient-secondary">Masters</span>
                </span>
              </Link>
            </div>
            <p className="text-primary-foreground/80 text-sm leading-relaxed mt-2 max-w-sm">
              Your one-stop components store in Kanpur. Quality sensors, boards, modules, and electronics
              for makers, hobbyists, and professionals.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-2">
              {[
                { name: 'All Products', href: '/products' },
                { name: 'About Us', href: '/about' },
                { name: 'My Dashboard', href: '/dashboard' },
                { name: 'Track Order', href: '/dashboard/orders' },
                { name: 'Shopping Cart', href: '/cart' },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-primary-foreground/70 hover:text-secondary transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Top Categories</h3>
            <ul className="space-y-2">
              {[
                { name: 'IoT & Modules', href: `/products?category=${encodeURIComponent('IoT & Modules')}` },
                { name: '3D Printer & CNC', href: `/products?category=${encodeURIComponent('3D Printer and CNC Machin')}` },
                { name: 'Stepper Motors', href: `/products?category=${encodeURIComponent('Stepper Motor and Driver')}` },
                { name: 'Robotics Spares', href: `/products?category=${encodeURIComponent('Robotic Spares')}` },
                { name: 'Dev Boards', href: `/products?category=${encodeURIComponent('Arduino & Interface Modules')}` },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-primary-foreground/70 hover:text-secondary transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm text-primary-foreground/80">
                <MapPin className="h-5 w-5 mt-0.5 shrink-0 text-secondary" />
                <span>Flat no. 502, Royal Galaxy Apartment<br/>B Block, Panki, Kanpur, 208020</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-primary-foreground/80">
                <Mail className="h-5 w-5 shrink-0 text-secondary" />
                <span>techmasterskanpur@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-primary-foreground/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-primary-foreground/60">
            <p>© 2026 Tech_Masters. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link to="/about" className="hover:text-secondary transition-colors">
                About Us
              </Link>
              <Link to="/privacy" className="hover:text-secondary transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-secondary transition-colors">
                Terms of Use
              </Link>
              <Link to="/shipping" className="hover:text-secondary transition-colors">
                Shipping Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};