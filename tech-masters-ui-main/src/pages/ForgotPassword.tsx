import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, KeyRound, Lock, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// @ts-ignore
import api from '../api/axios';

const ForgotPassword = () => {
  const navigate = useNavigate();
  
  // UI Steps: 1 = Enter Email, 2 = Enter OTP & New Password, 3 = Success
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form Data
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Step 1: Request OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setStep(2); // Move to OTP entry step
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      return setError('Password must be at least 6 characters long.');
    }

    setLoading(true);

    try {
      await api.post('/auth/reset-password', { email, otp, newPassword });
      setStep(3); // Move to Success step
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8 p-8 bg-card border border-border/50 rounded-xl shadow-lg">
        
        {/* Header Section */}
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground mt-2">
            {step === 1 && 'Reset your password'}
            {step === 2 && 'Enter reset code'}
            {step === 3 && 'Password Reset!'}
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            {step === 1 && 'Enter your email address and we will send you a 6-digit code to reset your password.'}
            {step === 2 && `We sent a 6-digit code to ${email}.`}
            {step === 3 && 'Your password has been securely updated.'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-500 text-sm text-center">
            {error}
          </div>
        )}

        {/* Form Step 1: Send Email */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-6 mt-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Code...
                </>
              ) : (
                'Send Reset Code'
              )}
            </Button>
          </form>
        )}

        {/* Form Step 2: Enter OTP & New Password */}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-6 mt-6">
            <div className="space-y-2">
              <label htmlFor="otp" className="text-sm font-medium leading-none">
                6-Digit Reset Code
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-muted-foreground" />
                </div>
                <Input
                  id="otp"
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="pl-10 text-center text-lg tracking-[0.25em] font-semibold"
                  placeholder="------"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="newPassword" className="text-sm font-medium leading-none">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10"
                  placeholder="Create a new password"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting Password...
                </>
              ) : (
                'Save New Password'
              )}
            </Button>
          </form>
        )}

        {/* Step 3: Success State */}
        {step === 3 && (
          <div className="flex flex-col items-center justify-center py-6 space-y-6">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
            <Button onClick={() => navigate('/login')} className="w-full">
              Back to Login
            </Button>
          </div>
        )}

        {/* Back to Login Link (Only show on Step 1 & 2) */}
        {step !== 3 && (
          <div className="mt-6 text-center text-sm">
            <Link to="/login" className="flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;