// src/types/student.ts
import { Timestamp } from 'firebase/firestore';

export interface StudentData {
  id: string; // Firestore document ID
  name: string;
  classId?: string; // Foreign key to Classes collection
  className?: string; // Denormalized class name for easy display
  photoUrl?: string;
  documents?: { name: string; url: string; type: string }[]; // Array of document objects
  dateOfBirth?: Timestamp | Date | string; // Firestore timestamp, Date object, or string
  guardianName?: string;
  guardianContact?: string;
  // ... koi aur fields jo zaroori hon
  createdAt?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}