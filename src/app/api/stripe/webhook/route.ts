import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { doc, updateDoc, addDoc, collection, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = headers();
  const sig = headersList.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const { userId, stardustAmount } = session.metadata!;

    try {
      // Update user's Stardust balance
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        stardust: increment(parseInt(stardustAmount)),
      });

      // Create transaction record
      const transactionRef = collection(db, 'users', userId, 'transactions');
      await addDoc(transactionRef, {
        amount: parseInt(stardustAmount),
        type: 'credit',
        description: 'Stardust purchase',
        planetName: 'system',
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error processing payment:', error);
      return NextResponse.json(
        { error: 'Failed to process payment' },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
} 