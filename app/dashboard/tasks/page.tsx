import { createClient } from '@/utils/supabase/server';
import { DBTask } from '@/lib/types/db';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cookies } from 'next/headers';
import { CheckCircleIcon, ClockIcon, AlertCircleIcon, FolderIcon } from 'lucide-react';
import Link from 'next/link';

export default async function TasksPage() {
  const supabase = await createClient(cookies());
  const { data: tasks, error } = await supabase.from('tasks').select('*, projects(name)').order('start_date', { ascending: true });

  if (error) return <div className="text-destructive">Error: {error.message}</div>;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-4 h-4 text-chart-3" />;
      case 'in_progress':
        return <ClockIcon className="w-4 h-4 text-chart-2" />;
      case 'pending':
        return <AlertCircleIcon className="w-4 h-4 text-chart-4" />;
      default:
        return <ClockIcon className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-chart-3/10 text-chart-3 border-chart-3/20';
      case 'in_progress':
        return 'bg-chart-2/10 text-chart-2 border-chart-2/20';
      case 'pending':
        return 'bg-chart-4/10 text-chart-4 border-chart-4/20';
      default:
        return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          All Tasks
        </h1>
        <p className="text-muted-foreground text-lg">
          Track and manage tasks across all projects
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks?.map((task: DBTask & { projects: { name: string } }, index) => (
          <Link 
            key={task.id} 
            href={`/dashboard/projects/${task.project_id}`}
            className="group"
          >
            <Card className="glass-card group-hover:shadow-2xl group-hover:shadow-chart-3/10 dark:group-hover:shadow-chart-3/20 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 cursor-pointer overflow-hidden"
                  style={{ animationDelay: `${index * 100}ms` }}>
              <div className="absolute inset-0 bg-gradient-to-br from-chart-3/5 via-transparent to-chart-4/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="relative">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <CardTitle className="text-xl font-semibold group-hover:text-chart-3 transition-colors duration-300 line-clamp-2">
                      {task.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FolderIcon className="w-4 h-4" />
                      <span>{task.projects.name}</span>
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-chart-3/10 group-hover:bg-chart-3/20 transition-colors duration-300">
                    {getStatusIcon(task.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className={`${getStatusColor(task.status)} border`}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(task.status)}
                      <span className="capitalize">{task.status.replace('_', ' ')}</span>
                    </div>
                  </Badge>
                </div>
                <p className="text-sm text-foreground/80 line-clamp-3">
                  {task.description || 'No description provided.'}
                </p>
                {task.start_date && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ClockIcon className="w-3 h-3" />
                    <span>
                      Started {new Date(task.start_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      
      {tasks?.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted/50 mb-4">
            <CheckCircleIcon className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Tasks Yet</h3>
          <p className="text-muted-foreground">Tasks will appear here once they are created for projects.</p>
        </div>
      )}
    </div>
  );
}