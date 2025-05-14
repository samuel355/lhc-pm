'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/dashboard/departments', label: 'Departments' },
  { href: '/dashboard/projects', label: 'Projects' },
  { href: '/dashboard/tasks', label: 'Tasks' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-border bg-sidebar text-sidebar-foreground p-4">
      <div className="text-lg font-bold mb-6">LHC-PM</div>
      <nav className="space-y-2">
        <Link href="/dashboard" className="block p-2 hover:bg-sidebar-accent rounded-md">
          Dashboard
        </Link>
        <Link href="/dashboard/projects" className="block p-2 hover:bg-sidebar-accent rounded-md">
          Projects
        </Link>
        <Link href="/dashboard/tasks" className="block p-2 hover:bg-sidebar-accent rounded-md">
          Tasks
        </Link>
      </nav>
    </aside>
  );
}
