import { createClient } from '@/utils/supabase/server';
import { UsersIcon, BriefcaseIcon, ClipboardListIcon, CheckCircle2Icon, CircleDotIcon, CircleDashedIcon } from 'lucide-react';
import { cookies } from 'next/headers';
import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/');
  }

  const user = await currentUser();
  const supabase = await createClient(cookies());
  const [
    { count: deptCount },
    { count: projCount },
    { count: taskCount },
    { count: completedCount },
    { count: inProgressCount },
    { count: pendingCount },
  ] = await Promise.all([
    supabase.from('departments').select('*', { count: 'exact', head: true }),
    supabase.from('projects').select('*', { count: 'exact', head: true }),
    supabase.from('tasks').select('*', { count: 'exact', head: true }),
    supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
    supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);

  const totalTasks = taskCount ?? 0;
  const completed = completedCount ?? 0;
  const inProgress = inProgressCount ?? 0;
  const pending = pendingCount ?? 0;
  const completionRate = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-8 font-outfit animate-slide-up">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">{today}</p>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Welcome back{user?.firstName ? `, ${user.firstName}` : ''}
        </h1>
        <p className="text-muted-foreground text-lg">
          Here&apos;s what&apos;s happening across your departments, projects, and tasks
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          href="/dashboard/departments"
          label="Departments"
          value={deptCount ?? 0}
          sublabel="Active departments"
          icon={UsersIcon}
          color="primary"
        />
        <StatCard
          href="/dashboard/projects"
          label="Projects"
          value={projCount ?? 0}
          sublabel="Active projects"
          icon={BriefcaseIcon}
          color="chart-2"
        />
        <StatCard
          href="/dashboard/tasks"
          label="Tasks"
          value={totalTasks}
          sublabel="Total tasks"
          icon={ClipboardListIcon}
          color="chart-3"
        />
      </div>

      <Card className="glass-card p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Task Completion</h2>
            <p className="text-sm text-muted-foreground">Overall progress across every task in the system</p>
          </div>
          <div className="text-3xl font-bold text-primary">{completionRate}%</div>
        </div>

        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-muted/50">
          <div
            className="h-3 rounded-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500 ease-out"
            style={{ width: `${completionRate}%` }}
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-lg border border-chart-3/20 bg-chart-3/5 p-4">
            <CheckCircle2Icon className="h-5 w-5 shrink-0 text-chart-3" />
            <div>
              <p className="text-lg font-bold text-chart-3">{completed}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-chart-2/20 bg-chart-2/5 p-4">
            <CircleDotIcon className="h-5 w-5 shrink-0 text-chart-2" />
            <div>
              <p className="text-lg font-bold text-chart-2">{inProgress}</p>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-chart-4/20 bg-chart-4/5 p-4">
            <CircleDashedIcon className="h-5 w-5 shrink-0 text-chart-4" />
            <div>
              <p className="text-lg font-bold text-chart-4">{pending}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
