```tsx
// app/dashboard/projects/page.tsx
import { createClient } from '@/lib/supabase/server';
import { DBProject } from '@/lib/types/db';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .order('start_date', { ascending: true });

  if (error) {
    return <p className="text-destructive">Error: {error.message}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Projects</h2>
        <Button variant="outline" className="flex items-center space-x-2">
          <PlusIcon className="h-4 w-4" />
          <span>Add Project</span>
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects?.map((project: DBProject) => (
          <Card
            key={project.id}
            className="border-border hover:shadow-md transition bg-card text-card-foreground"
          >
            <CardHeader>
              <CardTitle className="text-lg font-medium">
                {project.name}
              </CardTitle>
              <CardDescription className="text-muted-foreground text-sm">
                {project.start_date
                  ? new Date(project.start_date).toLocaleDateString()
                  : 'No start date'}
                {' – '}
                {project.end_date
                  ? new Date(project.end_date).toLocaleDateString()
                  : 'Ongoing'}
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-2">
              <p className="text-sm text-foreground/80">
                {project.description || 'No description provided.'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```
