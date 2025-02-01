'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import AppLayout from '@/components/layout/AppLayout';
import { useUser } from '@/contexts/UserContext';
import { useStardust } from '@/contexts/StardustContext';
import { loadStripe } from '@stripe/stripe-js';

const DEFAULT_AVATAR = 'https://api.dicebear.com/7.x/initials/svg?seed=User';

declare const Stripe: any;

export default function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile } = useUser();
  const { addStardust } = useStardust();
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push('/auth/signin');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    // Check for successful Stripe payment
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      // Clear the URL parameter
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [searchParams]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/auth/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleBuyStardust = async () => {
    try {
      setPurchaseLoading(true);
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.uid,
          amount: 5, // $5 for 100 Stardust
        }),
      });

      const { sessionId } = await response.json();
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
      await stripe.redirectToCheckout({ sessionId });
    } catch (error) {
      console.error('Error initiating purchase:', error);
    } finally {
      setPurchaseLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-indigo-600">GLXY</h1>
              </div>
              <div className="hidden md:flex md:items-center md:space-x-4">
                <div className="text-sm font-medium text-gray-500">{user.email}</div>
                <div className="relative h-8 w-8">
                  <Image
                    className="rounded-full"
                    src={user.photoURL || DEFAULT_AVATAR}
                    alt={user.displayName || 'User'}
                    referrerPolicy="no-referrer"
                    fill
                    sizes="32px"
                  />
                </div>
                <button
                  onClick={handleSignOut}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Sign out
                </button>
              </div>
              <div className="md:hidden">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  type="button"
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                  aria-controls="mobile-menu"
                  aria-expanded={mobileMenuOpen}
                >
                  <span className="sr-only">Open main menu</span>
                  {mobileMenuOpen ? (
                    <svg
                      className="block h-6 w-6"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg
                      className="block h-6 w-6"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
          {mobileMenuOpen && (
            <div className="md:hidden" id="mobile-menu">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                <div className="px-3 py-2">
                  <div className="text-sm font-medium text-gray-500">{user.email}</div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-3 py-2 text-sm text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  Sign out
                </button>
              </div>
            </div>
          )}
        </nav>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Stardust Balance Card */}
                <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg p-6 text-white">
                  <h2 className="text-xl font-semibold mb-2">Stardust Balance</h2>
                  <p className="text-3xl font-bold">{profile.stardust}</p>
                  <p className="text-sm opacity-80 mt-2">Available tokens</p>
                </div>

                {/* Usage Statistics Card */}
                <div className="bg-white border rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">Usage Statistics</h2>
                  <p className="text-3xl font-bold text-gray-900">0</p>
                  <p className="text-sm text-gray-500 mt-2">Tokens used this month</p>
                </div>

                {/* Quick Actions Card */}
                <div className="bg-white border rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
                  <button
                    onClick={handleBuyStardust}
                    disabled={purchaseLoading}
                    className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {purchaseLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      'Buy Stardust (100 ⭐ for $5)'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </AppLayout>
  );
} 