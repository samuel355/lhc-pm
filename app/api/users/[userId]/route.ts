import { currentUser, clerkClient } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function PATCH(request: NextRequest) {
  try {
    // only sysadmins allowed
    const me = await currentUser();
    if (!me || me.publicMetadata.role !== 'sysadmin') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const userId = request.url.split('/').pop();
    if (!userId) {
      return new NextResponse('User ID is required', { status: 400 });
    }

    const { firstName, lastName, role, position, department_id } =
      await request.json();

    // 1) Update Supabase
    const supabase = await createClient(cookies());
    const { error: supabaseError } = await supabase
      .from('users')
      .update({
        full_name: `${firstName} ${lastName}`,
        role,
        department_id: department_id || null,
      })
      .eq('id', userId);
    if (supabaseError) throw supabaseError;

    // 2) Update Clerk
    const clerk = await clerkClient();
    await clerk.users.updateUser(userId, {
      firstName,
      lastName,
      publicMetadata: { role, position, department_id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error updating user:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
