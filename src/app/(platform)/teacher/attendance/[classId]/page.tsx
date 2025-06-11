// src/app/(platform)/teacher/attendance/[classId]/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy, serverTimestamp, writeBatch } from 'firebase/firestore';
import { ClassData } from '@/types/class';

// --- shadcn/ui and helper imports ---
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Separator } from '@/components/ui/separator';
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarInitials } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { 
  Calendar as CalendarIcon, 
  Loader2, 
  LogOut, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertCircle,
  Save,
  ArrowLeft,
  TrendingUp
} from "lucide-react";

// --- Type definitions ---
interface StudentForAttendance { id: string; name: string; }
type AttendanceStatus = 'present' | 'absent' | 'late' | 'pending';
interface StudentAttendanceState { [studentId: string]: AttendanceStatus; }

export default function TakeAttendancePage() {
  const { user, userProfile, loading: authLoading, error: authError, logout } = useAuth();
  const router = useRouter();
  const params = useParams();
  const classIdFromParams = params.classId as string;

  // --- All states from original code ---
  const [currentClass, setCurrentClass] = useState<ClassData | null>(null);
  const [studentsOfClass, setStudentsOfClass] = useState<StudentForAttendance[]>([]);
  const [isLoadingPageData, setIsLoadingPageData] = useState(true);
  const [errorPageData, setErrorPageData] = useState<string | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<StudentAttendanceState>({});
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isLoadingExistingAttendance, setIsLoadingExistingAttendance] = useState(false);

  // --- Helper functions for stats ---
  const getAttendanceStats = () => {
    const total = studentsOfClass.length;
    const present = Object.values(attendanceRecords).filter(status => status === 'present').length;
    const absent = Object.values(attendanceRecords).filter(status => status === 'absent').length;
    const late = Object.values(attendanceRecords).filter(status => status === 'late').length;
    const pending = Object.values(attendanceRecords).filter(status => status === 'pending').length;
    
    return { total, present, absent, late, pending };
  };

  const getStatusIcon = (status: AttendanceStatus) => {
    switch (status) {
      case 'present': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'absent': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'late': return <Clock className="h-4 w-4 text-amber-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case 'present': return 'bg-green-50 text-green-700 border-green-200';
      case 'absent': return 'bg-red-50 text-red-700 border-red-200';
      case 'late': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  // --- All original functions (unchanged) ---
  const fetchClassDetailsAndStudents = async (currentClassId: string) => {
    if (!currentClassId || !userProfile || userProfile.role !== 'teacher') {
      setIsLoadingPageData(false);
      if (!currentClassId) setErrorPageData("Class ID is missing.");
      return;
    }
    setIsLoadingPageData(true);
    setErrorPageData(null);
    try {
      const classDocRef = doc(db, "classes", currentClassId);
      const classDocSnap = await getDoc(classDocRef);
      if (classDocSnap.exists()) {
        setCurrentClass({ id: classDocSnap.id, ...classDocSnap.data() } as ClassData);
      } else {
        setErrorPageData(`Class details not found for ID: ${currentClassId}.`);
        setIsLoadingPageData(false);
        return;
      }
      const studentsQuery = query(
        collection(db, "students"),
        where("classId", "==", currentClassId),
        orderBy("name", "asc")
      );
      const studentsSnapshot = await getDocs(studentsQuery);
      const fetchedStudents = studentsSnapshot.docs.map(sDoc => ({
        id: sDoc.id,
        name: sDoc.data().name,
      } as StudentForAttendance));
      setStudentsOfClass(fetchedStudents);
    } catch (err: any) {
      console.error("Error fetching page data: ", err);
      setErrorPageData("Failed to load data for attendance. " + err.message);
    }
    setIsLoadingPageData(false);
  };

  useEffect(() => {
    if (authLoading) { setIsLoadingPageData(true); return; }
    if (!user || !userProfile) { router.push('/login'); return; }
    if (userProfile.role !== 'teacher') { router.push(userProfile.role === 'super_admin' ? '/admin/dashboard' : '/login'); return; }
    if (classIdFromParams) { fetchClassDetailsAndStudents(classIdFromParams); }
    else { setErrorPageData("Class ID not found in URL."); setIsLoadingPageData(false); }
  }, [user, userProfile, authLoading, router, classIdFromParams]);

  useEffect(() => {
    if (!classIdFromParams || studentsOfClass.length === 0 || !selectedDate) {
      setAttendanceRecords({});
      return;
    }
    const loadOrCreateAttendance = async () => {
      setIsLoadingExistingAttendance(true);
      const initialRecords: StudentAttendanceState = {};
      studentsOfClass.forEach(student => {
        initialRecords[student.id] = 'pending';
      });
      try {
        const attendanceQuery = query(
          collection(db, "attendance"),
          where("classId", "==", classIdFromParams),
          where("date", "==", selectedDate)
        );
        const querySnapshot = await getDocs(attendanceQuery);
        if (!querySnapshot.empty) {
          querySnapshot.forEach(doc => {
            const data = doc.data();
            if (initialRecords.hasOwnProperty(data.studentId)) {
              initialRecords[data.studentId] = data.status as AttendanceStatus;
            }
          });
        }
        setAttendanceRecords(initialRecords);
      } catch (err: any) {
        console.error("Error loading existing attendance:", err);
        setAttendanceRecords(initialRecords);
      } finally {
        setIsLoadingExistingAttendance(false);
      }
    };
    loadOrCreateAttendance();
  }, [studentsOfClass, selectedDate, classIdFromParams]);

  const handleMarkAttendance = (studentId: string, status: AttendanceStatus) => {
    setAttendanceRecords(prevRecords => ({ ...prevRecords, [studentId]: status, }));
  };

  const handleLogout = async () => {
    try { await logout(); router.push('/login'); }
    catch (e) { console.error("AttendancePage: Error during logout:", e); }
  };

  const handleSaveAttendance = async () => {
    if (!classIdFromParams || studentsOfClass.length === 0 || !selectedDate) {
      setSaveMessage("Error: Missing class, students, or date.");
      return;
    }
    setIsSavingAttendance(true);
    setSaveMessage(null);
    try {
      const attendanceQuery = query(collection(db, "attendance"), where("classId", "==", classIdFromParams), where("date", "==", selectedDate));
      const snapshot = await getDocs(attendanceQuery);
      const existingRecordsMap: { [studentId: string]: string } = {};
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        existingRecordsMap[data.studentId] = docSnap.id;
      });
      const batch = writeBatch(db);
      for (const student of studentsOfClass) {
        const status = attendanceRecords[student.id] || 'pending';
        if (existingRecordsMap[student.id]) {
          const docRef = doc(db, "attendance", existingRecordsMap[student.id]);
          batch.update(docRef, { status });
        } else {
          const newDocRef = doc(collection(db, "attendance"));
          batch.set(newDocRef, {
            studentId: student.id,
            classId: classIdFromParams,
            date: selectedDate,
            status,
            createdAt: serverTimestamp(),
          });
        }
      }
      await batch.commit();
      setSaveMessage("Attendance saved successfully.");
    } catch (err: any) {
      console.error("Error saving attendance:", err);
      setSaveMessage("Failed to save attendance: " + err.message);
    } finally {
      setIsSavingAttendance(false);
    }
  };
  
  // --- Loading and error states ---
  if (authLoading || (isLoadingPageData && !currentClass)) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading attendance page...</p>
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
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  if (errorPageData) {
    return (
      <div className="p-6 max-w-md mx-auto mt-20">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorPageData}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!currentClass && !isLoadingPageData) {
    return (
      <div className="p-6 max-w-md mx-auto mt-20">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Class details could not be loaded. Please ensure the Class ID is correct.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const stats = getAttendanceStats();
  const attendancePercentage = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {currentClass?.name}
              </h1>
            </div>
            <p className="text-muted-foreground flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Attendance for {format(new Date(selectedDate + 'T00:00:00'), "PPP")}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button variant="destructive" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-600">Total</p>
                  <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-600">Present</p>
                  <p className="text-2xl font-bold text-green-700">{stats.present}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-md bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-red-600">Absent</p>
                  <p className="text-2xl font-bold text-red-700">{stats.absent}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-md bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="text-sm font-medium text-amber-600">Late</p>
                  <p className="text-2xl font-bold text-amber-700">{stats.late}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Progress */}
        {stats.total > 0 && (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Attendance Progress</span>
                </div>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {attendancePercentage}%
                </Badge>
              </div>
              <Progress value={attendancePercentage} className="h-3" />
              <p className="text-sm text-muted-foreground mt-2">
                {stats.present} out of {stats.total} students marked present
              </p>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <Tabs defaultValue="attendance" className="space-y-6">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="attendance">Mark Attendance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="attendance" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5" />
                      Select Date & Mark Attendance
                    </CardTitle>
                    <CardDescription>
                      Choose a date and mark each student's attendance status
                    </CardDescription>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        className={cn(
                          "w-full lg:w-[300px] justify-start text-left font-normal shadow-sm",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(new Date(selectedDate + 'T00:00:00'), "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar 
                        mode="single" 
                        selected={new Date(selectedDate + 'T00:00:00')} 
                        onSelect={(date) => date && setSelectedDate(date.toISOString().split('T')[0])} 
                        initialFocus 
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {isLoadingExistingAttendance && (
                  <div className="flex items-center justify-center p-12">
                    <div className="text-center space-y-4">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                      <p className="text-muted-foreground">Loading attendance data...</p>
                    </div>
                  </div>
                )}
                
                {!isLoadingExistingAttendance && studentsOfClass.length === 0 && (
                  <div className="text-center p-12">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground text-lg">No students found in this class</p>
                  </div>
                )}
                
                {!isLoadingExistingAttendance && studentsOfClass.length > 0 && (
                  <div className="space-y-3">
                    {studentsOfClass.map((student, index) => (
                      <div 
                        key={student.id} 
                        className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-primary/50 transition-all duration-200 hover:shadow-md bg-white/50 dark:bg-gray-800/50"
                      >
                        <div className="flex items-center gap-3 mb-3 lg:mb-0">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                              {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-lg">{student.name}</p>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(attendanceRecords[student.id])}
                              <Badge 
                                variant="outline" 
                                className={cn("text-xs", getStatusColor(attendanceRecords[student.id]))}
                              >
                                {attendanceRecords[student.id] || 'pending'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <ToggleGroup 
                          type="single" 
                          size="sm" 
                          value={attendanceRecords[student.id]} 
                          onValueChange={(status) => { 
                            if (status) handleMarkAttendance(student.id, status as AttendanceStatus); 
                          }} 
                          disabled={isSavingAttendance}
                          className="justify-start lg:justify-end"
                        >
                          <ToggleGroupItem 
                            value="present" 
                            aria-label="Present" 
                            className="data-[state=on]:bg-green-100 data-[state=on]:text-green-800 data-[state=on]:border-green-300 dark:data-[state=on]:bg-green-800/50 dark:data-[state=on]:text-green-200 transition-all duration-200"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Present
                          </ToggleGroupItem>
                          <ToggleGroupItem 
                            value="absent" 
                            aria-label="Absent" 
                            className="data-[state=on]:bg-red-100 data-[state=on]:text-red-800 data-[state=on]:border-red-300 dark:data-[state=on]:bg-red-800/50 dark:data-[state=on]:text-red-200 transition-all duration-200"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Absent
                          </ToggleGroupItem>
                          <ToggleGroupItem 
                            value="late" 
                            aria-label="Late" 
                            className="data-[state=on]:bg-amber-100 data-[state=on]:text-amber-800 data-[state=on]:border-amber-300 dark:data-[state=on]:bg-amber-800/50 dark:data-[state=on]:text-amber-200 transition-all duration-200"
                          >
                            <Clock className="h-4 w-4 mr-1" />
                            Late
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              
              {/* Save Section */}
              <div className="p-6 pt-0">
                <Separator className="mb-6" />
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  <div className="space-y-1">
                    {saveMessage && (
                      <Alert className={cn("max-w-md", saveMessage.startsWith("Failed") ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50")}>
                        <AlertDescription className={cn(saveMessage.startsWith("Failed") ? "text-red-700" : "text-green-700")}>
                          {saveMessage}
                        </AlertDescription>
                      </Alert>
                    )}
                    {!saveMessage && (
                      <p className="text-sm text-muted-foreground">
                        Review attendance and click save when complete
                      </p>
                    )}
                  </div>
                  
                  <Button 
                    onClick={handleSaveAttendance} 
                    disabled={isSavingAttendance || studentsOfClass.length === 0 || isLoadingExistingAttendance}
                    size="lg"
                    className="gap-2 shadow-lg"
                  >
                    {isSavingAttendance ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Attendance
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}