import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

interface Department {
  name: string;
}

interface SupabaseUser {
  id: string;
  clerk_id: string;
  department_id: string | null;
  department_head: boolean | null;
  departments: Department | null;
}

export async function GET() {
  try {
    const user = await currentUser();

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get all users from Clerk
    const clerk = await clerkClient();
    const response = await clerk.users.getUserList();

    // Get all users with department info from Supabase
    const supabase = await createClient(cookies());
    const { data: supabaseUsers, error } = await supabase
      .from('users')
      .select(`
        id,
        clerk_id,
        department_id,
        department_head,
        departments (
          name
        )
      `);

    if (error) throw error;

    console.log('Supabase users:', JSON.stringify(supabaseUsers, null, 2));

    // Create a map of Supabase user data by ID
    const supabaseUserMap = new Map(
      (supabaseUsers as unknown as SupabaseUser[])?.map(u => [u.clerk_id, u]) || []
    );

    // Transform the data to a simpler format
    const simplifiedUsers = response.data.map(user => {
      const supabaseUser = supabaseUserMap.get(user.id);
      console.log('Processing user:', user.id, 'Supabase data:', supabaseUser);
      return {
        id: user.id,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        username: user.username || '',
        email: user.emailAddresses[0]?.emailAddress || '',
        role: user.publicMetadata.role || 'member',
        position: user.publicMetadata.position || '',
        department_id: supabaseUser?.department_id || null,
        department: supabaseUser?.departments?.name || null,
        department_head: supabaseUser?.department_head || null
      };
    });

    console.log('Final users data:', JSON.stringify(simplifiedUsers, null, 2));

    return NextResponse.json(simplifiedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 