import React, { useState } from 'react';
import { MapPin, Plus, Edit, Trash2, Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '@/context/AppContext';
// @ts-ignore
import api from '@/api/axios'; 

const DashboardAddresses = () => {
  const { user, login } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Kept your exact frontend state naming
  const [newAddress, setNewAddress] = useState({
    name: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
  });

  const addresses = user?.addresses || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      // Map the frontend fields to the backend schema fields before saving
      const mappedAddress = {
        street: newAddress.line2 ? `[${newAddress.name}] ${newAddress.line1}, ${newAddress.line2}` : `[${newAddress.name}] ${newAddress.line1}`,
        city: newAddress.city,
        state: newAddress.state,
        zip: newAddress.pincode,
        phone: newAddress.phone
      };

      const updatedAddresses = [...addresses, mappedAddress];

      // Send to backend
      const { data } = await api.put('/auth/profile', {
        addresses: updatedAddresses
      });

      // Update UI state
      login({ ...user, addresses: data.addresses });
      localStorage.setItem('userInfo', JSON.stringify({ ...user, addresses: data.addresses }));
      
      setShowAddForm(false);
      setNewAddress({ name: '', line1: '', line2: '', city: '', state: '', pincode: '', phone: '' });
    } catch (error) {
      console.error('Failed to add address:', error);
      alert('Failed to save address.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (indexToRemove: number) => {
    if(!window.confirm("Are you sure you want to remove this address?")) return;

    try {
      setLoading(true);
      const updatedAddresses = addresses.filter((_: any, index: number) => index !== indexToRemove);
      
      const { data } = await api.put('/auth/profile', {
        addresses: updatedAddresses
      });

      login({ ...user, addresses: data.addresses });
      localStorage.setItem('userInfo', JSON.stringify({ ...user, addresses: data.addresses }));
    } catch (error) {
      console.error('Failed to delete address:', error);
      alert('Failed to delete address.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Saved Addresses
          </CardTitle>
          <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
            <DialogTrigger asChild>
              <Button variant="secondary" size="sm" className="bg-[#fef0c7] text-[#b0891d] hover:bg-[#fce5a3]">
                <Plus className="h-4 w-4 mr-2" />
                Add Address
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Address</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Address Label</Label>
                    <Input
                      id="name"
                      placeholder="Home, Office, etc."
                      value={newAddress.name}
                      onChange={e => setNewAddress({ ...newAddress, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      placeholder="+91 98765 43210"
                      value={newAddress.phone}
                      onChange={e => setNewAddress({ ...newAddress, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="line1">Address Line 1</Label>
                  <Input
                    id="line1"
                    placeholder="House/Flat No., Building Name"
                    value={newAddress.line1}
                    onChange={e => setNewAddress({ ...newAddress, line1: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="line2">Address Line 2</Label>
                  <Input
                    id="line2"
                    placeholder="Street, Landmark (Optional)"
                    value={newAddress.line2}
                    onChange={e => setNewAddress({ ...newAddress, line2: e.target.value })}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="City"
                      value={newAddress.city}
                      onChange={e => setNewAddress({ ...newAddress, city: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      placeholder="State"
                      value={newAddress.state}
                      onChange={e => setNewAddress({ ...newAddress, state: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pincode">Pincode</Label>
                    <Input
                      id="pincode"
                      placeholder="560001"
                      value={newAddress.pincode}
                      onChange={e => setNewAddress({ ...newAddress, pincode: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading} className="bg-yellow-400 hover:bg-yellow-500 text-black">
                    {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Save Address
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {addresses.length === 0 ? (
            <div className="text-center py-8">
              <div className="h-16 w-16 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
                <MapPin className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No addresses saved</h3>
              <p className="text-muted-foreground">
                Add a delivery address to make checkout faster.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {addresses.map((address: any, index: number) => {
                
                // Extract label from the formatted street string
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
                  <Card key={index} className="border border-border/50 relative group">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{label}</span>
                          {index === 0 && (
                            <Badge className="bg-primary text-primary-foreground text-xs ml-2">
                              Default
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(index)}
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground font-medium text-black">
                        {displayStreet}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {address.city}, {address.state} - {address.zip}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1 font-medium">{address.phone}</p>
                      
                      {index !== 0 && (
                        <Button variant="outline" size="sm" className="mt-3">
                          <Star className="h-3 w-3 mr-1" />
                          Set as Default
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardAddresses;