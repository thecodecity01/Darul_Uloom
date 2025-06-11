// src/app/(platform)/admin/reports/attendance/page.tsx
"use client";
    
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { ClassData } from '@/types/class';
import { UserProfile } from '@/types/user';

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils"; 
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar as CalendarIcon, 
  BarChart3,
  Users,
  UserCheck,
  UserX,
  Clock,
  FileText,
  Download,
  ArrowRight,
  AlertCircle,
  Loader2,
  LogOut,
  Filter
} from 'lucide-react'; 
import { format } from "date-fns"; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface AttendanceReportData {
  totalStudents: number;
  present: number;
  absent: number;
  late: number;
  details?: Array<{ studentName: string; studentId: string; status: string; teacherName?: string }>;
}

const ALL_TEACHERS_VALUE = "_all_teachers_";

export default function AttendanceReportPage() {
  const { user, userProfile, loading: authLoading, error: authError, logout } = useAuth();
  const router = useRouter();

  const [availableClasses, setAvailableClasses] = useState<ClassData[]>([]);
  const [availableTeachers, setAvailableTeachers] = useState<UserProfile[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | undefined>(undefined);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | undefined>(undefined);
  const [selectedDateForUI, setSelectedDateForUI] = useState<Date | undefined>(new Date());
  const [reportData, setReportData] = useState<AttendanceReportData | null>(null);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [errorReport, setErrorReport] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile?.role === 'super_admin' && !authLoading) {
      const fetchDataForFilters = async () => {
        setIsLoadingFilters(true); 
        setErrorReport(null);
        try {
          // Fetch Classes
          const classesQuery = query(collection(db, "classes"), orderBy("name", "asc"));
          const classesSnapshot = await getDocs(classesQuery);
          const classesList = classesSnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name, ...doc.data() } as ClassData));
          setAvailableClasses(classesList);

          // Fetch Teachers
          const teachersQuery = query(collection(db, "users"), where("role", "==", "teacher"), orderBy("name", "asc"));
          const teachersSnapshot = await getDocs(teachersQuery);
          const teachersList = teachersSnapshot.docs.map(doc => ({ uid: doc.id, id: doc.id, name: doc.data().name, ...doc.data() } as UserProfile));
          setAvailableTeachers(teachersList);

        } catch (err: any) {
          setErrorReport("Failed to load filter options. " + err.message);
        } finally {
          setIsLoadingFilters(false); 
        }
      };
      fetchDataForFilters();
    } else if (!authLoading && (!userProfile || userProfile.role !== 'super_admin')) {
      if (isLoadingFilters) {
        setIsLoadingFilters(false);
      }
    }
  }, [userProfile, authLoading]);

  // Authentication and Authorization Check
  useEffect(() => {
    if (authLoading) return; 
    if (!user || !userProfile) { router.push('/login'); return; }
    if (userProfile.role !== 'super_admin') { 
      router.push(userProfile.role === 'teacher' ? '/teacher/dashboard' : '/login'); 
      return; 
    }
  }, [user, userProfile, authLoading, router]);

  const handleViewReport = async () => {
    if (!selectedClassId || !selectedDateForUI) {
      setErrorReport("Please select a class and a date.");
      setReportData(null); 
      return;
    }
    
    setIsLoadingReport(true); 
    setErrorReport(null); 
    setReportData(null);
    
    const dateStringToQuery = format(selectedDateForUI, "yyyy-MM-dd");
    
    try {
      const studentsSnap = await getDocs(query(collection(db, "students"), where("classId", "==", selectedClassId), orderBy("name", "asc")));
      const classStudents = studentsSnap.docs.map(doc => ({ id: doc.id, name: doc.data().name as string }));
      
      if (classStudents.length === 0) {
        setReportData({ totalStudents: 0, present: 0, absent: 0, late: 0, details: [] });
        setIsLoadingReport(false); 
        return;
      }
      
      let attendanceQueryConstraints = [where("classId", "==", selectedClassId), where("date", "==", dateStringToQuery)];
      if (selectedTeacherId) { 
        attendanceQueryConstraints.push(where("teacherId", "==", selectedTeacherId));
      }
      
      const attSnap = await getDocs(query(collection(db, "attendance"), ...attendanceQueryConstraints));
      
      let present = 0, absent = 0, late = 0;
      const details: Array<{ studentName: string; studentId: string; status: string; teacherName?: string }> = [];
      const attMap = new Map(attSnap.docs.map(d => [d.data().studentId, d.data()]));
      
      classStudents.forEach(s => {
        const att = attMap.get(s.id);
        const status = att?.status || 'Unmarked';
        if (status === 'present') present++; 
        else if (status === 'absent') absent++; 
        else if (status === 'late') late++;
        
        let teacherName = 'N/A';
        if (att?.teacherId) {
          const t = availableTeachers.find(teach => teach.uid === att.teacherId);
          teacherName = t?.name || 'Unknown';
        }
        details.push({ studentName: s.name, studentId: s.id, status, teacherName });
      });
      
      const newReportData = { 
        totalStudents: classStudents.length, 
        present: present, 
        absent: absent, 
        late: late, 
        details: details.sort((a, b) => a.studentName.localeCompare(b.studentName))
      };
      
      setReportData(newReportData);

    } catch (err: any) { 
      setErrorReport("Failed to generate report. " + err.message);
    }
    setIsLoadingReport(false);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'text-green-600 dark:text-green-400';
      case 'absent': return 'text-red-600 dark:text-red-400';
      case 'late': return 'text-yellow-600 dark:text-yellow-500';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'present': return 'default';
      case 'absent': return 'destructive';
      case 'late': return 'secondary';
      default: return 'outline';
    }
  };

  // Loading and error states
  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading attendance data...</p>
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
            Access denied. Only super administrators can view attendance reports.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoadingFilters) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading filter options...</p>
        </div>
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
                <BarChart3 className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Attendance Reports</h1>
                  <p className="text-sm text-muted-foreground">Generate detailed attendance analytics and reports</p>
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
        {/* Filters Card */}
        <Card className="mb-8 bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 border-primary/20">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-lg">Report Filters</CardTitle>
                <CardDescription>
                  Select class, teacher, and date to generate detailed attendance report
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
              {/* Class Select */}
              <div className="space-y-2">
                <Label htmlFor="classSelect" className="text-sm font-medium">Class</Label>
                <Select 
                  value={selectedClassId} 
                  onValueChange={(value) => { 
                    setSelectedClassId(value === "no-classes" ? undefined : value); 
                    setReportData(null); 
                    setErrorReport(null);
                  }}
                >
                  <SelectTrigger id="classSelect" className="w-full">
                    <SelectValue placeholder="-- Select a Class --" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableClasses.length === 0 && !isLoadingFilters && (
                      <SelectItem value="no-classes" disabled>No classes available</SelectItem>
                    )}
                    {availableClasses.map(cls => (
                      <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Teacher Select */}
              <div className="space-y-2">
                <Label htmlFor="teacherSelect" className="text-sm font-medium">Teacher</Label>
                <Select 
                  value={selectedTeacherId} 
                  onValueChange={(value) => { 
                    setSelectedTeacherId(value === ALL_TEACHERS_VALUE ? undefined : value); 
                    setReportData(null); 
                    setErrorReport(null);
                  }}
                >
                  <SelectTrigger id="teacherSelect" className="w-full">
                    <SelectValue placeholder="All Teachers" /> 
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_TEACHERS_VALUE}>All Teachers</SelectItem>
                    {availableTeachers.map(teacher => (
                      <SelectItem key={teacher.uid} value={teacher.uid}>{teacher.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Date Picker */}
              <div className="space-y-2">
                <Label htmlFor="dateSelect" className="text-sm font-medium">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="dateSelect"
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDateForUI && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDateForUI ? format(selectedDateForUI, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDateForUI}
                      onSelect={(date) => {
                        setSelectedDateForUI(date); 
                        setReportData(null); 
                        setErrorReport(null);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* View Report Button */}
              <Button
                onClick={handleViewReport}
                disabled={isLoadingReport || !selectedClassId || !selectedDateForUI}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {isLoadingReport ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                {isLoadingReport ? 'Generating...' : 'Generate Report'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {errorReport && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorReport}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoadingReport && (
          <Card className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80">
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground">Generating attendance report...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Report Display */}
        {reportData && !isLoadingReport && !errorReport && (
          <div className="space-y-6">
            {/* Report Header */}
            <Card className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <span>
                    Attendance Report - {availableClasses.find(c => c.id === selectedClassId)?.name || 'N/A Class'}
                  </span>
                </CardTitle>
                <CardDescription>
                  Report for {selectedDateForUI ? format(selectedDateForUI, "PPP") : 'N/A Date'}
                  {selectedTeacherId && (
                    <span className="block mt-1">
                      By Teacher: {availableTeachers.find(t => t.uid === selectedTeacherId)?.name || 'N/A'}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Summary Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-white/60 backdrop-blur-sm dark:bg-gray-800/60">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportData.totalStudents}</div>
                  <p className="text-xs text-muted-foreground">
                    Enrolled students
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-green-50/60 backdrop-blur-sm dark:bg-green-900/20 border-green-200 dark:border-green-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">Present</CardTitle>
                  <UserCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {reportData.present}
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    {reportData.totalStudents > 0 ? ((reportData.present / reportData.totalStudents) * 100).toFixed(1) : 0}% attendance
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-red-50/60 backdrop-blur-sm dark:bg-red-900/20 border-red-200 dark:border-red-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">Absent</CardTitle>
                  <UserX className="h-4 w-4 text-red-600 dark:text-red-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {reportData.absent}
                  </div>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    {reportData.totalStudents > 0 ? ((reportData.absent / reportData.totalStudents) * 100).toFixed(1) : 0}% absent
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-yellow-50/60 backdrop-blur-sm dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-500">Late</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">
                    {reportData.late}
                  </div>
                  <p className="text-xs text-yellow-600 dark:text-yellow-500">
                    {reportData.totalStudents > 0 ? ((reportData.late / reportData.totalStudents) * 100).toFixed(1) : 0}% late
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Table */}
            <Card className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80">
              <CardHeader>
                <CardTitle>Student Details</CardTitle>
                <CardDescription>
                  Individual attendance status for each student
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reportData.details && reportData.details.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-semibold">Student Name</TableHead>
                          <TableHead className="font-semibold">Status</TableHead>
                          {!selectedTeacherId && <TableHead className="font-semibold">Marked By</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.details.map((detail) => (
                          <TableRow key={detail.studentId} className="hover:bg-muted/50">
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-sm font-medium">
                                    {detail.studentName.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <span className="font-medium">{detail.studentName}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadgeVariant(detail.status)} className="capitalize">
                                {detail.status}
                              </Badge>
                            </TableCell>
                            {!selectedTeacherId && (
                              <TableCell className="text-sm text-muted-foreground">
                                {detail.teacherName || 'N/A'}
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : reportData.totalStudents > 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Attendance Records</h3>
                    <p className="text-muted-foreground">
                      No attendance records found for this criteria, though students are enrolled in this class.
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Students Found</h3>
                    <p className="text-muted-foreground">
                      No students are enrolled in the selected class.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {!reportData && !isLoadingReport && !errorReport && (
          <Card className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80">
            <CardContent className="text-center py-12">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Generate Attendance Report</h3>
              <p className="text-muted-foreground mb-4">
                Select filters above and click "Generate Report" to view attendance data.
              </p>
            </CardContent>
          </Card>
        )}

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
            <Users className="h-4 w-4" />
            Manage Classes
          </Button>
        </div>
      </div>
    </div>
  );
}