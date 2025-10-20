import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function Home() {
  const { userId } = await auth();
  
  if (userId) {
    // User is signed in, redirect to dashboard
    // The dashboard layout will handle approval checking
    redirect('/dashboard');
  } else {
    // User is not signed in, redirect to sign-in
    redirect('/sign-in');
  }
}
