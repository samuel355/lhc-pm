import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { v5 as uuidv5 } from 'uuid';

// Convert Clerk user ID to UUID format
function clerkIdToUuid(clerkId: string): string {
  // Use a namespace UUID for consistent generation
  const NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
  return uuidv5(clerkId, NAMESPACE);
}

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
      .select('id, clerk_id');

    const existingUserIds = new Set(existingUsers?.map(u => u.id) || []);
    const usersToUpdate = existingUsers?.filter(u => !u.clerk_id) || [];

    // Update existing users with missing clerk_id
    for (const user of usersToUpdate) {
      const clerkUser = response.data.find(cu => clerkIdToUuid(cu.id) === user.id);
      if (clerkUser) {
        const { error } = await supabase
          .from('users')
          .update({ clerk_id: clerkUser.id })
          .eq('id', user.id);

        if (error) {
          console.error(`Error updating clerk_id for user ${user.id}:`, error);
        }
      }
    }

    // Create users in Supabase that don't exist yet
    for (const clerkUser of response.data) {
      const supabaseId = clerkIdToUuid(clerkUser.id);
      if (!existingUserIds.has(supabaseId)) {
        const email = clerkUser.emailAddresses[0]?.emailAddress;
        if (!email) continue;

        const { error } = await supabase
          .from('users')
          .insert({
            id: supabaseId,
            email,
            full_name: `${clerkUser.firstName} ${clerkUser.lastName}`,
            role: clerkUser.publicMetadata.role || 'member',
            position: clerkUser.publicMetadata.position || null,
            department_id: clerkUser.publicMetadata.department_id || null,
            clerk_id: clerkUser.id
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