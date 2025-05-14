import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const user = await currentUser();

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get all users
    const clerk = await clerkClient();
    const response = await clerk.users.getUserList();

    // Transform the data to a simpler format
    const simplifiedUsers = response.data.map(user => ({
      id: user.id,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      username: user.username || '',
      email: user.emailAddresses[0]?.emailAddress || '',
      role: user.publicMetadata.role || 'member'
    }));

    return NextResponse.json(simplifiedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 