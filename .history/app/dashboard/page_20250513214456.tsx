import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { UsersIcon, BriefcaseIcon, ClipboardListIcon } from 'lucide-react';

export default async function DashboardPage() {
  const supabase = await createClient();
  const [{ count: deptCount }, { count: projCount }, { count: taskCount }] = await Promise.all([
    supabase.from('departments').select('*', { count: 'exact', head: true }),
    supabase.from('projects').select('*', { count: 'exact', head: true }),
    supabase.from('tasks').select('*', { count: 'exact', head: true }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Overview</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/dashboard/departments">
          <Card className="hover:shadow-md transition bg-card text-card-foreground">
            <CardHeader className="flex items-center space-x-2">
              <UsersIcon className="w-6 h-6" />
              <CardTitle>Departments</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{deptCount}</CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/projects">
          <Card className="hover:shadow-md transition bg-card text-card-foreground">
            <CardHeader className="flex items-center space-x-2">
              <BriefcaseIcon className="w-6 h-6" />
              <CardTitle>Projects</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{projCount}</CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/tasks">
          <Card className="hover:shadow-md transition bg-card text-card-foreground">
            <CardHeader className="flex items-center space-x-2">
              <ClipboardListIcon className="w-6 h-6" />
              <CardTitle>Tasks</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{taskCount}</CardContent>
          </Card>
        </Link>
      </div>
    </div>
}