'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sidebar } from '@/components/ui/sidebar';
import { UserButton } from '@clerk/nextjs';
import {
  HomeIcon,
  BriefcaseIcon,
  BuildingIcon,
  ChevronDownIcon,
  PlusIcon,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useUser } from '@clerk/nextjs';

interface Department {
  id: string;
  name: string;
  projects: Project[];
}

interface Project {
  id: string;
  name: string;
  department_id: string;
}

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [openSections, setOpenSections] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch departments and their projects
  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const { data: depts, error: deptError } = await supabase
        .from('departments')
        .select('*');

      if (deptError) {
        console.error('Error fetching departments:', deptError);
        return;
      }

      const deptsWithProjects = await Promise.all(
        depts.map(async (dept) => {
          const { data: projects } = await supabase
            .from('projects')
            .select('*')
            .eq('department_id', dept.id);
          return { ...dept, projects: projects || [] };
        })
      );

      setDepartments(deptsWithProjects);
      setLoading(false);
    };

    fetchData();
  }, []);

  const toggleSection = (id: string) => {
    setOpenSections((prev) =>
      prev.includes(id)
        ? prev.filter((t) => t !== id)
        : [...prev, id]
    );
  };

  const isAdmin = user?.publicMetadata?.role === 'admin' || user?.publicMetadata?.role === 'sysadmin';
  const isDepartmentHead = user?.publicMetadata?.role === 'department_head';

  return (
    <Sidebar className="border-r border-border/40 shadow-sm">
      <div className="flex h-14 items-center border-b border-border/40 px-4 shadow-sm">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <span className="text-xl">LHC-PM</span>
        </Link>
      </div>
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1 py-2">
          <Link
            href="/dashboard"
            className={cn(
              'flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent/50 hover:text-accent-foreground transition-colors',
              pathname === '/dashboard' && 'bg-accent/50 text-accent-foreground'
            )}
          >
            <HomeIcon className="mr-2 h-4 w-4" />
            Overview
          </Link>

          {loading ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">Loading...</div>
          ) : (
            departments.map((dept) => (
              <div key={dept.id} className="px-2 py-1">
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    className="flex-1 justify-between hover:bg-accent/50 transition-colors"
                    onClick={() => toggleSection(dept.id)}
                  >
                    <div className="flex items-center">
                      <BuildingIcon className="mr-2 h-4 w-4" />
                      <Link
                        href={`/dashboard/departments/${dept.id}`}
                        className="hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {dept.name}
                      </Link>
                    </div>
                    <ChevronDownIcon
                      className={cn(
                        'h-4 w-4 transition-transform',
                        openSections.includes(dept.id) && 'rotate-180'
                      )}
                    />
                  </Button>
                </div>
                {openSections.includes(dept.id) && (
                  <div className="mt-1 space-y-0.5 pl-4">
                    {dept.projects.map((project) => (
                      <Link
                        key={project.id}
                        href={`/dashboard/projects/${project.id}`}
                        className={cn(
                          'flex items-center rounded-md px-3 py-1.5 text-sm font-medium hover:bg-accent/50 hover:text-accent-foreground transition-colors',
                          pathname === `/dashboard/projects/${project.id}` && 'bg-accent/50 text-accent-foreground'
                        )}
                      >
                        <BriefcaseIcon className="mr-2 h-4 w-4" />
                        {project.name}
                      </Link>
                    ))}
                    {(isAdmin || (isDepartmentHead && dept.id === user.publicMetadata.department_id)) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                        asChild
                      >
                        <Link href={`/dashboard/projects/new?department=${dept.id}`}>
                          <PlusIcon className="mr-2 h-4 w-4" />
                          Add Project
                        </Link>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}

          {isAdmin && (
            <div className="px-2 py-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                asChild
              >
                <Link href="/dashboard/departments/new">
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Add Department
                </Link>
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="border-t border-border/40 p-4 shadow-sm">
        <UserButton afterSignOutUrl="/sign-in" />
      </div>
    </Sidebar>
  );
} 