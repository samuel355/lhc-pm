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
    <div className="space-y-8 font-outfit animate-slide-up">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Welcome to LHC Project Management
        </h1>
        <p className="text-muted-foreground text-lg">
          Manage your departments, projects, and tasks efficiently
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/dashboard/departments" className="group">
          <Card className="glass-card group-hover:shadow-2xl group-hover:shadow-primary/10 dark:group-hover:shadow-primary/20 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 cursor-pointer overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="flex flex-row items-center space-y-0 space-x-4 pb-2 relative">
              <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                <UsersIcon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold">Departments</CardTitle>
                <p className="text-sm text-muted-foreground">Manage organizational units</p>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-primary">{deptCount}</div>
              <p className="text-sm text-muted-foreground mt-1">Active departments</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/dashboard/projects" className="group">
          <Card className="glass-card group-hover:shadow-2xl group-hover:shadow-chart-2/10 dark:group-hover:shadow-chart-2/20 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 cursor-pointer overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-chart-2/5 via-transparent to-chart-3/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="flex flex-row items-center space-y-0 space-x-4 pb-2 relative">
              <div className="p-3 rounded-xl bg-chart-2/10 group-hover:bg-chart-2/20 transition-colors duration-300">
                <BriefcaseIcon className="w-6 h-6 text-chart-2" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold">Projects</CardTitle>
                <p className="text-sm text-muted-foreground">Track project progress</p>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-chart-2">{projCount}</div>
              <p className="text-sm text-muted-foreground mt-1">Active projects</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/dashboard/tasks" className="group">
          <Card className="glass-card group-hover:shadow-2xl group-hover:shadow-chart-3/10 dark:group-hover:shadow-chart-3/20 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 cursor-pointer overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-chart-3/5 via-transparent to-chart-4/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="flex flex-row items-center space-y-0 space-x-4 pb-2 relative">
              <div className="p-3 rounded-xl bg-chart-3/10 group-hover:bg-chart-3/20 transition-colors duration-300">
                <ClipboardListIcon className="w-6 h-6 text-chart-3" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold">Tasks</CardTitle>
                <p className="text-sm text-muted-foreground">Monitor task completion</p>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-chart-3">{taskCount}</div>
              <p className="text-sm text-muted-foreground mt-1">Total tasks</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}