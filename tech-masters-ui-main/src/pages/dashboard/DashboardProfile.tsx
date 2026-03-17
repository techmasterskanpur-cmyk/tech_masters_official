import React, { useState } from 'react';
import { User, Mail, Phone, Calendar, Camera, CheckCircle, AlertCircle, Loader2, Edit3, X, Smartphone, Package, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AppContext';
// @ts-ignore
import api from '../../api/axios';

const DashboardProfile = () => {
  const { user, login } = useAuth();
  
  // Toggle between View and Edit mode
  const [isEditing, setIsEditing] = useState(false);

  // Form States - Added (user as any) to bypass TypeScript strict checking
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState((user as any)?.phone || '');
  const [altPhone, setAltPhone] = useState((user as any)?.altPhone || '');
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    try {
      setLoading(true);
      const { data } = await api.put('/auth/profile', {
        name,
        email,
        phone,
        altPhone
      });

      // Update global context and storage
      login(data);
      localStorage.setItem('userInfo', JSON.stringify(data));

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false); // Switch back to view mode after success
    } catch (err: any) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to update profile' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* 🟢 MODERN PROFILE HEADER 🟢 */}
      <Card className="border-border/50 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/4 pointer-events-none" />
        
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
            
            {/* Profile Picture */}
            <div className="relative group shrink-0">
              <Avatar className="h-28 w-28 sm:h-32 sm:w-32 border-4 border-background shadow-md">
                {/* Automatically pulls the Google photo if available. referrerPolicy is vital for Google Image URLs */}
                <AvatarImage src={(user as any)?.avatar} alt={user?.name || 'User'} className="object-cover" referrerPolicy="no-referrer" />
                <AvatarFallback className="bg-primary/10 text-primary text-4xl font-bold">
                  {user?.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* User Info & Actions */}
            <div className="flex-1 flex flex-col sm:flex-row justify-between items-center sm:items-start gap-4 w-full text-center sm:text-left mt-2">
              <div className="space-y-3">
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{user?.name}</h2>
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-6 text-sm text-muted-foreground font-medium">
                  <span className="flex items-center gap-1.5"><Mail className="h-4 w-4 text-primary/70" /> {user?.email}</span>
                  {(user as any)?.phone && <span className="flex items-center gap-1.5"><Phone className="h-4 w-4 text-primary/70" /> {(user as any)?.phone}</span>}
                </div>
              </div>
              
              <Button 
                variant={isEditing ? "ghost" : "outline"} 
                className="shrink-0 rounded-full px-6"
                onClick={() => {
                  setIsEditing(!isEditing);
                  setMessage(null);
                }}
              >
                {isEditing ? <><X className="h-4 w-4 mr-2" /> Cancel</> : <><Edit3 className="h-4 w-4 mr-2" /> Edit Profile</>}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success/Error Message */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 border shadow-sm ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border-green-200' 
            : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {/* 🟢 EDIT MODE vs VIEW MODE 🟢 */}
      {isEditing ? (
        <Card className="border-border/50 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
          <CardHeader className="border-b bg-muted/10 pb-4">
            <CardTitle className="text-lg">Personal Information</CardTitle>
            <CardDescription>Update your contact details to ensure smooth deliveries.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="pl-10 h-11" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-11" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Primary Mobile Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10 h-11" placeholder="+91 9876543210" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="altPhone" className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Alternative Number</Label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="altPhone" type="tel" value={altPhone} onChange={(e) => setAltPhone(e.target.value)} className="pl-10 h-11" placeholder="+91 9876543211 (Optional)" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button type="submit" className="w-full sm:w-auto px-8 h-11" disabled={loading}>
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          
          {/* Account Details View */}
          <Card className="md:col-span-2 border-border/50 shadow-sm">
            <CardHeader className="border-b bg-muted/10 pb-4">
              <CardTitle className="text-lg">Account Details</CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-8 pt-6">
              <div className="space-y-1.5">
                <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> Primary Phone</p>
                <p className="font-medium text-base">{(user as any)?.phone || 'Not added'}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-2"><Smartphone className="h-3.5 w-3.5" /> Alt. Phone</p>
                <p className="font-medium text-base">{(user as any)?.altPhone || 'Not added'}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /> Member Since</p>
                <p className="font-medium text-base">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats View */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="border-b bg-muted/10 pb-4">
              <CardTitle className="text-lg text-center">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-6">
              <div className="flex items-center justify-between p-3.5 bg-muted/30 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                <span className="text-sm font-bold flex items-center gap-2"><Package className="h-4 w-4 text-primary" /> Orders</span>
                <Badge variant="secondary" className="px-2.5 py-0.5 text-sm">3</Badge>
              </div>
              <div className="flex items-center justify-between p-3.5 bg-muted/30 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                <span className="text-sm font-bold flex items-center gap-2"><Truck className="h-4 w-4 text-green-600" /> Delivered</span>
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 px-2.5 py-0.5 text-sm border-0">2</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DashboardProfile;