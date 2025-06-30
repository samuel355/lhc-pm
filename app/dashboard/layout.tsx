import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import ThemeToggle from '@/components/ThemeToggle';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let user;
  try {
    user = await currentUser();
    console.log('Clerk User:', user);
  } catch (error) {
    console.error('Error fetching Clerk user:', error);
    redirect('/sign-in'); 
  }

  if (!user || user?.publicMetadata?.department_id === '' || user?.publicMetadata?.department_id === null) {
    console.warn('User not approved or department_id missing:', user?.id, user?.publicMetadata?.department_id);
    redirect('/wait-for-approval');
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 w-full">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="ml-auto flex items-center gap-4">
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}