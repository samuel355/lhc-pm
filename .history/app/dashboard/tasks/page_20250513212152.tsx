import { createClient } from '@/utils/supabase/server';
import { DBTask } from '@/lib/types/db';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default async function TasksPage() {
  const supabase = await createClient();
  const { data: tasks, error } = await supabase.from('tasks').select('*, projects(name)').order('due_date', { ascending: true });

  if (error) return <div className="text-destructive">Error: {error.message}</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Tasks</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks?.map((task: DBTask & { projects: { name: string } }) => (
          <Card key={task.id} className="hover:shadow-md transition bg-card text-card-foreground">
            <CardHeader>
              <CardTitle className="text-lg font-medium">{task.title}</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">{task.projects.name}</CardDescription>
            </CardHeader>
            <CardContent className="mt-2">
              <p className="text-sm text-foreground/80">{task.description || 'No description.'}</p>
              <div className="mt-2 text-sm">Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}