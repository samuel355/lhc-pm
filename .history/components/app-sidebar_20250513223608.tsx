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
import { useState } from 'react';
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
  useState(() => {
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
    <Sidebar>
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <span className="text-xl">LHC-PM</span>
        </Link>
      </div>
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-4 py-4">
          <Link
            href="/dashboard"
            className={cn(
              'flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
              pathname === '/dashboard' && 'bg-accent text-accent-foreground'
            )}
          >
            <HomeIcon className="mr-2 h-4 w-4" />
            Overview
          </Link>

          {loading ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">Loading...</div>
          ) : (
            departments.map((dept) => (
              <div key={dept.id} className="px-3 py-2">
                <Button
                  variant="ghost"
                  className="w-full justify-between"
                  onClick={() => toggleSection(dept.id)}
                >
                  <div className="flex items-center">
                    <BuildingIcon className="mr-2 h-4 w-4" />
                    {dept.name}
                  </div>
                  <ChevronDownIcon
                    className={cn(
                      'h-4 w-4 transition-transform',
                      openSections.includes(dept.id) && 'rotate-180'
                    )}
                  />
                </Button>
                {openSections.includes(dept.id) && (
                  <div className="mt-2 space-y-1 pl-4">
                    {dept.projects.map((project) => (
                      <Link
                        key={project.id}
                        href={`/dashboard/projects/${project.id}`}
                        className={cn(
                          'flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
                          pathname === `/dashboard/projects/${project.id}` && 'bg-accent text-accent-foreground'
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
                        className="w-full justify-start text-muted-foreground hover:text-foreground"
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
            <div className="px-3 py-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-muted-foreground hover:text-foreground"
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
      <div className="border-t p-4">
        <UserButton afterSignOutUrl="/sign-in" />
      </div>
    </Sidebar>
  );
} 