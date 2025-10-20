import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabase = await createClient(cookies());
    const { data: userData, error } = await supabase
      .from('users')
      .select(`
        id,
        role,
        position,
        department_id,
        departments (
          id,
          name
        )
      `)
      .eq('clerk_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching user status:', error);
      return NextResponse.json({ error: 'Failed to fetch user status' }, { status: 500 });
    }

    const isApproved = userData?.department_id && userData?.role;
    const departmentName = userData?.departments ? 
      (Array.isArray(userData.departments) ? userData.departments[0]?.name : (userData.departments as { name: string })?.name) 
      : null;
    
    const response = {
      isApproved: !!isApproved,
      departmentName: departmentName || null,
      role: userData?.role,
      position: userData?.position,
      departmentId: userData?.department_id,
      lastChecked: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in approval status API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
