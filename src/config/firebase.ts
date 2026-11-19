import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBBEwe9iAf3th4RSHnaL3BT8-pcN3xKHf4',
  authDomain: 'prepmate-ai-9f68a.firebaseapp.com',
  projectId: 'prepmate-ai-9f68a',
  storageBucket: 'prepmate-ai-9f68a.firebasestorage.app',
  messagingSenderId: '950184216125',
  appId: '1:950184216125:web:063830078c5a8b97bb4c54',
  measurementId: 'G-54MLHBZ331',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;

