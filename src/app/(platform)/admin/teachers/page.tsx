// src/app/(platform)/admin/teachers/page.tsx
"use client";
    
import React, { useEffect, useState, FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { db, auth as firebaseAuth } from '@/lib/firebase'; 
import { collection, query, where, getDocs, orderBy, setDoc, serverTimestamp, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore'; 
import { createUserWithEmailAndPassword } from 'firebase/auth'; 
import { UserProfile } from '@/types/user'; 
import { ClassData } from '@/types/class';

// --- shadcn/ui and helper imports ---
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  PlusCircle, 
  Loader2, 
  User, 
  Mail, 
  Edit, 
  Trash2, 
  BookUser, 
  Users,
  GraduationCap,
  Star,
  UserPlus,
  Settings,
  AlertCircle,
  CheckCircle,
  X
} from "lucide-react";

export default function ManageTeachersPage() {
  const { user, userProfile, loading: authLoading, error: authError } = useAuth();
  const router = useRouter();

  // --- All states from your original code (UNCHANGED) ---
  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);
  const [errorTeachers, setErrorTeachers] = useState<string | null>(null);
  const [showAddTeacherForm, setShowAddTeacherForm] = useState(false);
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherEmail, setNewTeacherEmail] = useState('');
  const [newTeacherPassword, setNewTeacherPassword] = useState('');
  const [isSubmittingTeacher, setIsSubmittingTeacher] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showEditTeacherForm, setShowEditTeacherForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<UserProfile | null>(null);
  const [editTeacherName, setEditTeacherName] = useState('');
  const [isUpdatingTeacher, setIsUpdatingTeacher] = useState(false);
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [isDeletingTeacher, setIsDeletingTeacher] = useState<string | null>(null);
  const [showAssignClassesModal, setShowAssignClassesModal] = useState(false);
  const [teacherToAssignClasses, setTeacherToAssignClasses] = useState<UserProfile | null>(null);
  const [availableClassesForAssignment, setAvailableClassesForAssignment] = useState<ClassData[]>([]);
  const [selectedClassesForTeacher, setSelectedClassesForTeacher] = useState<Set<string>>(new Set());
  const [isLoadingModalData, setIsLoadingModalData] = useState(false);
  const [isSavingAssignments, setIsSavingAssignments] = useState(false);

  // --- All functions from your original code (LOGIC 100% UNCHANGED) ---
  const fetchTeachers = async () => { 
    if (!userProfile || !user || userProfile.role !== 'super_admin') return;
    setIsLoadingTeachers(true);
    setErrorTeachers(null);
    try {
      const teachersQuery = query(collection(db, "users"), where("role", "==", "teacher"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(teachersQuery);
      const teachersList = querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
      setTeachers(teachersList);
    } catch (err: any) {
      console.error("Error fetching teachers: ", err);
      setErrorTeachers("Failed to load teachers. " + err.message);
    }
    setIsLoadingTeachers(false);
  };

  useEffect(() => { 
    if (authLoading) return; 
    if (!user || !userProfile) { router.push('/login'); return; }
    if (userProfile.role !== 'super_admin') { router.push(userProfile.role === 'teacher' ? '/teacher/dashboard' : '/login'); return; }
    fetchTeachers(); 
  }, [user, userProfile, authLoading, router]);

  const handleAddTeacherSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    if (!newTeacherName.trim() || !newTeacherEmail.trim() || !newTeacherPassword.trim()) {
      setFormError("Name, Email, and Password are required."); return;
    }
    if (!/\S+@\S+\.\S+/.test(newTeacherEmail)) {
      setFormError("Please enter a valid email address."); return;
    }
    if (newTeacherPassword.length < 6) {
      setFormError("Password should be at least 6 characters long."); return;
    }
    setIsSubmittingTeacher(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(firebaseAuth, newTeacherEmail, newTeacherPassword);
      const newAuthUser = userCredential.user;
      await setDoc(doc(db, "users", newAuthUser.uid), {
        uid: newAuthUser.uid, name: newTeacherName.trim(), email: newTeacherEmail.trim(),
        role: 'teacher', createdAt: serverTimestamp(), updatedAt: serverTimestamp(), photoURL: null 
      });
      setNewTeacherName(''); setNewTeacherEmail(''); setNewTeacherPassword('');
      setShowAddTeacherForm(false); fetchTeachers(); 
    } catch (err: any) {
      console.error("Error adding new teacher: ", err);
      if (err.code === 'auth/email-already-in-use') setFormError("This email address is already in use.");
      else if (err.code === 'auth/weak-password') setFormError("Password is too weak.");
      else setFormError("Failed to add teacher. " + err.message);
    }
    setIsSubmittingTeacher(false);
  };

  const handleEditTeacherClick = (teacher: UserProfile) => {
    setEditingTeacher(teacher); setEditTeacherName(teacher.name || ''); 
    setShowEditTeacherForm(true); setShowAddTeacherForm(false); setEditFormError(null);
  };

  const handleUpdateTeacherSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setEditFormError(null);
    if (!editingTeacher) { setEditFormError("No teacher selected."); return; }
    if (!editTeacherName.trim()) { setEditFormError("Teacher Name is required."); return; }
    setIsUpdatingTeacher(true);
    try {
      const teacherDocRef = doc(db, "users", editingTeacher.uid);
      await updateDoc(teacherDocRef, { name: editTeacherName.trim(), updatedAt: serverTimestamp() });
      setEditingTeacher(null); setShowEditTeacherForm(false); fetchTeachers(); 
    } catch (err: any) {
      console.error("Error updating teacher: ", err);
      setEditFormError("Failed to update teacher. " + err.message);
    }
    setIsUpdatingTeacher(false);
  };

  const handleDeleteTeacherClick = async (teacherToDelete: UserProfile) => {
    if (!teacherToDelete || !teacherToDelete.uid || !teacherToDelete.name) {
        setErrorTeachers("Could not delete: Invalid teacher data."); return;
    }
    if (window.confirm(`Are you sure you want to delete teacher "${teacherToDelete.name}"? This will delete the teacher's record. Deleting the login account requires a backend function.`)) {
      setIsDeletingTeacher(teacherToDelete.uid); setErrorTeachers(null);
      try {
        await deleteDoc(doc(db, "users", teacherToDelete.uid));
        fetchTeachers(); 
      } catch (err: any) {
        console.error("Error deleting teacher Firestore doc: ", err);
        setErrorTeachers("Failed to delete teacher record. " + err.message);
      }
      setIsDeletingTeacher(null);
    }
  };

  const openAssignClassesModal = async (teacher: UserProfile) => { 
    setTeacherToAssignClasses(teacher); setIsLoadingModalData(true); setShowAssignClassesModal(true);
    setShowAddTeacherForm(false); setShowEditTeacherForm(false);
    try {
      const classesQuery = query(collection(db, "classes"), orderBy("name", "asc"));
      const classesSnapshot = await getDocs(classesQuery);
      const allClasses = classesSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as ClassData));
      setAvailableClassesForAssignment(allClasses);
      const assignmentsQuery = query(collection(db, "teacherClassAssignments"), where("teacherId", "==", teacher.uid));
      const assignmentsSnapshot = await getDocs(assignmentsQuery);
      const currentAssignedClassIds = new Set(assignmentsSnapshot.docs.map(d => d.data().classId as string));
      setSelectedClassesForTeacher(currentAssignedClassIds);
    } catch (error) { console.error("Error loading data for assignment modal:", error); }
    setIsLoadingModalData(false);
  };
  const handleClassAssignmentChange = (classId: string, isChecked: boolean) => { 
    setSelectedClassesForTeacher(prev => { const n = new Set(prev); isChecked ? n.add(classId) : n.delete(classId); return n; });
  };
  const handleSaveAssignments = async () => { 
    if (!teacherToAssignClasses) return;
    setIsSavingAssignments(true); const teacherId = teacherToAssignClasses.uid; const batch = writeBatch(db);
    try {
        const existingQuery = query(collection(db, "teacherClassAssignments"), where("teacherId", "==", teacherId));
        const existingSnapshot = await getDocs(existingQuery);
        existingSnapshot.forEach(d => batch.delete(d.ref));
        selectedClassesForTeacher.forEach(classId => {
            const newRef = doc(collection(db, "teacherClassAssignments"));
            batch.set(newRef, { teacherId, classId, assignedAt: serverTimestamp() });
        });
        await batch.commit(); setShowAssignClassesModal(false); setTeacherToAssignClasses(null);
    } catch (error) { console.error("Error saving assignments:", error); }
    setIsSavingAssignments(false);
  };

  // --- Auth & Loading JSX ---
  if (authLoading) { 
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    ); 
  }
  
  if (authError) { 
    return (
      <div className="p-6 max-w-md mx-auto mt-20">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Auth Error: {authError.message}</AlertDescription>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Manage Teachers
                </h1>
                <p className="text-muted-foreground flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  As-salamu alaykum, Admin <strong>{userProfile.name || user?.email}</strong>!
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {!showAddTeacherForm && !showEditTeacherForm && (
              <Button 
                onClick={() => { setShowAddTeacherForm(true); setFormError(null); }}
                className="gap-2 shadow-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
              >
                <UserPlus className="h-4 w-4" />
                Add New Teacher
              </Button>
            )}
            {(showAddTeacherForm || showEditTeacherForm) && (
              <Button 
                variant="outline" 
                onClick={() => { 
                  setShowAddTeacherForm(false); 
                  setShowEditTeacherForm(false); 
                  setEditingTeacher(null); 
                }}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-800/50">
                  <GraduationCap className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Teachers</p>
                  <p className="text-3xl font-bold text-blue-700">{teachers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-800/50">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-600">Active Teachers</p>
                  <p className="text-3xl font-bold text-green-700">{teachers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-800/50">
                  <Settings className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-purple-600">Management</p>
                  <p className="text-sm text-purple-700">Ready to go!</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Teacher Form */}
        {showAddTeacherForm && (
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-green-600" />
                Add New Teacher
              </CardTitle>
              <CardDescription>
                This will create a new login and profile for the teacher.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleAddTeacherSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="newTeacherName" className="text-sm font-medium">
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input 
                      id="newTeacherName" 
                      value={newTeacherName} 
                      onChange={(e) => setNewTeacherName(e.target.value)} 
                      required 
                      className="h-11"
                      placeholder="Enter teacher's full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newTeacherEmail" className="text-sm font-medium">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input 
                      id="newTeacherEmail" 
                      type="email" 
                      value={newTeacherEmail} 
                      onChange={(e) => setNewTeacherEmail(e.target.value)} 
                      required 
                      className="h-11"
                      placeholder="teacher@school.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newTeacherPassword" className="text-sm font-medium">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    id="newTeacherPassword" 
                    type="password" 
                    value={newTeacherPassword} 
                    onChange={(e) => setNewTeacherPassword(e.target.value)} 
                    required 
                    minLength={6} 
                    className="h-11"
                    placeholder="Minimum 6 characters"
                  />
                </div>
                {formError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{formError}</AlertDescription>
                  </Alert>
                )}
                <Button 
                  type="submit" 
                  disabled={isSubmittingTeacher}
                  className="gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  size="lg"
                >
                  {isSubmittingTeacher && <Loader2 className="h-4 w-4 animate-spin" />}
                  <CheckCircle className="h-4 w-4" />
                  Save Teacher
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Edit Teacher Form */}
        {showEditTeacherForm && editingTeacher && (
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20">
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-amber-600" />
                Edit Teacher: {editingTeacher.name}
              </CardTitle>
              <CardDescription>
                Update the teacher's profile details.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleUpdateTeacherSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="editTeacherName" className="text-sm font-medium">
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input 
                      id="editTeacherName" 
                      value={editTeacherName} 
                      onChange={(e) => setEditTeacherName(e.target.value)} 
                      required 
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="teacherEmailDisplay" className="text-sm font-medium">
                      Email (Cannot be changed)
                    </Label>
                    <Input 
                      id="teacherEmailDisplay" 
                      value={editingTeacher.email || ''} 
                      readOnly 
                      disabled 
                      className="h-11 bg-gray-100 dark:bg-gray-800"
                    />
                  </div>
                </div>
                {editFormError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{editFormError}</AlertDescription>
                  </Alert>
                )}
                <Button 
                  type="submit" 
                  disabled={isUpdatingTeacher}
                  className="gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  size="lg"
                >
                  {isUpdatingTeacher && <Loader2 className="h-4 w-4 animate-spin" />}
                  <CheckCircle className="h-4 w-4" />
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Teachers List */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Teachers List
            </CardTitle>
            <CardDescription>
              A list of all registered teachers in the system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingTeachers && (
              <div className="flex items-center justify-center p-12">
                <div className="text-center space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  <p className="text-muted-foreground">Loading teachers...</p>
                </div>
              </div>
            )}
            
            {!isLoadingTeachers && errorTeachers && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorTeachers}</AlertDescription>
              </Alert>
            )}
            
            {!isLoadingTeachers && !errorTeachers && teachers.length === 0 && (
              <div className="text-center p-12">
                <GraduationCap className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Teachers Found</h3>
                <p className="text-muted-foreground">Add your first teacher to get started.</p>
              </div>
            )}
            
            {!isLoadingTeachers && !errorTeachers && teachers.length > 0 && (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 dark:bg-gray-800">
                      <TableHead className="font-semibold">
                        <User className="inline h-4 w-4 mr-2" />
                        Teacher Details
                      </TableHead>
                      <TableHead className="font-semibold">
                        <Mail className="inline h-4 w-4 mr-2" />
                        Contact
                      </TableHead>
                      <TableHead className="text-right font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teachers.map((teacher) => (
                      <TableRow key={teacher.uid} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold">
                                {teacher.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'T'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{teacher.name || '-'}</p>
                              <Badge variant="secondary" className="text-xs">Teacher</Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{teacher.email || '-'}</p>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleEditTeacherClick(teacher)} 
                              disabled={isDeletingTeacher === teacher.uid}
                              className="gap-1"
                            >
                              <Edit className="h-4 w-4" />
                              <span className="hidden sm:inline">Edit</span>
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => openAssignClassesModal(teacher)} 
                              disabled={isDeletingTeacher === teacher.uid}
                              className="gap-1 border-blue-200 text-blue-600 hover:bg-blue-50"
                            >
                              <BookUser className="h-4 w-4" />
                              <span className="hidden sm:inline">Assign</span>
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              onClick={() => handleDeleteTeacherClick(teacher)} 
                              disabled={isDeletingTeacher === teacher.uid}
                              className="gap-1"
                            >
                              {isDeletingTeacher === teacher.uid ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Trash2 className="h-4 w-4" />
                                  <span className="hidden sm:inline">Delete</span>
                                </>
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

        {/* Assign Classes Modal */}
        <Dialog open={showAssignClassesModal} onOpenChange={(isOpen) => { 
          if (!isOpen) { setTeacherToAssignClasses(null); } 
          setShowAssignClassesModal(isOpen); 
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookUser className="h-5 w-5" />
                Assign Classes
              </DialogTitle>
              <DialogDescription>
                Select the classes for <strong>{teacherToAssignClasses?.name}</strong>
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {isLoadingModalData ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {availableClassesForAssignment.length === 0 ? (
                    <div className="text-center py-6">
                      <BookUser className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">No classes available to assign</p>
                    </div>
                  ) : (
                    <div className="max-h-[60vh] overflow-y-auto pr-2">
                      {availableClassesForAssignment.map((classItem) => (
                        <div key={classItem.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                          <Checkbox
                            id={`class-${classItem.id}`}
                            checked={selectedClassesForTeacher.has(classItem.id)}
                            onCheckedChange={(checked) => 
                              handleClassAssignmentChange(classItem.id, checked as boolean)
                            }
                          />
                          <Label htmlFor={`class-${classItem.id}`} className="font-medium">
                            {classItem.name}
                          </Label>
                          {classItem.academicYear && (
                            <Badge variant="outline" className="ml-auto">
                              {classItem.academicYear}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowAssignClassesModal(false)}
                disabled={isSavingAssignments}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveAssignments}
                disabled={isSavingAssignments || isLoadingModalData}
                className="gap-2"
              >
                {isSavingAssignments ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Save Assignments
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}