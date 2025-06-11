// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext"; // AuthProvider ko import karein

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Islamic Institute Management", // Title update kar sakte hain
  description: "Student & Attendance Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider> {/* AuthProvider se wrap karein */}
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}