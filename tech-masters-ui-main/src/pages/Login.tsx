import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Cpu, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AppContext';
import api from '../api/axios'; 
// ✅ Import Google Login Component
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const [error, setError] = useState(''); 
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  // 1. Standard Email/Pass Login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      const userData = response.data;
      
      localStorage.setItem('user', JSON.stringify(userData));
      login(userData);
      navigate('/');

    } catch (err: any) {
      console.error("Login Error:", err);
      setError(err.response?.data?.message || 'Login failed. Check server.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. ✅ Google Login Handler
  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    setIsLoading(true);
    setError('');
    
    try {
      // Send the token (credential) to your Backend
      const { data } = await api.post('/auth/google', {
        token: credentialResponse.credential 
      });

      // Save user & redirect
      localStorage.setItem('user', JSON.stringify(data));
      login(data);
      navigate('/');
      
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      setError(err.response?.data?.message || 'Google Sign-In Failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google Sign-In was unsuccessful. Please try again.");
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 tech-grid opacity-10" />
        <div className="absolute top-10 right-10 w-64 h-64 bg-secondary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-primary-light/30 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12">
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col items-center border border-white/40 transform hover:scale-[1.02] transition-transform duration-500 mb-8">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-background overflow-hidden relative shadow-md">
                <img src="/logo.png" alt="Tech Masters" className="h-[80%] w-[80%] object-contain transition-transform duration-300" />
              </div>
              <h1 className="text-3xl md:text-5xl lg:text-5xl font-black leading-tight animate-fade-in mb-2">
                <span className="text-gradient-primary">Tech</span>
                <span className="text-gray-900">_</span>
                <span className="text-gradient-secondary">Masters</span>
              </h1>
            </Link>
          </div>
          
          <div className="max-w-md text-center space-y-4">
            <h1 className="text-4xl font-bold">Welcome Back!</h1>
            <p className="text-primary-foreground/80 text-lg">
              Your one-stop destination for premium IoT components. 
              Log in to access your orders, wishlist, and exclusive deals.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-secondary">50hr</div>
              <div className="text-sm text-primary-foreground/70">Fast Delivery</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-secondary">1.5K+</div>
              <div className="text-sm text-primary-foreground/70">Products</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-secondary">30+</div>
              <div className="text-sm text-primary-foreground/70">Categories</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <Card className="border-border/50 shadow-lg">
            <CardHeader className="space-y-1">
              <div className="flex items-center gap-2 lg:hidden mb-2 bg-white/95 rounded-lg p-2 shadow-sm border border-border/20">
                <img src="/logo.png" alt="Tech Masters Logo" className="h-8 w-8 object-contain" />
                <h1 className="text-lg font-black">
                  <span className="text-gradient-primary">Tech</span>
                  <span className="text-gray-900">_</span>
                  <span className="text-gradient-secondary">Masters</span>
                </h1>
              </div>
              <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
              <CardDescription>
                Enter your email and password to access your account
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {/* Error Message Display */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    />
                    <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                      Remember me
                    </label>
                  </div>
                  {/* ✅ THE LINK IS UPDATED HERE */}
                  <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                  size="sm"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              {/* ✅ OFFICIAL GOOGLE BUTTON */}
              <div className="flex justify-center w-full">
                 <GoogleLogin
                   onSuccess={handleGoogleSuccess}
                   onError={handleGoogleError}
                   theme="outline"
                   size="medium"
                   width="100%"
                   text="continue_with"
                   shape="rectangular"
                 />
              </div>

            </CardContent>

            <CardFooter className="justify-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link to="/signup" className="text-primary font-medium hover:underline">
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;