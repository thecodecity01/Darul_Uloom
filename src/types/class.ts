// src/types/class.ts

import { Timestamp } from 'firebase/firestore';

export interface ClassData {
  id: string;
  name: string;
  description?: string;
  academicYear?: string;
  
  // Is line ko theek kiya gaya hai
  createdAt?: Timestamp; // Firestore se hamesha Timestamp hi aata hai
  
  // Hum display ke liye ek optional string alag se rakh sakte hain
  createdAtString?: string;
}