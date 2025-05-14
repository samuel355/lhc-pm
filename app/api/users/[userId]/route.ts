import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function PATCH(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const user = await currentUser();
    if (!user || user.publicMetadata.role !== 'sysadmin') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { firstName, lastName, role, position, department_id } = await request.json();
    const supabase = await createClient(cookies());

    // Update user in Supabase
    const { error: supabaseError } = await supabase
      .from('users')
      .update({
        full_name: `${firstName} ${lastName}`,
        role,
        department_id: department_id || null,
      })
      .eq('id', params.userId);

    if (supabaseError) {
      throw supabaseError;
    }

    // Update user metadata in Clerk
    const clerk = await clerkClient();
    await clerk.users.updateUser(params.userId, {
      firstName,
      lastName,
      publicMetadata: {
        role,
        position,
        department_id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 