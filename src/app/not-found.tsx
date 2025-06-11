// File: src/app/under-process.tsx
"use client";

import { ArrowLeft, Construction, Home, Search, Wrench } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function UnderProcess() {
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 text-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-amber-500/20 to-orange-500/20 blur-3xl rounded-full"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-3xl rounded-full"></div>
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 blur-3xl rounded-full"></div>
      </div>
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }}></div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
        <div className={`mb-8 transform transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0'}`}>
          <div className="relative flex items-center justify-center">
            <Construction className="w-16 h-16 text-amber-400" />
            <Wrench className="w-12 h-12 text-orange-300 absolute -right-4 -bottom-2 rotate-45" />
            <div className="absolute inset-0 bg-amber-400/30 blur-xl rounded-full"></div>
          </div>
        </div>

        <div className={`text-center mb-8 transform transition-all duration-1000 delay-200 ${isLoaded ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}>
          <div className="relative inline-block">
            <h1 className="text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-200 to-orange-200 leading-none">
              Under Construction
            </h1>
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/30 to-orange-500/30 blur-2xl -z-10"></div>
          </div>
        </div>

        <div className={`mb-6 transform transition-all duration-1000 delay-300 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <h2 className="text-3xl md:text-4xl font-bold text-emerald-300 mb-2 font-arabic tracking-wide">قيد التطوير</h2>
          <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto"></div>
        </div>
        
        <div className={`max-w-2xl mx-auto mb-12 transform transition-all duration-1000 delay-400 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
            <div className="relative bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50">
              <h3 className="text-2xl font-bold text-white mb-4">Page Under Development</h3>
              <p className="text-slate-300 text-lg leading-relaxed mb-4">
                Our team is working hard to build this page. Please check back soon for exciting new features and content!
              </p>
              <p className="text-slate-400 text-sm font-arabic">"وَقُلِ اعْمَلُوا فَسَيَرَى اللَّهُ عَمَلَكُمْ وَرَسُولُهُ وَالْمُؤْمِنُونَ"</p>
              <p className="text-slate-500 text-xs mt-1">"And say, 'Do [as you will], for Allah will see your deeds, and [so will] His Messenger and the believers'"</p>
            </div>
          </div>
        </div>

        <div className={`flex flex-wrap justify-center gap-4 transform transition-all duration-1000 delay-500 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          {/* Home Button */}
          <Link href="/" passHref>
            <button className="group relative overflow-hidden px-8 py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-700 to-orange-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center gap-3">
                <Home className="w-5 h-5" />
                <span>Return Home</span>
              </div>
            </button>
          </Link>

          {/* Contact Button (You can link this to your contact page) */}
          <Link href="/contact" passHref>
            <button className="group relative overflow-hidden px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-700 to-teal-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center gap-3">
                <Search className="w-5 h-5" />
                <span>Contact Us</span>
              </div>
            </button>
          </Link>

          {/* Go Back Button */}
          <button
            onClick={() => router.back()}
            className="group relative overflow-hidden px-8 py-4 bg-gradient-to-r from-slate-600 to-slate-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-slate-700 to-slate-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center gap-3">
              <ArrowLeft className="w-5 h-5" />
              <span>Go Back</span>
            </div>
          </button>
        </div>

        <div className={`mt-16 text-center transform transition-all duration-1000 delay-600 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <div className="inline-block bg-slate-800/30 backdrop-blur-sm rounded-lg px-6 py-3 border border-slate-700/30">
            <p className="text-amber-400 font-arabic text-lg mb-1">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
            <p className="text-slate-400 text-sm">In the name of Allah, the Most Gracious, the Most Merciful</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Inter:wght@400;500;600;700;800;900&display=swap');
        .font-arabic { font-family: 'Amiri', serif; }
        body { font-family: 'Inter', sans-serif; }
      `}</style>
    </div>
  );
};