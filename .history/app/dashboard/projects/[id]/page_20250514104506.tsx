'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProjectForm } from '@/components/projects/project-form';
import { TaskForm } from '@/components/projects/task-form';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string;
  department_id: string;
  created_at: string;
}

export default function ProjectPage() {
  const params = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProject = useCallback(async (id: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching project:', error);
      return;
    }

    setProject(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (params.id) {
      fetchProject(params.id as string);
    }
  }, [params.id, fetchProject]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-8 w-32" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (!project) {
    return <div>Project not found</div>;
  }

  const tasks = project.tasks || [];
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">{project.name}</h2>
          <p className="text-muted-foreground mt-1">
            Department: {project.department_id}
          </p>
        </div>
        <div className="flex gap-2">
          <ProjectForm
            departmentId={project.department_id}
            project={project}
            onSuccess={() => fetchProject(params.id as string)}
          />
          <TaskForm
            projectId={project.id}
            onSuccess={() => fetchProject(params.id as string)}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Project Details</h3>
              <div className="space-y-2">
                <p><span className="font-medium">Description:</span> {project.description}</p>
                <p><span className="font-medium">Start Date:</span> {new Date(project.start_date || '').toLocaleDateString()}</p>
                <p><span className="font-medium">End Date:</span> {new Date(project.end_date || '').toLocaleDateString()}</p>
                <p><span className="font-medium">Progress:</span> {progress.toFixed(0)}%</p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Task Summary</h3>
              <div className="space-y-2">
                <p><span className="font-medium">Total Tasks:</span> {totalTasks}</p>
                <p><span className="font-medium">Completed:</span> {completedTasks}</p>
                <p><span className="font-medium">Pending:</span> {totalTasks - completedTasks}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-xl font-medium mb-4">Tasks</h3>
        <div className="space-y-4">
          {tasks.map((task) => (
            <Card key={task.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-medium">{task.title}</h4>
                    <p className="text-muted-foreground text-sm mt-1">{task.description}</p>
                    <div className="mt-2 text-sm text-muted-foreground">
                      Due: {new Date(task.due_date || '').toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      task.status === 'completed' ? 'default' :
                      task.status === 'in_progress' ? 'secondary' :
                      'outline'
                    }>
                      {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                    </Badge>
                    <TaskForm
                      projectId={project.id}
                      task={task}
                      onSuccess={() => fetchProject(params.id as string)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
} 