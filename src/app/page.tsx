'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getFirebase } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { auth } = await getFirebase();
        const unsubscribe = auth.onAuthStateChanged((user) => {
          if (user) {
            router.push('/dashboard');
          } else {
            router.push('/auth/signin');
          }
          setLoading(false);
        });
        return () => unsubscribe();
      } catch (error) {
        console.error('Auth error:', error);
        setLoading(false);
        router.push('/auth/signin');
      }
    };

    initializeAuth();
  }, [router]);

  const signInWithGoogle = async () => {
    try {
      const { auth } = await getFirebase();
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Sign-in error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return null;
}
