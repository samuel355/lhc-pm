// app/dashboard/projects/page.tsx
import { createClient } from '@/utils/supabase/server';
import { DBProject } from '@/lib/types/db';
import { PageHeader } from '@/components/ui/page-header';
import { cookies } from 'next/headers';
import { ProjectsGrid } from './ProjectsGrid';

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
      <PageHeader
        title="All Projects"
        description="View and manage all projects across departments"
      />
      <ProjectsGrid projects={(projects as DBProject[]) || []} />
    </div>
  );
}
