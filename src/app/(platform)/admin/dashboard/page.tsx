// src/app/(platform)/admin/dashboard/page.tsx
"use client";

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// shadcn components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  Users, 
  BookOpen, 
  FileText, 
  LogOut, 
  ClipboardList, 
  UserPlus, 
  School,
  Home,
  BookUser,
  CalendarCheck,
  LineChart,
  Settings,
  AlertCircle,
  Loader2
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { user, userProfile, loading, error, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user || !userProfile) { router.push('/login'); return; }
    if (userProfile.role !== 'super_admin') {
      if (userProfile.role === 'teacher') { router.push('/teacher/dashboard'); } 
      else { router.push('/login'); }
      return;
    }
  }, [user, userProfile, loading, router]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (e) {
      console.error("Logout error:", e);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-md mx-auto mt-20">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Auth Error: {error.message}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!user || !userProfile || userProfile.role !== 'super_admin') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center space-y-4">
          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Navigation items array
  const navItems = [
    { 
      href: "/admin/classes", 
      label: "Manage Classes", 
      icon: <School className="h-5 w-5 text-blue-600" />,
      description: "Add, edit, or delete academic classes",
      badge: "New"
    },
    { 
      href: "/admin/teachers", 
      label: "Manage Teachers", 
      icon: <UserPlus className="h-5 w-5 text-green-600" />,
      description: "Oversee teacher accounts and assignments"
    },
    { 
      href: "/admin/students", 
      label: "Manage Students", 
      icon: <Users className="h-5 w-5 text-purple-600" />,
      description: "Handle student records and information"
    },
    { 
      href: "/admin/reports/attendance", 
      label: "Attendance Reports", 
      icon: <CalendarCheck className="h-5 w-5 text-amber-600" />,
      description: "View and analyze attendance data"
    },
    { 
      href: "/admin/reports/performance", 
      label: "Performance Reports", 
      icon: <LineChart className="h-5 w-5 text-teal-600" />,
      description: "Track student performance metrics"
    },
    { 
      href: "/admin/settings", 
      label: "System Settings", 
      icon: <Settings className="h-5 w-5 text-gray-600" />,
      description: "Configure application settings"
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600">
                <Home className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
                <p className="text-muted-foreground flex items-center gap-2">
                  <span className="text-sm">As-salamu alaykum,</span>
                  <strong>{userProfile.name || user?.email}</strong>
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="destructive" 
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-800/50">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Teachers</p>
                  <p className="text-3xl font-bold text-blue-700">24</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-800/50">
                  <BookUser className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-600">Active Classes</p>
                  <p className="text-3xl font-bold text-green-700">12</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-800/50">
                  {/* <GraduationCap className="h-6 w-6 text-purple-600" /> */}
                </div>
                <div>
                  <p className="text-sm font-medium text-purple-600">Total Students</p>
                  <p className="text-3xl font-bold text-purple-700">320</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {navItems.map((item) => (
            <Card key={item.href} className="border-0 shadow-lg hover:shadow-xl transition-all">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                    {item.icon}
                  </div>
                  <CardTitle className="text-lg font-semibold">
                    {item.label}
                    {item.badge && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </CardTitle>
                </div>
                <CardDescription className="pl-1">
                  {item.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full border-blue-500 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-slate-700">
                  <Link href={item.href} className="flex items-center gap-2">
                    Go to {item.label.split(' ')[0]}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}