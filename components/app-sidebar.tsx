'use client';

import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sidebar } from '@/components/ui/sidebar';
import {
  HomeIcon,
  BuildingIcon,
  UsersIcon,
  ListTodoIcon,
  FolderKanbanIcon,
  Building2Icon,
  type LucideIcon,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useUser } from '@clerk/nextjs';
import { DepartmentForm } from '@/components/departments/department-form';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

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

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const PRIMARY_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: HomeIcon },
];

const ADMIN_ITEMS: NavItem[] = [
  { href: '/dashboard/departments', label: 'All Departments', icon: Building2Icon },
  { href: '/dashboard/projects', label: 'All Projects', icon: FolderKanbanIcon },
  { href: '/dashboard/tasks', label: 'All Tasks', icon: ListTodoIcon },
];

const MANAGEMENT_ITEMS: NavItem[] = [
  { href: '/dashboard/users', label: 'Users', icon: UsersIcon },
];

function NavLink({ href, label, icon: Icon, isActive }: NavItem & { isActive: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-foreground/80 hover:bg-primary/5 hover:text-primary'
      )}
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors duration-200',
          isActive ? 'bg-primary/15' : 'bg-primary/5 group-hover:bg-primary/10'
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <span className="truncate">{label}</span>
    </Link>
  );
}

function NavSection({
  title,
  items,
  pathname,
  exact = false,
}: {
  title?: string;
  items: NavItem[];
  pathname: string;
  exact?: boolean;
}) {
  return (
    <div className="space-y-1">
      {title && (
        <h3 className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
      )}
      {items.map((item) => (
        <NavLink
          key={item.href}
          {...item}
          isActive={exact ? pathname === item.href : pathname.startsWith(item.href)}
        />
      ))}
    </div>
  );
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

  const departmentItems: NavItem[] = departments.map((dept) => ({
    href: `/dashboard/department/${dept.id}`,
    label: dept.name,
    icon: BuildingIcon,
  }));

  return (
    <Sidebar className="border-r border-border/50 shadow-xl font-outfit glass-card overflow-y-auto no-scrollbar">
      <div className="flex h-16 items-center border-b border-border/50 px-6 shadow-sm">
        <Link href="/dashboard" className="group flex items-center gap-3 py-2 font-semibold">
          <div className="rounded-lg bg-primary/10 p-2 transition-colors duration-300 group-hover:bg-primary/20">
            <span className="text-lg font-bold text-primary">LHC</span>
          </div>
          <span className="text-lg font-bold">Project Manager</span>
        </Link>
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="space-y-6 py-6">
          <NavSection items={PRIMARY_ITEMS} pathname={pathname} exact />

          {isSysAdmin && (
            <NavSection title="Administration" items={ADMIN_ITEMS} pathname={pathname} exact />
          )}

          <div className="space-y-1">
            <h3 className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              LHC Departments
            </h3>
            {loading ? (
              <div className="space-y-2 px-3 py-1">
                <div className="h-9 animate-pulse rounded-lg bg-muted/50" />
                <div className="h-9 animate-pulse rounded-lg bg-muted/50" />
                <div className="h-9 animate-pulse rounded-lg bg-muted/50" />
              </div>
            ) : departmentItems.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">No departments yet</p>
            ) : (
              <NavSection items={departmentItems} pathname={pathname} exact />
            )}
          </div>

          {isAdmin && (
            <div className="space-y-2">
              <h3 className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Management
              </h3>
              <div className="px-1">
                <DepartmentForm onSuccess={fetchDepartments} />
              </div>
              <NavSection items={MANAGEMENT_ITEMS} pathname={pathname} exact />
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="glass border-t border-border/50 p-4">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user?.firstName} {user?.lastName}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.emailAddresses?.[0]?.emailAddress}</p>
          </div>
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
    </Sidebar>
  );
}
