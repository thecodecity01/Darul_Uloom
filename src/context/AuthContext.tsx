// src/context/AuthContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signOut } from 'firebase/auth';
import { auth, getUserProfile } from '@/lib/firebase';
import { UserProfile } from '@/types/user';

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean; // Isko hum components mein authLoading ke naam se access karte hain
  error: Error | null;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true); // Initial state is true
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
   
    // setLoading(true); // Yeh pehle se hi initial state true hai, dobara set karne ki zaroorat nahi,
                       // lekin agar aap chahein toh rakh sakte hain for explicitness.

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
     
      
      if (firebaseUser) {
        setUser(firebaseUser);
        setError(null); 
        try {
        
          const profile = await getUserProfile(firebaseUser.uid);
          if (profile) {
            setUserProfile(profile as UserProfile);
           
          } else {
            console.warn("AuthContext: User authenticated, but profile not found in Firestore for UID:", firebaseUser.uid);
            setUserProfile(null);
          }
        } catch (e: any) {
          console.error("AuthContext: Error fetching user profile:", e);
          setError(e);
          setUserProfile(null);
        }
      } else {
        setUser(null);
        setUserProfile(null);
       
      }
     
      setLoading(false);
    });

    // Cleanup subscription
    return () => {
    
      unsubscribe();
    };
  }, []); // Empty dependency array means this runs once on mount and cleans up on unmount

  const logout = async () => {
    // ... (logout function waisa hi) ...
    try {
      await signOut(auth);
     
    } catch (e: any) {
      console.error("AuthContext: Error during logout:", e);
      setError(e);
    }
  };

  // Log current context value whenever it changes (for debugging)

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, error, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};