'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import { useProjectStore } from '@/lib/store/project-store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProjectForm } from '@/components/projects/project-form';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, FolderOpen } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { Breadcrumb } from '@/components/ui/breadcrumb';

interface Department {
  id: string;
  name: string;
}

export default function DepartmentPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { projects, isLoading, error, fetchProjects } = useProjectStore();
  const [department, setDepartment] = useState<Department | null>(null);

  useEffect(() => {
    const fetchDepartment = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('id', resolvedParams.id)
        .single();

      if (error) {
        console.error('Error fetching department:', error);
        return;
      }

      setDepartment(data);
    };

    fetchDepartment();
    fetchProjects(resolvedParams.id);
  }, [resolvedParams.id, fetchProjects]);

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Departments', href: '/dashboard/departments' },
    { label: department?.name || 'Department' }
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Breadcrumb items={breadcrumbItems} />
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-foreground">{department?.name || 'Department'}</h2>
          <ProjectForm
            departmentId={resolvedParams.id}
            onSuccess={() => fetchProjects(resolvedParams.id)}
          />
        </div>
      </div>

      {(!projects || projects.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-card rounded-lg border border-border">
          <div className="p-4 rounded-full bg-primary/10 mb-4">
            <FolderOpen className="h-12 w-12 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">No Projects Yet</h3>
          <p className="text-muted-foreground max-w-md">
            Get started by creating your first project in this department. Projects help you organize and track your work effectively.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => {
            const completedTasks = project.tasks?.filter(t => t.status === 'completed').length || 0;
            const totalTasks = project.tasks?.length || 0;
            const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
            const description = project.description || '';
            const truncatedDescription = description.length > 100 
              ? `${description.slice(0, 100)}...` 
              : description;

            return (
              <Card key={project.id} className="hover:shadow-md transition cursor-pointer border-border bg-card">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-foreground">{project.name}</h3>
                      <p className="text-muted-foreground text-sm mt-1">
                        {truncatedDescription}
                      </p>
                    </div>
                    <Badge variant={progress === 100 ? "default" : "secondary"}>
                      {progress.toFixed(0)}% Complete
                    </Badge>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Start: {new Date(project.start_date || '').toLocaleDateString()}</span>
                      <span>End: {new Date(project.end_date || '').toLocaleDateString()}</span>
                    </div>
                    <div className="mt-2">
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
} 