import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Clock, CheckCircle, Menu, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

// Removed the "Products List" from here
const mainMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: Package, label: 'All Orders', path: '/admin/orders' },
  { icon: Clock, label: 'Pending', path: '/admin/pending' },
  { icon: CheckCircle, label: 'Delivered', path: '/admin/delivered' },
];

const AdminLayout = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const Sidebar = () => (
    <div className="h-full flex flex-col bg-sidebar text-sidebar-foreground">
      <div className="p-4 border-b border-sidebar-border shrink-0">
        <Link to="/admin" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <Cpu className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          <span className="font-bold">Admin Panel</span>
        </Link>
      </div>
      
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        <div className="space-y-1">
          <p className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2">Main</p>
          {mainMenuItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                location.pathname === item.path || (item.path === '/admin' && location.pathname === '/admin')
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'hover:bg-sidebar-accent'
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
      
      {/* BACK TO STORE BUTTON - Fixed text color to black (text-black) */}
      <div className="p-4 border-t border-sidebar-border mt-auto shrink-0">
        <Button variant="outline" size="sm" className="w-full text-black hover:text-black/80 bg-white hover:bg-gray-100" asChild>
          <Link to="/">Back to Store</Link>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="h-screen w-full flex bg-background overflow-hidden">
      
      <aside className="hidden lg:block w-64 border-r border-border shrink-0">
        <Sidebar />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        
        <header className="lg:hidden h-14 border-b flex items-center px-4 gap-4 shrink-0 bg-background z-10">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 border-none">
              <Sidebar />
            </SheetContent>
          </Sheet>
          <span className="font-bold">Admin Panel</span>
        </header>
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-muted/10 relative">
          <Outlet />
        </main>
        
      </div>
    </div>
  );
};

export default AdminLayout;