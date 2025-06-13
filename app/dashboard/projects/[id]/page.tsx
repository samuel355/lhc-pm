'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProjectForm } from '@/components/projects/project-form';
import { TaskForm } from '@/components/projects/task-form';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarIcon } from '@radix-ui/react-icons';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'completed' | 'pending' | 'in_progress';
  due_date: string | null;
  created_at: string;
  start_date: string | null;
  end_date: string | null;
  created_by: string | null;
  department_id: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  department_id: string;
  created_at: string;
  start_date: string | null;
  end_date: string | null;
  tasks: Task[];
}

type PageParams = {
  id: string;
  [key: string]: string;
}

export default function ProjectPage() {
  const params = useParams<PageParams>();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [departmentName, setDepartmentName] = useState<string | null>(null);

  const fetchProject = useCallback(async (id: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        tasks (*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.log('Error fetching project:', error);
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

  useEffect(() => {
    if (project?.department_id) {
      const fetchDepartmentName = async () => {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('departments')
          .select('name')
          .eq('id', project.department_id)
          .single();
        if (!error && data) setDepartmentName(data.name);
      };
      fetchDepartmentName();
    }
  }, [project?.department_id]);

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
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">{project.name}</h2>
          <p className="text-muted-foreground mt-1">
            Department: <span className='font-bold text-lg'>{departmentName || "Loading..."}</span>
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
            departmentId={project.department_id}
            onSuccess={() => fetchProject(params.id as string)}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div>
              <h3 className="text-lg font-semibold mb-3 text-primary">Project Details</h3>
              <div className="space-y-3">
                <p className="text-base"><span className="font-medium">Description:</span> {project.description}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarIcon className="w-4 h-4" />
                  <span><span className="font-medium">Start:</span> {project.start_date ? new Date(project.start_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Not set'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarIcon className="w-4 h-4" />
                  <span><span className="font-medium">End:</span> {project.end_date ? new Date(project.end_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Not set'}</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="font-medium">Progress:</span>
                  <Badge variant={progress === 100 ? 'default' : 'secondary'}>{progress.toFixed(0)}%</Badge>
                </div>
                <div className="w-full bg-muted rounded-full h-2 mt-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="md:border-l md:pl-6 border-muted-foreground/20">
              <h3 className="text-lg font-semibold mb-3 text-primary">Task Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-base">
                  <span className="font-medium">Total Tasks:</span> <Badge variant="outline">{totalTasks}</Badge>
                </div>
                <div className="flex items-center gap-2 text-base">
                  <span className="font-medium">Completed:</span> <Badge variant="default">{completedTasks}</Badge>
                </div>
                <div className="flex items-center gap-2 text-base">
                  <span className="font-medium">Pending:</span> <Badge variant="secondary">{totalTasks - completedTasks}</Badge>
                </div>
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
                      Start: {task.start_date ? new Date(task.start_date).toLocaleDateString() : 'Not set'}<br />
                      End: {task.end_date ? new Date(task.end_date).toLocaleDateString() : 'Not set'}
                      {task.end_date && new Date(task.end_date) < new Date() && (
                        <span className="ml-2 text-red-600 font-semibold">Overdue</span>
                      )}
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
                      departmentId={project.department_id}
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