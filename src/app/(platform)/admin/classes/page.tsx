// src/app/(platform)/admin/classes/page.tsx
"use client";

import React, { useEffect, useState, FormEvent, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, orderBy, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { ClassData } from '@/types/class';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// shadcn components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  PlusCircle, 
  User, 
  BookOpen, 
  LogOut, 
  Edit, 
  Trash2, 
  GraduationCap,
  ArrowRight,
  AlertCircle,
  Loader2,
  X,
  FileDown,
  FileText,
  Calendar,
  Users
} from 'lucide-react';

export default function ManageClassesPage() {
  const { user, userProfile, loading: authLoading, error: authError, logout } = useAuth();
  const router = useRouter();

  // States
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [errorClasses, setErrorClasses] = useState<string | null>(null);

  // Add Class Form States
  const [showAddClassForm, setShowAddClassForm] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassDescription, setNewClassDescription] = useState('');
  const [newClassAcademicYear, setNewClassAcademicYear] = useState('');
  const [isSubmittingClass, setIsSubmittingClass] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit Class Form States
  const [showEditClassForm, setShowEditClassForm] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassData | null>(null);
  const [editClassName, setEditClassName] = useState('');
  const [editClassDescription, setEditClassDescription] = useState('');
  const [editClassAcademicYear, setEditClassAcademicYear] = useState('');
  const [isUpdatingClass, setIsUpdatingClass] = useState(false);
  const [editFormError, setEditFormError] = useState<string | null>(null);

  // Delete Class State
  const [isDeletingClass, setIsDeletingClass] = useState<string | null>(null);

  // Fetch classes - Updated with useCallback and proper timestamp handling
  const fetchClasses = useCallback(async () => {
    if (!userProfile || !user || userProfile.role !== 'super_admin') return;
    setIsLoadingClasses(true);
    setErrorClasses(null);
    try {
      const classesQuery = query(collection(db, "classes"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(classesQuery);
      
      const classesList = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          description: data.description,
          academicYear: data.academicYear,
          // Fixed timestamp handling for deployment
          createdAt: data.createdAt, // Keep as Timestamp object
          updatedAt: data.updatedAt, // Keep as Timestamp object
        } as ClassData;
      });

      setClasses(classesList);
    } catch (err: any) {
      setErrorClasses("Failed to load classes. " + err.message);
    }
    setIsLoadingClasses(false);
  }, [user, userProfile]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !userProfile) { router.push('/login'); return; }
    if (userProfile.role !== 'super_admin') {
      router.push(userProfile.role === 'teacher' ? '/teacher/dashboard' : '/login');
      return;
    }
    fetchClasses();
  }, [user, userProfile, authLoading, router, fetchClasses]);

  // Form handlers
  const handleAddClassSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    if (!newClassName.trim()) { setFormError("Class Name is required."); return; }
    setIsSubmittingClass(true);
    try {
      await addDoc(collection(db, "classes"), {
        name: newClassName.trim(),
        description: newClassDescription.trim(),
        academicYear: newClassAcademicYear.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setShowAddClassForm(false);
      setNewClassName('');
      setNewClassDescription('');
      setNewClassAcademicYear('');
      fetchClasses();
    } catch (err: any) {
      console.error("Error adding class:", err);
      setFormError("Failed to add class. " + err.message);
    }
    setIsSubmittingClass(false);
  };

  const handleEditClassClick = (cls: ClassData) => {
    setEditingClass(cls);
    setEditClassName(cls.name || '');
    setEditClassDescription(cls.description || '');
    setEditClassAcademicYear(cls.academicYear || '');
    setShowEditClassForm(true);
    setShowAddClassForm(false);
    setEditFormError(null);
  };

  const handleUpdateClassSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEditFormError(null);
    if (!editingClass) return;
    if (!editClassName.trim()) { setEditFormError("Class Name is required."); return; }
    setIsUpdatingClass(true);
    try {
      const classDocRef = doc(db, "classes", editingClass.id);
      await updateDoc(classDocRef, {
        name: editClassName.trim(),
        description: editClassDescription.trim(),
        academicYear: editClassAcademicYear.trim(),
        updatedAt: serverTimestamp()
      });
      setShowEditClassForm(false);
      setEditingClass(null);
      fetchClasses();
    } catch (err: any) {
      console.error("Error updating class:", err);
      setEditFormError("Failed to update class. " + err.message);
    }
    setIsUpdatingClass(false);
  };

  const handleDeleteClassClick = async (cls: ClassData) => {
    if (!cls || !cls.id || !cls.name) {
      setErrorClasses("Could not delete class: Invalid data.");
      return;
    }
    if (window.confirm(`Are you sure you want to delete class "${cls.name}"? This action cannot be undone.`)) {
      setIsDeletingClass(cls.id);
      setErrorClasses(null);
      try {
        await deleteDoc(doc(db, "classes", cls.id));
        fetchClasses();
      } catch (err: any) {
        setErrorClasses("Failed to delete class. " + err.message);
      }
      setIsDeletingClass(null);
    }
  };

  const handleCancelEdit = () => {
    setShowEditClassForm(false);
    setEditingClass(null);
    setEditFormError(null);
  };

  const handleCancelAdd = () => {
    setShowAddClassForm(false);
    setNewClassName('');
    setNewClassDescription('');
    setNewClassAcademicYear('');
    setFormError(null);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Helper function to safely format timestamps
  const formatTimestamp = (timestamp: any): string => {
    if (!timestamp) return 'N/A';
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toLocaleDateString();
    }
    if (timestamp instanceof Date) {
      return timestamp.toLocaleDateString();
    }
    return 'N/A';
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(classes.map(cls => ({
      'Class Name': cls.name,
      'Description': cls.description || '',
      'Academic Year': cls.academicYear || '',
      'Created At': formatTimestamp(cls.createdAt)
    })));
    XLSX.utils.book_append_sheet(wb, ws, "Classes");
    XLSX.writeFile(wb, "classes.xlsx");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Classes Report", 20, 20);
    
    const tableData = classes.map(cls => [
      cls.name,
      cls.description || '',
      cls.academicYear || '',
      formatTimestamp(cls.createdAt)
    ]);

    autoTable(doc, {
      head: [['Class Name', 'Description', 'Academic Year', 'Created At']],
      body: tableData,
      startY: 30,
    });

    doc.save('classes.pdf');
  };

  // Loading and error states
  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading class data...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="p-6 max-w-md mx-auto mt-20">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Authentication Error: {authError}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!user || !userProfile || userProfile.role !== 'super_admin') {
    return (
      <div className="p-6 max-w-md mx-auto mt-20">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Access denied. Only super administrators can manage classes.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 dark:border-gray-700 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <GraduationCap className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Class Management</h1>
                  <p className="text-sm text-muted-foreground">Manage class sections and academic information</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : 'A'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium">{userProfile?.name || 'Admin'}</p>
                  <p className="text-xs text-muted-foreground capitalize">{userProfile?.role}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/60 backdrop-blur-sm dark:bg-gray-800/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{classes.length}</div>
              <p className="text-xs text-muted-foreground">
                Active class sections
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/60 backdrop-blur-sm dark:bg-gray-800/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Academic Years</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(classes.filter(c => c.academicYear).map(c => c.academicYear)).size}
              </div>
              <p className="text-xs text-muted-foreground">
                Different academic periods
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur-sm dark:bg-gray-800/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Additions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {classes.filter(c => {
                  const today = new Date();
                  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                  const createdDate = c.createdAt && c.createdAt.toDate ? c.createdAt.toDate() : null;
                  return createdDate && createdDate > weekAgo;
                }).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Added this week
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold">Classes Directory</h2>
            <p className="text-sm text-muted-foreground">
              Manage class sections and academic information
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!showEditClassForm && !showAddClassForm && (
              <>
                <Button variant="outline" onClick={exportToExcel}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
                <Button variant="outline" onClick={exportToPDF}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
              </>
            )}
            <Button
              onClick={() => {
                setShowAddClassForm(true);
                setShowEditClassForm(false);
              }}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Class
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {errorClasses && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorClasses}</AlertDescription>
          </Alert>
        )}

        {/* Add Class Form */}
        {showAddClassForm && (
          <Card className="mb-6 bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Add New Class</CardTitle>
                  <CardDescription>
                    Create a new class section with academic information
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={handleCancelAdd}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddClassSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="className">Class Name *</Label>
                    <Input
                      id="className"
                      type="text"
                      placeholder="Enter class name (e.g., Grade 5A)"
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="academicYear">Academic Year</Label>
                    <Input
                      id="academicYear"
                      type="text"
                      placeholder="e.g., 2024-2025"
                      value={newClassAcademicYear}
                      onChange={(e) => setNewClassAcademicYear(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="classDescription">Description</Label>
                  <Textarea
                    id="classDescription"
                    placeholder="Enter class description (optional)"
                    value={newClassDescription}
                    onChange={(e) => setNewClassDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                {formError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{formError}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={isSubmittingClass}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    {isSubmittingClass ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <PlusCircle className="h-4 w-4 mr-2" />
                    )}
                    {isSubmittingClass ? 'Adding...' : 'Add Class'}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancelAdd}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Edit Class Form */}
        {showEditClassForm && editingClass && (
          <Card className="mb-6 bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 border-orange-500/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Edit Class</CardTitle>
                  <CardDescription>
                    Update information for {editingClass.name}
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateClassSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editClassName">Class Name *</Label>
                    <Input
                      id="editClassName"
                      type="text"
                      placeholder="Enter class name"
                      value={editClassName}
                      onChange={(e) => setEditClassName(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="editAcademicYear">Academic Year</Label>
                    <Input
                      id="editAcademicYear"
                      type="text"
                      placeholder="e.g., 2024-2025"
                      value={editClassAcademicYear}
                      onChange={(e) => setEditClassAcademicYear(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editClassDescription">Description</Label>
                  <Textarea
                    id="editClassDescription"
                    placeholder="Enter class description (optional)"
                    value={editClassDescription}
                    onChange={(e) => setEditClassDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                {editFormError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{editFormError}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={isUpdatingClass}
                    className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                  >
                    {isUpdatingClass ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Edit className="h-4 w-4 mr-2" />
                    )}
                    {isUpdatingClass ? 'Updating...' : 'Update Class'}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Classes Table */}
        <Card className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80">
          <CardHeader>
            <CardTitle>Classes List</CardTitle>
            <CardDescription>
              {isLoadingClasses ? 'Loading classes...' : `${classes.length} classes found`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingClasses ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Loading classes...</span>
              </div>
            ) : classes.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No classes found</h3>
                <p className="text-muted-foreground mb-4">
                  Get started by adding your first class to the system.
                </p>
                <Button
                  onClick={() => setShowAddClassForm(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add First Class
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Academic Year</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classes.map((cls) => (
                      <TableRow key={cls.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                              <BookOpen className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium">{cls.name}</span>
                              <span className="text-sm text-muted-foreground">ID: {cls.id}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {cls.description || 'No description'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {cls.academicYear ? (
                            <Badge variant="secondary" className="font-normal">
                              {cls.academicYear}
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">Not set</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatTimestamp(cls.createdAt)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatTimestamp(cls.updatedAt)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditClassClick(cls)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClassClick(cls)}
                              disabled={isDeletingClass === cls.id}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              {isDeletingClass === cls.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Links */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            Back to Dashboard
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/admin/students')}
            className="flex items-center gap-2"
          >
            <User className="h-4 w-4" />
            Manage Students
          </Button>
        </div>
      </div>
    </div>
  );
}