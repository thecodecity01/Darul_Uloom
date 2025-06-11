// src/app/page.tsx
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  GraduationCap, 
  Users, 
  Calendar, 
  FileText, 
  BookOpen, 
  Shield, 
  Clock,
  User,
  UserPlus,
  BarChart3,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function HomePage() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Navbar Section */}
      <nav className="w-full py-4 px-6 sm:px-10 md:px-20 bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 shadow-lg sticky top-0 z-50 border-b border-white/20 dark:border-gray-700/20">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative">
              <img src="./icon.png" alt="Darul Uloom Logo" width={60} height={60} className="rounded-xl shadow-lg" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <span className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 dark:from-teal-400 dark:to-blue-400 bg-clip-text text-transparent">
                Darul Uloom
              </span>
              <p className="text-sm text-muted-foreground font-medium">Shaikh Ahmed Khattu</p>
            </div>
          </Link>
          <Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg">
            <Link href="/login" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Login
            </Link>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-grow">
        <section className="relative flex flex-col items-center justify-center text-center px-4 py-20 sm:py-32 lg:py-40 overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-teal-400/20 to-green-400/20 rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative z-10 max-w-5xl mx-auto">
            {/* Badge */}
            <div className="mb-8">
              <Badge className="bg-gradient-to-r from-blue-600/10 to-indigo-600/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 px-4 py-2">
                <Sparkles className="h-4 w-4 mr-2" />
                Modern Talaba Management System
              </Badge>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 tracking-tight">
              <span className="bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Darul Uloom
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-teal-600 to-indigo-600 bg-clip-text text-transparent">
                Shaikh Ahmed Khattu
              </span>
              <br />
              <span className="text-2xl sm:text-3xl md:text-4xl bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent mt-2 block">
                Talaba Management
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
              Aap yahan apne talaba ki hazri ko asaani se manage kar sakte hain. Har talib-e-ilm ki rozana hazri, 
              gair hazri aur chhuttiyon ka record check karein, aur attendance report ko kisi bhi waqt dekhain ya download karein.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-12">
              <Button asChild size="lg" className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <Link href="/login?role=teacher" className="flex items-center gap-3 px-8 py-4">
                  <GraduationCap className="h-5 w-5" />
                  Ustaaz Portal
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-2 border-blue-200 dark:border-blue-800 bg-white/50 backdrop-blur-sm hover:bg-blue-50 dark:hover:bg-blue-950/50 shadow-lg hover:shadow-xl transition-all duration-300">
                <Link href="/login?role=admin" className="flex items-center gap-3 px-8 py-4">
                  <Shield className="h-5 w-5" />
                  Sadar Ustaz Portal
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="text-center p-4 rounded-xl bg-white/60 backdrop-blur-sm dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/20">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">100+</div>
                <div className="text-sm text-muted-foreground">Talaba</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-white/60 backdrop-blur-sm dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/20">
                <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">15+</div>
                <div className="text-sm text-muted-foreground">Classes</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-white/60 backdrop-blur-sm dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/20">
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">10+</div>
                <div className="text-sm text-muted-foreground">Ustaaz</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 sm:py-28 relative">
          <div className="container mx-auto px-6">
            {/* Section Header */}
            <div className="text-center mb-16">
              <Badge className="bg-gradient-to-r from-teal-600/10 to-blue-600/10 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800 mb-4">
                <BookOpen className="h-4 w-4 mr-2" />
                Features & Benefits
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Darul Uloom Shaikh Ahmed Khattu
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto text-lg">
                Talaba ki hazri ka asaan record, har din ki attendance dekhain aur comprehensive reports hasil karein.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Feature 1 */}
              <Card className="group bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-teal-500/5 group-hover:from-blue-500/10 group-hover:to-teal-500/10 transition-all duration-500"></div>
                <CardHeader className="relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-teal-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Talaba Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <CardDescription className="text-gray-600 dark:text-gray-400 text-base leading-relaxed">
                    Harf-e-ilm ke safar mein har talib-e-ilm ka dars, class aur taraqqi ka mehfooz aur mukammal record. 
                    Comprehensive student profiles aur academic progress tracking.
                  </CardDescription>
                </CardContent>
              </Card>

              {/* Feature 2 */}
              <Card className="group bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-emerald-500/5 group-hover:from-teal-500/10 group-hover:to-emerald-500/10 transition-all duration-500"></div>
                <CardHeader className="relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Calendar className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-800 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                    Rozana Hazri Ka Asaan Nizam
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <CardDescription className="text-gray-600 dark:text-gray-400 text-base leading-relaxed">
                    Ustaadon ke liye sahulat aur administrators ke liye mukammal hazri aur gair hazri ki tafseelat. 
                    Real-time attendance tracking aur automated notifications.
                  </CardDescription>
                </CardContent>
              </Card>

              {/* Feature 3 */}
              <Card className="group bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 group-hover:from-indigo-500/10 group-hover:to-purple-500/10 transition-all duration-500"></div>
                <CardHeader className="relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    Mehfooz Aur Markazi Nizam
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <CardDescription className="text-gray-600 dark:text-gray-400 text-base leading-relaxed">
                    Tamam maloomat mehfooz tareeqay se aik markazi nizam mein rakhi jati hai sirf ijazat yafta afraad ke liye dastiyab. 
                    Advanced security aur data protection.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>

            {/* Additional Features Row */}
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-8">
              {/* Feature 4 */}
              <Card className="group bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5 group-hover:from-emerald-500/10 group-hover:to-green-500/10 transition-all duration-500"></div>
                <CardHeader className="relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <BarChart3 className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    Detailed Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <CardDescription className="text-gray-600 dark:text-gray-400 text-base leading-relaxed">
                    Comprehensive reports aur analytics ke saath better decision making. Attendance trends, performance metrics aur insights.
                  </CardDescription>
                </CardContent>
              </Card>

              {/* Feature 5 */}
              <Card className="group bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 group-hover:from-orange-500/10 group-hover:to-red-500/10 transition-all duration-500"></div>
                <CardHeader className="relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Clock className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-800 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                    Real-time Updates
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <CardDescription className="text-gray-600 dark:text-gray-400 text-base leading-relaxed">
                    Instant notifications aur real-time data synchronization. Har waqt updated information aur quick access to critical data.
                  </CardDescription>
                </CardContent>
              </Card>

              {/* Feature 6 */}
              <Card className="group bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 group-hover:from-purple-500/10 group-hover:to-pink-500/10 transition-all duration-500"></div>
                <CardHeader className="relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <FileText className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-800 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    Document Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <CardDescription className="text-gray-600 dark:text-gray-400 text-base leading-relaxed">
                    Student documents, certificates aur records ka organized storage. Easy access aur secure document management system.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-teal-600/10 to-indigo-600/10"></div>
          <div className="container mx-auto px-6 text-center relative z-10">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Ready to Get Started?
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                Apne madrasa ke liye modern management system ka faida uthayein. Aaj hi shuru karein!
              </p>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                  <Link href="/login" className="flex items-center gap-3 px-8 py-4">
                    <UserPlus className="h-5 w-5" />
                    Start Managing Today
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Section */}
      <footer className="w-full py-12 px-6 sm:px-10 md:px-20 border-t border-gray-200/50 dark:border-gray-700/50 bg-white/50 backdrop-blur-sm dark:bg-gray-800/50">
        <div className="container mx-auto">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img src="./icon.png" alt="Darul Uloom Logo" width={40} height={40} className="rounded-lg" />
              <span className="text-xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 dark:from-teal-400 dark:to-blue-400 bg-clip-text text-transparent">
                Darul Uloom Shaikh Ahmed Khattu
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              © {currentYear} Darul Uloom Shaikh Ahmed Khattu. 
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Designed with devotion for Islamic education & modern technology.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}