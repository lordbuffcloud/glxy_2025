'use client';

import { useEffect, useState } from 'react';
import { getFirebase } from '@/lib/firebase';
import { UserProvider } from '@/contexts/UserContext';
import { StardustProvider } from '@/contexts/StardustContext';
import { PlanetsProvider } from '@/contexts/PlanetsContext';
import { ErrorBoundary } from './ErrorBoundary';

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const initFirebase = async () => {
      try {
        await getFirebase();
      } catch (error) {
        console.error('Firebase initialization error:', error);
      } finally {
        setMounted(true);
      }
    };
    initFirebase();
  }, []);

  if (!mounted) {
    // Return empty div during SSR to match client initial render
    return <div id="app" suppressHydrationWarning />;
  }

  return (
    <ErrorBoundary>
      <UserProvider>
        <StardustProvider>
          <PlanetsProvider>
            <div id="app">{children}</div>
          </PlanetsProvider>
        </StardustProvider>
      </UserProvider>
    </ErrorBoundary>
  );
} 