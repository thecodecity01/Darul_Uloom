// src/types/class.ts
import { Timestamp } from 'firebase/firestore';

export interface ClassData {
  id: string; // Firestore document ID
  name: string;
  description?: string;
  academicYear?: string;
  createdAt?: Timestamp | Date; // Firestore timestamp
  updatedAt?: Timestamp | Date;
  // ... koi aur fields jo aapki 'classes' collection mein hon
}