// src/app/(auth)/login/page.tsx
"use client";

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth, getUserProfile } from '@/lib/firebase';
import { signInWithEmailAndPassword, User as FirebaseUserType } from 'firebase/auth';
import Link from 'next/link';

// shadcn/ui components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, GraduationCap, AlertCircle, LogIn } from 'lucide-react';

// UserProfile type
export interface UserProfile {
  uid: string;
  email: string | null;
  name?: string;
  role?: 'super_admin' | 'teacher';
  photoURL?: string;
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser: FirebaseUserType = userCredential.user;
      const profileData = await getUserProfile(firebaseUser.uid);

      if (profileData) {
        const userProfileData = profileData as UserProfile; 
        if (userProfileData.role === 'super_admin') {
          router.push('/admin/dashboard');
        } else if (userProfileData.role === 'teacher') {
          router.push('/teacher/dashboard');
        } else {
          setError('Role not configured. Contact admin.');
          await auth.signOut();
        }
      } else {
        setError('Profile not found. Contact admin.');
        await auth.signOut();
      }
    } catch (err: any) {
      let errorMessage = 'Failed to login.';
      if (err.code) {
        switch (err.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            errorMessage = 'Invalid email or password.'; 
            break;
          case 'auth/invalid-email':
            errorMessage = 'Invalid email format.'; 
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Too many attempts. Try again later.'; 
            break;
          default: 
            errorMessage = 'An unexpected error occurred.'; 
            break;
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Role-based page title
  const roleFromQuery = searchParams.get('role');
  let pageTitle = "Portal Login";
  let pageDescription = "Enter your credentials to access the system";
  
  if (roleFromQuery === 'admin') {
    pageTitle = "Admin Portal Login";
    pageDescription = "Administrator access to manage the system";
  } else if (roleFromQuery === 'teacher') {
    pageTitle = "Teacher Portal Login";
    pageDescription = "Teacher access to manage classes and students";
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]" />
      
      <div className="relative w-full max-w-md">
        <Card className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 shadow-xl border-0 dark:border-gray-700">
          <CardHeader className="text-center space-y-4 pb-8">
            {/* Logo/Icon */}
            <div className="flex justify-center">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
            </div>
            
            {/* Title and Description */}
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold tracking-tight">
                {pageTitle}
              </CardTitle>
              <CardDescription className="text-base">
                {pageDescription}
              </CardDescription>
            </div>

            {/* Institution Badge */}
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 dark:bg-primary/20">
              <span className="text-sm font-medium text-primary">
                Darul Uloom Shaikh Ahmed Khattu
              </span>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="h-11 bg-white/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="h-11 bg-white/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-primary/20"
                />
              </div>

              {error && (
                <Alert variant="destructive" className="bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col items-center space-y-4 pt-6">
            {/* Security Notice */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground leading-relaxed">
                🔒 Secure Portal Access
                <br />
                Your credentials are protected with enterprise-grade security
              </p>
            </div>

            {/* Navigation Links */}
            <div className="flex flex-col items-center space-y-2">
              <Link 
                href="/" 
                className="text-sm text-primary hover:text-primary/80 hover:underline transition-colors duration-200 flex items-center gap-1"
              >
                ← Back to Home
              </Link>
              
              {/* Quick Access Buttons */}
              <div className="flex gap-2 mt-3">
                <Link href="/login?role=admin">
                  <Button variant="outline" size="sm" className="text-xs h-8">
                    Admin Login
                  </Button>
                </Link>
                <Link href="/login?role=teacher">
                  <Button variant="outline" size="sm" className="text-xs h-8">
                    Teacher Login
                  </Button>
                </Link>
              </div>
            </div>
          </CardFooter>
        </Card>

        {/* Footer Attribution */}
        <div className="text-center mt-6">
          <p className="text-xs text-muted-foreground">
            Educational Management System
          </p>
        </div>
      </div>
    </div>
  );
}