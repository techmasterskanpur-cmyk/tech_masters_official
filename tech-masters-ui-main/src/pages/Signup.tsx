import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Cpu, ArrowLeft, User, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AppContext';
import api from '@/api/axios';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  // ✅ 1. Standard Email/Password Signup
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side Validations
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    try {
      // Real Backend Call for Signup
      const { data } = await api.post('/auth/signup', { 
        name, 
        email, 
        password 
      });

      // Auto-login after successful signup
      localStorage.setItem('user', JSON.stringify(data));
      login(data);
      navigate('/');
      
    } catch (err: any) {
      console.error("Signup Error:", err);
      const errorMsg = err.response?.data?.message || 'Failed to create account. Please try again.';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ 2. Google Signup/Login Handler
  // (Same logic as Login page because backend handles creation automatically)
  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    setIsLoading(true);
    setError('');
    
    try {
      const { data } = await api.post('/auth/google', {
        token: credentialResponse.credential 
      });

      localStorage.setItem('user', JSON.stringify(data));
      login(data);
      navigate('/');
      
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      setError(err.response?.data?.message || 'Google Sign-Up Failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google Sign-Up was unsuccessful. Please try again.");
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 tech-grid opacity-10" />
        <div className="absolute top-10 right-10 w-64 h-64 bg-secondary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-primary-light/30 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-8 lg:p-12">
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
            <h1 className="text-4xl font-bold">Join the Makers!</h1>
            <p className="text-primary-foreground/80 text-lg">
              Create your account and get access to premium IoT components, 
              exclusive deals, and a community of innovators.
            </p>
          </div>

          <div className="mt-12 space-y-4 text-left max-w-sm">
            {[
              '✓ 50-hour express delivery on all orders',
              '✓ 1.5K+ Premium IoT components available',
              '✓ 30+ Diverse categories to browse',
              '✓ Real-time order tracking & updates',
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-2 text-primary-foreground/90">
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-6 bg-background">
        <div className="w-full max-w-md scale-95 lg:scale-100">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <Card className="border-border/50 shadow-lg">
            <CardHeader className="py-2 px-6 space-y-0">
              <div className="flex items-center gap-2 lg:hidden mb-2 bg-white/95 rounded-lg p-2 shadow-sm border border-border/20">
                <img src="/logo.png" alt="Tech Masters Logo" className="h-8 w-8 object-contain" />
                <h1 className="text-lg font-black">
                  <span className="text-gradient-primary">Tech</span>
                  <span className="text-gray-900">_</span>
                  <span className="text-gradient-secondary">Masters</span>
                </h1>
              </div>
              <CardTitle className="text-xl font-bold">Create Account</CardTitle>
              <CardDescription className="text-xs">
                Enter your details to create your account
              </CardDescription>
            </CardHeader>
            
            <CardContent className="px-6 py-2">
              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="name" className="text-xs">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      className="pl-10 h-9 text-sm"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="email" className="text-xs">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10 h-9 text-sm"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="password" className="text-xs">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pl-10 pr-10 h-9 text-sm"
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

                <div className="space-y-1">
                  <Label htmlFor="confirmPassword" className="text-xs">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pl-10 pr-10 h-9 text-sm"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="default"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-1"
                  size="sm"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>

              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              {/* ✅ OFFICIAL GOOGLE SIGNUP BUTTON */}
              <div className="flex justify-center w-full">
                 <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    theme="outline"
                    size="medium"
                    width="100%"
                    text="signup_with"
                    shape="rectangular"
                 />
              </div>
            </CardContent>

            <CardFooter className="justify-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="text-primary font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Signup;