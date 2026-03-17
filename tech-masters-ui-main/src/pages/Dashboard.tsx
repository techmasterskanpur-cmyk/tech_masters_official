import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { User, Package, MapPin, LogOut, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/context/AppContext';
import { cn } from '@/lib/utils';

const menuItems = [
  { icon: User, label: 'Profile', path: '/dashboard' },
  { icon: Package, label: 'My Orders', path: '/dashboard/orders' },
  { icon: MapPin, label: 'Addresses', path: '/dashboard/addresses' },
];

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-8">My Account</h1>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <aside className="lg:col-span-1">
              <Card className="border-border/50 sticky top-24">
                <CardContent className="p-4">
                  {/* User Info */}
                  <div className="flex items-center gap-3 p-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user?.avatar} />
                      <AvatarFallback className="gradient-primary text-primary-foreground">
                        {user?.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{user?.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
                    </div>
                  </div>

                  <Separator className="my-2" />

                  {/* Navigation */}
                  <nav className="space-y-1 mt-2">
                    {menuItems.map(item => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                          location.pathname === item.path
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted'
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                        <ChevronRight className="h-4 w-4 ml-auto opacity-50" />
                      </Link>
                    ))}
                  </nav>

                  <Separator className="my-2" />

                  <Button
                    variant="ghost"
                    className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Logout
                  </Button>
                </CardContent>
              </Card>
            </aside>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <Outlet />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
