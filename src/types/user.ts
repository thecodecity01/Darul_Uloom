// src/types/user.ts
import { Timestamp } from 'firebase/firestore'; // Agar createdAt/updatedAt ke liye specific type chahiye

export interface UserProfile {
  uid: string;
  name?: string;
  email: string | null;
  role?: 'super_admin' | 'teacher';
  photoURL?: string;
  assignedClasses?: string[]; // Teachers ke liye (example)
  createdAt?: Timestamp | Date | any; // Firestore timestamp ya Date object
  updatedAt?: Timestamp | Date | any;
  // ... koi aur fields jo aapke 'users' collection mein hon
}