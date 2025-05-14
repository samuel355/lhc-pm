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
  UsersIcon,
  ListTodoIcon,
  FolderKanbanIcon,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useUser } from '@clerk/nextjs';
import { DepartmentForm } from '@/components/departments/department-form';

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

  const fetchDepartments = async () => {
    const supabase = createClient();
    const { data: depts, error: deptError } = await supabase
      .from('departments')
      .select('*');

    if (deptError) {
      console.error('Error fetching departments:', deptError);
      return;
    }

    // Get all projects for each department
    const deptsWithProjects = await Promise.all(
      depts.map(async (dept) => {
        const { data: deptProjects } = await supabase
          .from('projects')
          .select('*')
          .eq('department_id', dept.id);

        return { 
          ...dept, 
          projects: deptProjects?.map(p => ({
            id: p.id,
            name: p.name,
            department_id: dept.id
          })) || [] 
        };
      })
    );

    setDepartments(deptsWithProjects);
    setLoading(false);
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const toggleSection = (id: string) => {
    setOpenSections((prev) =>
      prev.includes(id)
        ? prev.filter((t) => t !== id)
        : [...prev, id]
    );
  };

  const isSysAdmin = user?.publicMetadata?.role === 'sysadmin';
  const isAdmin = user?.publicMetadata?.role === 'admin' || isSysAdmin;
  const isDepartmentHead = user?.publicMetadata?.role === 'department_head';

  return (
    <Sidebar className="border-r border-neutral-200/10 dark:border-neutral-800/10 shadow-sm font-outfit min-w-[250px]">
      <div className="flex h-14 items-center border-b border-neutral-200/10 dark:border-neutral-800/10 px-4 shadow-sm">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <span className="text-xl">LHC-PM</span>
        </Link>
      </div>
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-4 py-4">
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start"
              asChild
            >
              <Link href="/dashboard">
                <HomeIcon className="mr-2 h-4 w-4" />
                Home
              </Link>
            </Button>
          </div>

          {isSysAdmin && (
            <div className="space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start"
                asChild
              >
                <Link href="/dashboard/users">
                  <UsersIcon className="mr-2 h-4 w-4" />
                  Users
                </Link>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                asChild
              >
                <Link href="/dashboard/all-projects">
                  <FolderKanbanIcon className="mr-2 h-4 w-4" />
                  All Projects
                </Link>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                asChild
              >
                <Link href="/dashboard/all-tasks">
                  <ListTodoIcon className="mr-2 h-4 w-4" />
                  All Tasks
                </Link>
              </Button>
            </div>
          )}

          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-sm font-semibold tracking-tight text-muted-foreground">
              Departments
            </h2>
            {loading ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">Loading...</div>
            ) : (
              departments.map((dept) => (
                <div key={dept.id} className="px-2 py-1">
                  <div className="flex items-center">
                    <Button
                      variant="ghost"
                      className="flex-1 justify-between hover:bg-accent/50 transition-colors text-left"
                      onClick={() => toggleSection(dept.id)}
                    >
                      <div className="flex items-center min-w-0">
                        <BuildingIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                        <Link
                          href={`/dashboard/departments/${dept.id}`}
                          className="hover:underline truncate"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {dept.name}
                        </Link>
                      </div>
                      <ChevronDownIcon
                        className={cn(
                          'h-4 w-4 transition-transform flex-shrink-0',
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
                          <BriefcaseIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{project.name}</span>
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
          </div>

          {isAdmin && (
            <div className="px-2 py-1">
              <DepartmentForm onSuccess={fetchDepartments} />
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="border-t border-neutral-200/10 dark:border-neutral-800/10 p-4 shadow-sm">
        <UserButton afterSignOutUrl="/sign-in" />
      </div>
    </Sidebar>
  );
} 