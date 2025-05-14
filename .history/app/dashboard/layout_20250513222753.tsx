import { MainNav } from '@/components/MainNav';
import ThemeToggle from '@/components/ThemeToggle';
import { UserButton } from '@clerk/nextjs';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <div className="pt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-end items-center gap-4 mb-6">
            <ThemeToggle />
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
          <main className="backdrop-blur-md bg-background/60 rounded-lg border border-border/40 p-6 shadow-lg">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}