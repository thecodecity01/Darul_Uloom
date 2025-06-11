// src/app/(platform)/admin/students/page.tsx
"use client";

import React, { useEffect, useState, FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, orderBy, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore'; 
import { StudentData } from '@/types/student'; 
import { ClassData } from '@/types/class';

// shadcn components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  UserPlus,
  ArrowRight,
  AlertCircle,
  Loader2,
  X
} from 'lucide-react';

export default function ManageStudentsPage() {
  const { user, userProfile, loading: authLoading, error: authError, logout } = useAuth();
  const router = useRouter();

  // States
  const [students, setStudents] = useState<StudentData[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false); 
  const [errorStudents, setErrorStudents] = useState<string | null>(null);

  const [availableClasses, setAvailableClasses] = useState<ClassData[]>([]);
  const [isLoadingClassesDropdown, setIsLoadingClassesDropdown] = useState(false);

  // Add Student Form States
  const [showAddStudentForm, setShowAddStudentForm] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [selectedClassId, setSelectedClassId] = useState(''); 
  const [newGuardianName, setNewGuardianName] = useState('');
  const [newGuardianContact, setNewGuardianContact] = useState('');
  const [newDateOfBirth, setNewDateOfBirth] = useState(''); 
  const [newPhotoUrl, setNewPhotoUrl] = useState(''); 
  const [isSubmittingStudent, setIsSubmittingStudent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit Student Form States
  const [showEditStudentForm, setShowEditStudentForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentData | null>(null);
  const [editStudentName, setEditStudentName] = useState('');
  const [editSelectedClassId, setEditSelectedClassId] = useState('');
  const [editGuardianName, setEditGuardianName] = useState('');
  const [editGuardianContact, setEditGuardianContact] = useState('');
  const [editDateOfBirth, setEditDateOfBirth] = useState('');
  const [editPhotoUrl, setEditPhotoUrl] = useState('');
  const [isUpdatingStudent, setIsUpdatingStudent] = useState(false);
  const [editFormError, setEditFormError] = useState<string | null>(null);

  // Delete Student State
  const [isDeletingStudent, setIsDeletingStudent] = useState<string | null>(null); 

  // Fetch classes and students
  const fetchClassesForDropdown = async (): Promise<ClassData[]> => {
    if (!userProfile || userProfile.role !== 'super_admin') return [];
    setIsLoadingClassesDropdown(true);
    let classesList: ClassData[] = [];
    try {
      const classesQuery = query(collection(db, "classes"), orderBy("name", "asc"));
      const querySnapshot = await getDocs(classesQuery);
      classesList = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return { id: doc.id, name: data.name, ...data } as ClassData;
      });
      setAvailableClasses(classesList);
    } catch (err) {
      console.error("Error fetching classes:", err);
    }
    setIsLoadingClassesDropdown(false);
    return classesList;
  };
  
  const fetchStudents = async (fetchedClasses: ClassData[]) => {
    if (!userProfile || !user || userProfile.role !== 'super_admin') return;
    setIsLoadingStudents(true);
    setErrorStudents(null);
    try {
      const studentsQuery = query(collection(db, "students"), orderBy("createdAt", "desc")); 
      const querySnapshot = await getDocs(studentsQuery);
      const studentsList = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const studentClass = fetchedClasses.find(c => c.id === data.classId);
        return { 
          id: doc.id, 
          name: data.name, 
          classId: data.classId, 
          className: studentClass ? studentClass.name : 'N/A',
          photoUrl: data.photoUrl, 
          documents: data.documents, 
          dateOfBirth: data.dateOfBirth, 
          guardianName: data.guardianName, 
          guardianContact: data.guardianContact,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleDateString() : 'N/A',
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toLocaleDateString() : 'N/A'
        } as StudentData; 
      });
      setStudents(studentsList);
    } catch (err: any) {
      setErrorStudents("Failed to load students. " + err.message);
    }
    setIsLoadingStudents(false);
  };

  useEffect(() => {
    if (authLoading) return; 
    if (!user || !userProfile) { router.push('/login'); return; }
    if (userProfile.role !== 'super_admin') { 
      router.push(userProfile.role === 'teacher' ? '/teacher/dashboard' : '/login'); 
      return; 
    }
    const loadData = async () => {
      const classes = await fetchClassesForDropdown();
      await fetchStudents(classes);
    };
    loadData();
  }, [user, userProfile, authLoading, router]); 

  // Form handlers
  const handleAddStudentSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    if (!newStudentName.trim()) { setFormError("Student Name is required."); return; }
    if (!selectedClassId) { setFormError("Please select a class."); return; }
    setIsSubmittingStudent(true);
    try {
      const studentDataToAdd: Omit<StudentData, 'id' | 'className' | 'createdAt' | 'updatedAt'> & { createdAt: any, updatedAt: any } = {
        name: newStudentName.trim(), 
        classId: selectedClassId,
        guardianName: newGuardianName.trim() || undefined, 
        guardianContact: newGuardianContact.trim() || undefined,
        dateOfBirth: newDateOfBirth ? newDateOfBirth : undefined, 
        photoUrl: newPhotoUrl.trim() || undefined,
        documents: [], 
        createdAt: serverTimestamp(), 
        updatedAt: serverTimestamp()
      };
      Object.keys(studentDataToAdd).forEach(key => (studentDataToAdd as any)[key] === undefined && delete (studentDataToAdd as any)[key]);
      await addDoc(collection(db, "students"), studentDataToAdd);
      setShowAddStudentForm(false); 
      setNewStudentName(''); 
      setSelectedClassId(''); 
      setNewGuardianName('');
      setNewGuardianContact(''); 
      setNewDateOfBirth(''); 
      setNewPhotoUrl('');
      fetchStudents(availableClasses); 
    } catch (err: any) { 
      console.error("Error adding student:", err); 
      setFormError("Failed to add student. " + err.message); 
    }
    setIsSubmittingStudent(false);
  };

  const handleEditStudentClick = (student: StudentData) => {
    setEditingStudent(student);
    setEditStudentName(student.name || '');
    setEditSelectedClassId(student.classId || '');
    setEditGuardianName(student.guardianName || '');
    setEditGuardianContact(student.guardianContact || '');
    if (student.dateOfBirth) {
        if (typeof student.dateOfBirth === 'string') {
            setEditDateOfBirth(student.dateOfBirth);
        } else if ((student.dateOfBirth as any).toDate) {
            const date = (student.dateOfBirth as any).toDate();
            setEditDateOfBirth(date.toISOString().split('T')[0]); 
        } else {
            setEditDateOfBirth('');
        }
    } else {
        setEditDateOfBirth('');
    }
    setEditPhotoUrl(student.photoUrl || '');
    setShowEditStudentForm(true); 
    setShowAddStudentForm(false); 
    setEditFormError(null); 
  };

  const handleUpdateStudentSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEditFormError(null);
    if (!editingStudent) return;
    if (!editStudentName.trim()) { setEditFormError("Student Name is required."); return; }
    if (!editSelectedClassId) { setEditFormError("Please select a class."); return; }
    setIsUpdatingStudent(true);
    try {
      const studentDocRef = doc(db, "students", editingStudent.id);
      const studentDataToUpdate: Partial<Omit<StudentData, 'id' | 'className' | 'createdAt'>> & {updatedAt: any} = {
        name: editStudentName.trim(), 
        classId: editSelectedClassId,
        guardianName: editGuardianName.trim() || undefined,
        guardianContact: editGuardianContact.trim() || undefined,
        dateOfBirth: editDateOfBirth ? editDateOfBirth : undefined,
        photoUrl: editPhotoUrl.trim() || undefined,
        updatedAt: serverTimestamp()
      };
      Object.keys(studentDataToUpdate).forEach(key => (studentDataToUpdate as any)[key] === undefined && delete (studentDataToUpdate as any)[key]);
      await updateDoc(studentDocRef, studentDataToUpdate);
      setShowEditStudentForm(false); 
      setEditingStudent(null);
      fetchStudents(availableClasses); 
    } catch (err: any) { 
      console.error("Error updating student:", err); 
      setEditFormError("Failed to update student. " + err.message); 
    }
    setIsUpdatingStudent(false);
  };

  const handleDeleteStudentClick = async (student: StudentData) => {
    if (!student || !student.id || !student.name) {
      setErrorStudents("Could not delete student: Invalid data.");
      return;
    }
    if (window.confirm(`Are you sure you want to delete student "${student.name}"? This action cannot be undone.`)) {
      setIsDeletingStudent(student.id);
      setErrorStudents(null); 
      try {
        await deleteDoc(doc(db, "students", student.id));
        fetchStudents(availableClasses);
      } catch (err: any) {
        setErrorStudents("Failed to delete student. " + err.message); 
      }
      setIsDeletingStudent(null);
    }
  };

  const handleCancelEdit = () => {
    setShowEditStudentForm(false);
    setEditingStudent(null);
    setEditFormError(null);
  };

  const handleCancelAdd = () => {
    setShowAddStudentForm(false);
    setNewStudentName('');
    setSelectedClassId('');
    setNewGuardianName('');
    setNewGuardianContact('');
    setNewDateOfBirth('');
    setNewPhotoUrl('');
    setFormError(null);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Loading and error states
  if (authLoading || isLoadingClassesDropdown) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading student data...</p>
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
            Access denied. Only super administrators can manage students.
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
                  <h1 className="text-2xl font-bold tracking-tight">Student Management</h1>
                  <p className="text-sm text-muted-foreground">Manage student records and information</p>
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
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{students.length}</div>
              <p className="text-xs text-muted-foreground">
                Active student records
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/60 backdrop-blur-sm dark:bg-gray-800/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{availableClasses.length}</div>
              <p className="text-xs text-muted-foreground">
                Available class sections
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur-sm dark:bg-gray-800/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Additions</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {students.filter(s => {
                  const today = new Date();
                  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                  return s.createdAt && new Date(s.createdAt) > weekAgo;
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
            <h2 className="text-xl font-semibold">Students Directory</h2>
            <p className="text-sm text-muted-foreground">
              Manage student information and class assignments
            </p>
          </div>
          <Button
            onClick={() => {
              setShowAddStudentForm(true);
              setShowEditStudentForm(false);
            }}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Student
          </Button>
        </div>

        {/* Error Display */}
        {errorStudents && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorStudents}</AlertDescription>
          </Alert>
        )}

        {/* Add Student Form */}
        {showAddStudentForm && (
          <Card className="mb-6 bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Add New Student</CardTitle>
                  <CardDescription>
                    Enter student information and assign to a class
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={handleCancelAdd}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddStudentSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="studentName">Student Name *</Label>
                    <Input
                      id="studentName"
                      type="text"
                      placeholder="Enter student's full name"
                      value={newStudentName}
                      onChange={(e) => setNewStudentName(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="classSelect">Class *</Label>
                    <Select value={selectedClassId} onValueChange={setSelectedClassId} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableClasses.map(cls => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="guardianName">Guardian Name</Label>
                    <Input
                      id="guardianName"
                      type="text"
                      placeholder="Enter guardian's name"
                      value={newGuardianName}
                      onChange={(e) => setNewGuardianName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="guardianContact">Guardian Contact</Label>
                    <Input
                      id="guardianContact"
                      type="text"
                      placeholder="Phone number or email"
                      value={newGuardianContact}
                      onChange={(e) => setNewGuardianContact(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={newDateOfBirth}
                      onChange={(e) => setNewDateOfBirth(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="photoUrl">Photo URL</Label>
                    <Input
                      id="photoUrl"
                      type="url"
                      placeholder="Enter photo URL (optional)"
                      value={newPhotoUrl}
                      onChange={(e) => setNewPhotoUrl(e.target.value)}
                    />
                  </div>
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
                    disabled={isSubmittingStudent}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    {isSubmittingStudent ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4 mr-2" />
                    )}
                    {isSubmittingStudent ? 'Adding...' : 'Add Student'}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancelAdd}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Edit Student Form */}
        {showEditStudentForm && editingStudent && (
          <Card className="mb-6 bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 border-orange-500/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Edit Student</CardTitle>
                  <CardDescription>
                    Update information for {editingStudent.name}
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateStudentSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editStudentName">Student Name *</Label>
                    <Input
                      id="editStudentName"
                      type="text"
                      placeholder="Enter student's full name"
                      value={editStudentName}
                      onChange={(e) => setEditStudentName(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="editClassSelect">Class *</Label>
                    <Select value={editSelectedClassId} onValueChange={setEditSelectedClassId} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableClasses.map(cls => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="editGuardianName">Guardian Name</Label>
                    <Input
                      id="editGuardianName"
                      type="text"
                      placeholder="Enter guardian's name"
                      value={editGuardianName}
                      onChange={(e) => setEditGuardianName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="editGuardianContact">Guardian Contact</Label>
                    <Input
                      id="editGuardianContact"
                      type="text"
                      placeholder="Phone number or email"
                      value={editGuardianContact}
                      onChange={(e) => setEditGuardianContact(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="editDateOfBirth">Date of Birth</Label>
                    <Input
                      id="editDateOfBirth"
                      type="date"
                      value={editDateOfBirth}
                      onChange={(e) => setEditDateOfBirth(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="editPhotoUrl">Photo URL</Label>
                    <Input
                      id="editPhotoUrl"
                      type="url"
                      placeholder="Enter photo URL (optional)"
                      value={editPhotoUrl}
                      onChange={(e) => setEditPhotoUrl(e.target.value)}
                    />
                  </div>
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
                    disabled={isUpdatingStudent}
                    className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                  >
                    {isUpdatingStudent ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Edit className="h-4 w-4 mr-2" />
                    )}
                    {isUpdatingStudent ? 'Updating...' : 'Update Student'}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Students Table */}
        <Card className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80">
          <CardHeader>
            <CardTitle>Students List</CardTitle>
            <CardDescription>
              {isLoadingStudents ? 'Loading students...' : `${students.length} students found`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingStudents ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Loading students...</span>
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-8">
                <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No students found</h3>
                <p className="text-muted-foreground mb-4">
                  Get started by adding your first student to the system.
                </p>
                <Button
                  onClick={() => setShowAddStudentForm(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add First Student
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Photo</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Guardian</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Date of Birth</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id} className="hover:bg-muted/50">
                        <TableCell>
                          <Avatar className="h-10 w-10">
                            {student.photoUrl ? (
                              <img 
                                src={student.photoUrl} 
                                alt={student.name} 
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            ) : null}
                            <AvatarFallback>
                              {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{student.name}</span>
                            <span className="text-sm text-muted-foreground">ID: {student.id}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-normal">
                            {student.className}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm">
                              {student.guardianName || 'Not provided'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {student.guardianContact || 'Not provided'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {student.dateOfBirth ? 
                              (typeof student.dateOfBirth === 'string' ? 
                                new Date(student.dateOfBirth).toLocaleDateString() : 
                                student.dateOfBirth.toDate ? 
                                  student.dateOfBirth.toDate().toLocaleDateString() : 
                                  'Invalid date'
                              ) : 'Not provided'
                            }
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {student.createdAt}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditStudentClick(student)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteStudentClick(student)}
                              disabled={isDeletingStudent === student.id}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              {isDeletingStudent === student.id ? (
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
            onClick={() => router.push('/admin/classes')}
            className="flex items-center gap-2"
          >
            <BookOpen className="h-4 w-4" />
            Manage Classes
          </Button>
        </div>
      </div>
    </div>
  );
}