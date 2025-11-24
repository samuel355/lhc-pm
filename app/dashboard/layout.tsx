import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import ThemeToggle from '@/components/ThemeToggle';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { checkUserApproval } from '@/lib/auth-utils';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let user;
  try {
    user = await currentUser();
  } catch (error) {
    console.error('Error fetching Clerk user:', error);
    redirect('/sign-in'); 
  }

  // Check if user exists
  if (!user) {
    redirect('/sign-in');
  }

  // Use centralized approval checking
  const approvalStatus = checkUserApproval(user);
  
  // If Clerk metadata shows user is not approved, double-check with database
  // This handles cases where Clerk metadata hasn't been updated yet
  if (!approvalStatus.isApproved) {
    try {
      const supabase = await createClient(cookies());
      const { data: userData, error } = await supabase
        .from('users')
        .select('role, department_id')
        .eq('clerk_id', user.id)
        .single();

      if (error || !userData?.department_id || !userData?.role) {
        // User is genuinely not approved
        console.warn('User not fully approved:', {
          userId: user.id,
          approvalStatus,
          dbData: userData,
          dbError: error
        });
        redirect('/wait-for-approval');
      } else {
        // User is approved in database but Clerk metadata is outdated
        console.log('User approved in database but Clerk metadata outdated:', {
          userId: user.id,
          clerkMetadata: user.publicMetadata,
          dbData: userData
        });
        // Allow access to dashboard - the metadata will be updated eventually
      }
    } catch (dbError) {
      console.error('Error checking database approval status:', dbError);
      redirect('/wait-for-approval');
    }
  }


  return (
    <SidebarProvider>
      <div className="flex h-screen w-full flex-row justify-between">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 w-full">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="ml-auto flex items-center gap-4">
              <ThemeToggle />
              <UserButton 
                afterSignOutUrl="/sign-in"
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-8 h-8",
                    userButtonPopoverCard: "glass-card",
                    userButtonPopoverActionButton: "hover:bg-accent/50",
                    userButtonPopoverActionButtonText: "text-sm",
                    userButtonPopoverFooter: "hidden"
                  }
                }}
              />
            </div>
          </header>
          <main className="flex-1 p-6 ml-0 md:ml-[80px]">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}