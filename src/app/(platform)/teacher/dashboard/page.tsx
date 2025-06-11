  // src/app/(platform)/teacher/dashboard/page.tsx
  "use client";
      
  import React, { useEffect, useState, useCallback } from 'react';
  import { useAuth } from '@/context/AuthContext';
  import { useRouter } from 'next/navigation';
  import { db } from '@/lib/firebase';
  import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'; 
  import { ClassData } from '@/types/class'; 

  // --- shadcn/ui and helper imports ---
  import { Button } from "@/components/ui/button";
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
  import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
  import { Calendar } from "@/components/ui/calendar";
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
  import { Separator } from '@/components/ui/separator';
  import { Badge } from "@/components/ui/badge";
  import { Alert, AlertDescription } from "@/components/ui/alert";
  import { Avatar, AvatarFallback } from "@/components/ui/avatar";
  import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
  import { cn } from "@/lib/utils";
  import { format } from "date-fns";
  import { 
    Calendar as CalendarIcon, 
    Loader2, 
    LogOut, 
    BookOpen, 
    Clock, 
    Users,
    GraduationCap,
    Search,
    CheckCircle,
    XCircle,
    AlertCircle,
    TrendingUp,
    BarChart3,
    History,
    BookMarked,
    UserCheck,
    Star,
    ChevronRight
  } from "lucide-react";

  // --- Type definitions ---
  interface AssignedClassInfo extends ClassData { assignmentId: string; }
  interface PastAttendanceRecord { studentName: string; studentId: string; status: string; }

  export default function TeacherDashboardPage() {
    const { user, userProfile, loading: authLoading, error: authError, logout } = useAuth(); 
    const router = useRouter();

    // --- All states from original code ---
    const [assignedClasses, setAssignedClasses] = useState<AssignedClassInfo[]>([]);
    const [isLoadingAssignedClasses, setIsLoadingAssignedClasses] = useState(true);
    const [errorAssignedClasses, setErrorAssignedClasses] = useState<string | null>(null);
    const [selectedClassForHistory, setSelectedClassForHistory] = useState<string>('');
    const [selectedDateForHistory, setSelectedDateForHistory] = useState<string>(new Date().toISOString().split('T')[0]);
    const [pastAttendanceRecords, setPastAttendanceRecords] = useState<PastAttendanceRecord[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [errorHistory, setErrorHistory] = useState<string | null>(null);
    
    // --- Helper functions ---
    const getStatusIcon = (status: string) => {
      switch (status.toLowerCase()) {
        case 'present': return <CheckCircle className="h-4 w-4 text-green-600" />;
        case 'absent': return <XCircle className="h-4 w-4 text-red-600" />;
        case 'late': return <Clock className="h-4 w-4 text-amber-600" />;
        default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
      }
    };

    const getStatusBadge = (status: string) => {
      switch (status.toLowerCase()) {
        case 'present': return <Badge className="bg-green-100 text-green-800 border-green-200">Present</Badge>;
        case 'absent': return <Badge className="bg-red-100 text-red-800 border-red-200">Absent</Badge>;
        case 'late': return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Late</Badge>;
        default: return <Badge variant="secondary">Unknown</Badge>;
      }
    };

    const getAttendanceStats = () => {
      const total = pastAttendanceRecords.length;
      const present = pastAttendanceRecords.filter(record => record.status === 'present').length;
      const absent = pastAttendanceRecords.filter(record => record.status === 'absent').length;
      const late = pastAttendanceRecords.filter(record => record.status === 'late').length;
      
      return { total, present, absent, late };
    };

    // --- All functions from original code (LOGIC 100% UNCHANGED) ---
    const fetchAssignedClassesForTeacher = useCallback(async () => {
      if (!user || !userProfile || userProfile.role !== 'teacher') { setIsLoadingAssignedClasses(false); return; }
      setIsLoadingAssignedClasses(true);
      setErrorAssignedClasses(null);
      try {
        const assignmentsQuery = query(collection(db, "teacherClassAssignments"), where("teacherId", "==", user.uid));
        const assignmentsSnapshot = await getDocs(assignmentsQuery);
        if (assignmentsSnapshot.empty) { setAssignedClasses([]); } else {
          const classDetailsPromises = assignmentsSnapshot.docs.map(async (assignmentDoc) => {
            const assignmentData = assignmentDoc.data();
            const classId = assignmentData.classId;
            if (!classId) return null;
            const classDocRef = doc(db, "classes", classId);
            const classDocSnap = await getDoc(classDocRef);
            if (classDocSnap.exists()) {
              return { assignmentId: assignmentDoc.id, id: classDocSnap.id, name: classDocSnap.data().name, description: classDocSnap.data().description, academicYear: classDocSnap.data().academicYear } as AssignedClassInfo;
            } return null;
          });
          const resolvedClassDetails = (await Promise.all(classDetailsPromises)).filter(Boolean) as AssignedClassInfo[];
          setAssignedClasses(resolvedClassDetails);
        }
      } catch (err: any) { console.error("[DASHBOARD] Error fetching assigned classes: ", err); setErrorAssignedClasses("Failed to load assigned classes. " + err.message); }
      setIsLoadingAssignedClasses(false);
    }, [user, userProfile]);

    useEffect(() => {
      if (authLoading) { setIsLoadingAssignedClasses(true); return; }
      if (!user || !userProfile) { router.push('/login'); return; }
      if (userProfile.role !== 'teacher') { router.push(userProfile.role === 'super_admin' ? '/admin/dashboard' : '/login'); return; }
      fetchAssignedClassesForTeacher();
    }, [user, userProfile, authLoading, router, fetchAssignedClassesForTeacher]);

    const fetchPastAttendance = async () => {
      if (!selectedClassForHistory || !selectedDateForHistory) { setErrorHistory("Please select a class and a date."); setPastAttendanceRecords([]); return; }
      if (!userProfile) return;
      setIsLoadingHistory(true);
      setErrorHistory(null);
      setPastAttendanceRecords([]);
      try {
        const attendanceQuery = query(collection(db, "attendance"), where("classId", "==", selectedClassForHistory), where("date", "==", selectedDateForHistory));
        const attendanceSnapshot = await getDocs(attendanceQuery);
        if (attendanceSnapshot.empty) { setErrorHistory("No attendance records found for this class and date."); } else {
          const recordsPromises = attendanceSnapshot.docs.map(async (attDoc) => {
            const attendanceData = attDoc.data();
            if (!attendanceData.studentId) return null;
            const studentDocRef = doc(db, "students", attendanceData.studentId);
            const studentDocSnap = await getDoc(studentDocRef);
            return { studentId: attendanceData.studentId, studentName: studentDocSnap.exists() ? studentDocSnap.data().name : "Unknown Student", status: attendanceData.status } as PastAttendanceRecord;
          });
          const resolvedRecords = (await Promise.all(recordsPromises)).filter(Boolean) as PastAttendanceRecord[];
          if(resolvedRecords.length === 0 && !attendanceSnapshot.empty) { setErrorHistory("Records found but could not retrieve student names."); } else { setPastAttendanceRecords(resolvedRecords); }
        }
      } catch (err: any) { console.error("[HISTORY] Error fetching past attendance: ", err); setErrorHistory("Failed to load past attendance. " + err.message); }
      setIsLoadingHistory(false);
    };
    
    const handleLogout = async () => { try { await logout(); router.push('/login');} catch (e) { console.error("TeacherDashboard: Error during logout:", e); }};

    // --- Loading and error states ---
    if (authLoading) {
      return (
        <div className="flex h-screen w-full items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading dashboard...</p>
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

    if (!user || !userProfile || userProfile.role !== 'teacher') {
      return (
        <div className="flex h-screen w-full items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
            <p className="text-muted-foreground">Verifying access...</p>
          </div>
        </div>
      );
    }

    const stats = getAttendanceStats();
    const attendancePercentage = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
          
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Teacher Dashboard
                  </h1>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-500" />
                    As-salamu alaykum, Ustaad <strong>{userProfile.name || user?.email}</strong>!
                  </p>
                </div>
              </div>
            </div>
            <Button variant="destructive" onClick={handleLogout} className="gap-2 shadow-lg">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-800/50">
                    <BookMarked className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-600">Assigned Classes</p>
                    <p className="text-3xl font-bold text-blue-700">{assignedClasses.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-green-100 dark:bg-green-800/50">
                    <UserCheck className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-600">Today's Classes</p>
                    <p className="text-3xl font-bold text-green-700">{assignedClasses.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-800/50">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-600">Quick Actions</p>
                    <p className="text-sm text-purple-700">Ready to go!</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="classes" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
              <TabsTrigger value="classes" className="gap-2">
                <BookOpen className="h-4 w-4" />
                My Classes
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History className="h-4 w-4" />
                View History
              </TabsTrigger>
            </TabsList>
            
            {/* Assigned Classes Tab */}
            <TabsContent value="classes" className="space-y-6">
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Your Assigned Classes
                  </CardTitle>
                  <CardDescription>
                    Select any class to take attendance for today or manage students
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingAssignedClasses && (
                    <div className="flex items-center justify-center p-12">
                      <div className="text-center space-y-4">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                        <p className="text-muted-foreground">Loading your classes...</p>
                      </div>
                    </div>
                  )}
                  
                  {!isLoadingAssignedClasses && errorAssignedClasses && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{errorAssignedClasses}</AlertDescription>
                    </Alert>
                  )}
                  
                  {!isLoadingAssignedClasses && !errorAssignedClasses && assignedClasses.length === 0 && (
                    <div className="text-center p-12">
                      <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Classes Assigned</h3>
                      <p className="text-muted-foreground">You have not been assigned any classes yet. Contact your administrator.</p>
                    </div>
                  )}
                  
                  {!isLoadingAssignedClasses && !errorAssignedClasses && assignedClasses.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {assignedClasses.map((cls) => (
                        <Card 
                          key={cls.assignmentId || cls.id} 
                          className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 border-dashed border-gray-200 hover:border-primary/50 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900"
                        >
                          <CardContent className="p-6">
                            <div className="space-y-4">
                              <div className="flex items-start justify-between">
                                <Avatar className="h-12 w-12">
                                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-lg">
                                    {cls.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                                <Badge variant="secondary" className="text-xs">
                                  {cls.academicYear || 'Current'}
                                </Badge>
                              </div>
                              
                              <div className="space-y-2">
                                <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                                  {cls.name}
                                </h3>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {cls.description || 'No description available'}
                                </p>
                              </div>
                              
                              <Button 
                                className="w-full gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300" 
                                onClick={() => router.push(`/teacher/attendance/${cls.id}`)}
                                variant="outline"
                              >
                                <BookOpen className="h-4 w-4" />
                                Take Attendance
                                <ChevronRight className="h-4 w-4 ml-auto group-hover:translate-x-1 transition-transform" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Past Attendance History Tab */}
            <TabsContent value="history" className="space-y-6">
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    View Past Attendance
                  </CardTitle>
                  <CardDescription>
                    Check attendance records for any previous date and class
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Search Controls */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Select Class</label>
                      <Select 
                        value={selectedClassForHistory} 
                        onValueChange={(value) => {
                          setSelectedClassForHistory(value); 
                          setPastAttendanceRecords([]); 
                          setErrorHistory(null);
                        }} 
                        disabled={assignedClasses.length === 0 || isLoadingAssignedClasses}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="-- Select a Class --" />
                        </SelectTrigger>
                        <SelectContent>
                          {assignedClasses.map(cls => (
                            <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Select Date</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button 
                            variant="outline" 
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !selectedDateForHistory && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedDateForHistory ? format(new Date(selectedDateForHistory+'T00:00:00'), "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar 
                            mode="single" 
                            selected={new Date(selectedDateForHistory+'T00:00:00')} 
                            onSelect={(date) => date && setSelectedDateForHistory(date.toISOString().split('T')[0])} 
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Action</label>
                      <Button 
                        onClick={fetchPastAttendance} 
                        disabled={isLoadingHistory || !selectedClassForHistory || !selectedDateForHistory} 
                        className="w-full gap-2"
                      >
                        {isLoadingHistory ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <Search className="h-4 w-4" />
                            View Records
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Results Section */}
                  {isLoadingHistory && (
                    <div className="flex items-center justify-center p-12">
                      <div className="text-center space-y-4">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                        <p className="text-muted-foreground">Loading attendance history...</p>
                      </div>
                    </div>
                  )}
                  
                  {!isLoadingHistory && errorHistory && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{errorHistory}</AlertDescription>
                    </Alert>
                  )}
                  
                  {!isLoadingHistory && !errorHistory && pastAttendanceRecords.length > 0 && (
                    <div className="space-y-6">
                      {/* Records Header */}
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <BarChart3 className="h-5 w-5" />
                          Records for {assignedClasses.find(c=>c.id === selectedClassForHistory)?.name}
                        </h3>
                        <Badge variant="outline" className="text-sm">
                          {format(new Date(selectedDateForHistory+'T00:00:00'), "PPP")}
                        </Badge>
                      </div>
                      
                      {/* Stats Cards */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="bg-blue-50 border-blue-200">
                          <CardContent className="p-4 text-center">
                            <Users className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                            <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
                            <p className="text-sm text-blue-600">Total</p>
                          </CardContent>
                        </Card>
                        <Card className="bg-green-50 border-green-200">
                          <CardContent className="p-4 text-center">
                            <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
                            <p className="text-2xl font-bold text-green-700">{stats.present}</p>
                            <p className="text-sm text-green-600">Present</p>
                          </CardContent>
                        </Card>
                        <Card className="bg-red-50 border-red-200">
                          <CardContent className="p-4 text-center">
                            <XCircle className="h-6 w-6 mx-auto mb-2 text-red-600" />
                            <p className="text-2xl font-bold text-red-700">{stats.absent}</p>
                            <p className="text-sm text-red-600">Absent</p>
                          </CardContent>
                        </Card>
                        <Card className="bg-amber-50 border-amber-200">
                          <CardContent className="p-4 text-center">
                            <Clock className="h-6 w-6 mx-auto mb-2 text-amber-600" />
                            <p className="text-2xl font-bold text-amber-700">{stats.late}</p>
                            <p className="text-sm text-amber-600">Late</p>
                          </CardContent>
                        </Card>
                      </div>
                      
                      {/* Attendance Table */}
                      <Card>
                        <CardContent className="p-0">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-gray-50 dark:bg-gray-800">
                                <TableHead className="font-semibold">
                                  <Users className="inline h-4 w-4 mr-2" />
                                  Student Name
                                </TableHead>
                                <TableHead className="font-semibold">
                                  <Clock className="inline h-4 w-4 mr-2" />
                                  Attendance Status
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {pastAttendanceRecords.map((record, index) => (
                                <TableRow key={record.studentId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                  <TableCell className="font-medium">
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-8 w-8">
                                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm">
                                          {record.studentName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                        </AvatarFallback>
                                      </Avatar>
                                      {record.studentName}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      {getStatusIcon(record.status)}
                                      {getStatusBadge(record.status)}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }