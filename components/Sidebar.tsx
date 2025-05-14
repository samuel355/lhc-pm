'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UsersIcon, BriefcaseIcon, ClipboardListIcon } from 'lucide-react';

const navItems = [
  { href: '/dashboard/departments', label: 'Departments', icon: UsersIcon },
  { href: '/dashboard/projects', label: 'Projects', icon: BriefcaseIcon },
  { href: '/dashboard/tasks', label: 'Tasks', icon: ClipboardListIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 bg-sidebar p-4 border-r border-sidebar-border flex flex-col">
      <div className="text-xl font-bold mb-8 text-primary-foreground">LHC-PM</div>
      <nav className="flex-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center px-4 py-2 mb-2 rounded-lg transition ${
                active
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
            >
              <Icon className="w-5 h-5 mr-3" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto p-4">
        {/* optional user avatar or additional actions */}
      </div>
    </aside>
  )
}