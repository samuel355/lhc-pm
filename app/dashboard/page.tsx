import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { UsersIcon, BriefcaseIcon, ClipboardListIcon } from 'lucide-react';
import { cookies } from 'next/headers';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/');
  }

  const supabase = await createClient(cookies());
  const [{ count: deptCount }, { count: projCount }, { count: taskCount }] = await Promise.all([
    supabase.from('departments').select('*', { count: 'exact', head: true }),
    supabase.from('projects').select('*', { count: 'exact', head: true }),
    supabase.from('tasks').select('*', { count: 'exact', head: true }),
  ]);

  return (
    <div className="space-y-6 font-outfit">
      <h1 className="text-3xl font-bold">Overview</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/dashboard/departments">
          <Card className="group relative overflow-hidden bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm border-neutral-200/30 dark:border-neutral-800/30 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.4)] transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-neutral-100/50 dark:from-neutral-900/50 dark:to-neutral-800/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="flex items-center space-x-2 relative">
              <UsersIcon className="w-6 h-6" />
              <CardTitle>Departments</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold relative">{deptCount}</CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/projects">
          <Card className="group relative overflow-hidden bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm border-neutral-200/30 dark:border-neutral-800/30 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.4)] transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-neutral-100/50 dark:from-neutral-900/50 dark:to-neutral-800/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="flex items-center space-x-2 relative">
              <BriefcaseIcon className="w-6 h-6" />
              <CardTitle>Projects</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold relative">{projCount}</CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/tasks">
          <Card className="group relative overflow-hidden bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm border-neutral-200/30 dark:border-neutral-800/30 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.4)] transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-neutral-100/50 dark:from-neutral-900/50 dark:to-neutral-800/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="flex items-center space-x-2 relative">
              <ClipboardListIcon className="w-6 h-6" />
              <CardTitle>Tasks</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold relative">{taskCount}</CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}