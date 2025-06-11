import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore'; // Added doc and getDoc
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration from .env.local
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  // measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Agar use kar rahe hain
};


// Initialize Firebase for SSR + SSG, it should only be initialized once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app); // Firestore instance
const storage = getStorage(app);

// Function to get user profile from Firestore
export const getUserProfile = async (uid: string) => {
  if (!uid) {
    console.log("UID is missing, cannot fetch profile.");
    return null;
  }
  try {
    const userDocRef = doc(db, 'users', uid); // 'users' is your collection name
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      // console.log("User profile data:", userDocSnap.data());
      return { uid, ...userDocSnap.data() }; // Return UID along with other data from the document
    } else {
      console.log('No such user profile in Firestore for UID:', uid);
      return null;
    }
  } catch (error) {
    console.error("Error fetching user profile from Firestore:", error);
    return null;
  }
};

export { app, auth, db, storage };