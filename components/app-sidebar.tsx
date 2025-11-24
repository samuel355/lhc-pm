'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sidebar } from '@/components/ui/sidebar';
import {
  HomeIcon,
  BuildingIcon,
  UsersIcon,
  ListTodoIcon,
  FolderKanbanIcon,
  Building2Icon,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useUser } from '@clerk/nextjs';
import { DepartmentForm } from '@/components/departments/department-form';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

const DynamicUserButton = dynamic(
  () => import('@clerk/nextjs').then((mod) => mod.UserButton),
  { ssr: false }
);

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
  const { user } = useUser();
  const pathname = usePathname();
  const [departments, setDepartments] = useState<Department[]>([]);
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

  const isSysAdmin = user?.publicMetadata?.role === 'sysadmin';
  const isAdmin = user?.publicMetadata?.role === 'admin' || isSysAdmin;

  return (
    <Sidebar className="border-r border-border/50 shadow-xl font-outfit w-[340px] glass-card">
      <div className="flex h-16 items-center border-b border-border/50 px-6 shadow-sm">
        <Link href="/dashboard" className="flex items-center gap-3 font-semibold group py-2">
          <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
            <span className="text-lg font-bold text-primary">LHC</span>
          </div>
          <div>
            <span className="text-lg font-bold">Project Manager</span>
          </div>
        </Link>
      </div>
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-6 py-6">
          <div className="space-y-2">
            <Button
              variant="ghost"
              className={`w-full justify-start h-12 transition-all duration-300 group ${
                pathname === '/dashboard' 
                  ? 'bg-primary/10 text-primary' 
                  : 'hover:bg-primary/10 hover:text-primary'
              }`}
              asChild
            >
              <Link href="/dashboard" className="flex items-center gap-3">
                <div className={`p-2 rounded-lg transition-colors duration-300 ${
                  pathname === '/dashboard' 
                    ? 'bg-primary/15' 
                    : 'bg-primary/5 group-hover:bg-primary/15'
                }`}>
                  <HomeIcon className="h-4 w-4" />
                </div>
                <span className="font-medium">Dashboard</span>
              </Link>
            </Button>
          </div>

          {isSysAdmin && (
            <div className="space-y-2">
              <div className="px-3 py-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Administration
                </h3>
              </div>
              <Button
                variant="ghost"
                className={`w-full justify-start h-10 transition-all duration-300 group ${
                  pathname === '/dashboard/departments' 
                    ? 'bg-chart-2/10 text-chart-2' 
                    : 'hover:bg-chart-2/10 hover:text-chart-2'
                }`}
                asChild
              >
                <Link href="/dashboard/departments" className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg transition-colors duration-300 ${
                    pathname === '/dashboard/departments' 
                      ? 'bg-chart-2/15' 
                      : 'bg-chart-2/5 group-hover:bg-chart-2/15'
                  }`}>
                    <Building2Icon className="h-4 w-4" />
                  </div>
                  <span className="font-medium">All Departments</span>
                </Link>
              </Button>
              <Button
                variant="ghost"
                className={`w-full justify-start h-12 transition-all duration-300 group ${
                  pathname === '/dashboard/projects' 
                    ? 'bg-chart-3/10 text-chart-3' 
                    : 'hover:bg-chart-3/10 hover:text-chart-3'
                }`}
                asChild
              >
                <Link href="/dashboard/projects" className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg transition-colors duration-300 ${
                    pathname === '/dashboard/projects' 
                      ? 'bg-chart-3/15' 
                      : 'bg-chart-3/5 group-hover:bg-chart-3/15'
                  }`}>
                    <FolderKanbanIcon className="h-4 w-4" />
                  </div>
                  <span className="font-medium">All Projects</span>
                </Link>
              </Button>
              <Button
                variant="ghost"
                className={`w-full justify-start h-12 transition-all duration-300 group ${
                  pathname === '/dashboard/tasks' 
                    ? 'bg-chart-4/10 text-chart-4' 
                    : 'hover:bg-chart-4/10 hover:text-chart-4'
                }`}
                asChild
              >
                <Link href="/dashboard/tasks" className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg transition-colors duration-300 ${
                    pathname === '/dashboard/tasks' 
                      ? 'bg-chart-4/15' 
                      : 'bg-chart-4/5 group-hover:bg-chart-4/15'
                  }`}>
                    <ListTodoIcon className="h-4 w-4" />
                  </div>
                  <span className="font-medium">All Tasks</span>
                </Link>
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <div className="px-3 py-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                LHC Departments
              </h3>
            </div>
            {loading ? (
              <div className="px-6 py-3 text-sm text-muted-foreground animate-pulse">
                Loading departments...
              </div>
            ) : (
              departments.map((dept) => {
                const isActive = pathname === `/dashboard/department/${dept.id}`;
                return (
                  <div key={dept.id} className="px-2">
                    <Button
                      variant="ghost"
                      className={`w-full justify-start h-10 transition-all duration-300 group ${
                        isActive 
                          ? 'bg-accent/50 text-accent-foreground' 
                          : 'hover:bg-accent/50 hover:text-accent-foreground'
                      }`}
                      asChild
                    >
                      <Link href={`/dashboard/department/${dept.id}`} className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg transition-colors duration-300 ${
                          isActive 
                            ? 'bg-accent/15' 
                            : 'bg-accent/5 group-hover:bg-accent/15'
                        }`}>
                          <BuildingIcon className="h-4 w-4" />
                        </div>
                        <span className="font-medium">{dept.name}</span>
                      </Link>
                    </Button>
                  </div>
                );
              })
            )}
          </div>

          {isAdmin && (
            <div className="space-y-2">
              <div className="px-3 py-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Management
                </h3>
              </div>
              <div className="px-2">
                <DepartmentForm onSuccess={fetchDepartments} />
              </div>
              <Button
                variant="ghost"
                className={`w-full justify-start h-12 transition-all duration-300 group ${
                  pathname === '/dashboard/users' 
                    ? 'bg-chart-5/10 text-chart-5' 
                    : 'hover:bg-chart-5/10 hover:text-chart-5'
                }`}
                asChild
              >
                <Link href="/dashboard/users" className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg transition-colors duration-300 ${
                    pathname === '/dashboard/users' 
                      ? 'bg-chart-5/15' 
                      : 'bg-chart-5/5 group-hover:bg-chart-5/15'
                  }`}>
                    <UsersIcon className="h-4 w-4" />
                  </div>
                  <span className="font-medium">Users</span>
                </Link>
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="border-t border-border/50 p-6 glass">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-muted-foreground">{user?.emailAddresses?.[0]?.emailAddress}</p>
          </div>
          <div className="flex items-center gap-2">
            <DynamicUserButton 
              afterSignOutUrl="/sign-in"
              appearance={{
                elements: {
                  userButtonAvatarBox: "w-8 h-8",
                  userButtonPopoverCard: "glass-card",
                  userButtonPopoverActionButton: "hover:bg-accent/50",
                  userButtonPopoverActionButtonText: "text-sm",
                  userButtonPopoverFooter: "hidden"
                }
              }}
            />
          </div>
        </div>
      </div>
    </Sidebar>
  );
} 