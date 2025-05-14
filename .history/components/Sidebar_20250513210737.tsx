// components/Sidebar.tsx
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
    <aside className="w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border p-4">
      <div className="text-lg font-bold mb-6">LHC-PM</div>
      <nav className="space-y-2">
        {navItems.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`block px-3 py-2 rounded-md ${
              pathname.startsWith(href)
                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
