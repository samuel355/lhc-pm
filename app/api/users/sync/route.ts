import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const user = await currentUser();
    if (!user || user.publicMetadata.role !== 'sysadmin') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const supabase = await createClient(cookies());
    const clerk = await clerkClient();
    const response = await clerk.users.getUserList();

    // Get existing Supabase users
    const { data: existingUsers } = await supabase
      .from('users')
      .select('id');

    const existingUserIds = new Set(existingUsers?.map(u => u.id) || []);

    // Create users in Supabase that don't exist yet
    for (const clerkUser of response.data) {
      if (!existingUserIds.has(clerkUser.id)) {
        const email = clerkUser.emailAddresses[0]?.emailAddress;
        if (!email) continue;

        const { error } = await supabase
          .from('users')
          .insert({
            id: clerkUser.id,
            email,
            full_name: `${clerkUser.firstName} ${clerkUser.lastName}`,
            role: clerkUser.publicMetadata.role || 'member',
            position: clerkUser.publicMetadata.position || null,
            department_id: clerkUser.publicMetadata.department_id || null,
          });

        if (error) {
          console.error(`Error creating user ${clerkUser.id} in Supabase:`, error);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error syncing users:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 