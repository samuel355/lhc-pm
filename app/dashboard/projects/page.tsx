// app/dashboard/projects/page.tsx
import { createClient } from '@/utils/supabase/server';
import { DBProject } from '@/lib/types/db';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PlusIcon, CalendarIcon, BuildingIcon } from 'lucide-react';
import { cookies } from 'next/headers';
import Link from 'next/link';

export default async function ProjectsPage() {
  const supabase = await createClient(cookies());
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*, departments(name)')
    .order('start_date', { ascending: true });

  if (error) {
    return <p className="text-destructive">Error: {error.message}</p>;
  }

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          All Projects
        </h1>
        <p className="text-muted-foreground text-lg">
          View and manage all projects across departments
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects?.map((project: DBProject, index) => (
          <Link 
            key={project.id} 
            href={`/dashboard/projects/${project.id}`}
            className="group"
          >
            <Card className="glass-card group-hover:shadow-2xl group-hover:shadow-chart-2/10 dark:group-hover:shadow-chart-2/20 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 cursor-pointer overflow-hidden"
                  style={{ animationDelay: `${index * 100}ms` }}>
              <div className="absolute inset-0 bg-gradient-to-br from-chart-2/5 via-transparent to-chart-3/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="relative">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-semibold group-hover:text-chart-2 transition-colors duration-300">
                      {project.name}
                    </CardTitle>
                    {project.departments && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <BuildingIcon className="w-4 h-4" />
                        <span>{project.departments.name} Department</span>
                      </div>
                    )}
                  </div>
                  <div className="p-2 rounded-lg bg-chart-2/10 group-hover:bg-chart-2/20 transition-colors duration-300">
                    <CalendarIcon className="w-5 h-5 text-chart-2" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarIcon className="w-4 h-4" />
                  <span>
                    {project.start_date
                      ? new Date(project.start_date).toLocaleDateString()
                      : 'No start date'}
                    {' – '}
                    {project.end_date
                      ? new Date(project.end_date).toLocaleDateString()
                      : 'Ongoing'}
                  </span>
                </div>
                <p className="text-sm text-foreground/80 line-clamp-3">
                  {project.description || 'No description provided.'}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      
      {projects?.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted/50 mb-4">
            <PlusIcon className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Projects Yet</h3>
          <p className="text-muted-foreground">Projects will appear here once they are created by department heads.</p>
        </div>
      )}
    </div>
  );
}

