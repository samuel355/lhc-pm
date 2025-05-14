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
  UsersIcon,
  BriefcaseIcon,
  ClipboardListIcon,
  SettingsIcon,
  ChevronDownIcon,
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  items?: NavItem[];
}

const navItems: NavItem[] = [
  {
    title: 'Overview',
    href: '/dashboard',
    icon: HomeIcon,
  },
  {
    title: 'Management',
    href: '/dashboard/management',
    icon: SettingsIcon,
    items: [
      {
        title: 'Departments',
        href: '/dashboard/departments',
        icon: UsersIcon,
      },
      {
        title: 'Projects',
        href: '/dashboard/projects',
        icon: BriefcaseIcon,
      },
      {
        title: 'Tasks',
        href: '/dashboard/tasks',
        icon: ClipboardListIcon,
      },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<string[]>(['Management']);

  const toggleSection = (title: string) => {
    setOpenSections((prev) =>
      prev.includes(title)
        ? prev.filter((t) => t !== title)
        : [...prev, title]
    );
  };

  return (
    <Sidebar>
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <span className="text-xl">LHC-PM</span>
        </Link>
      </div>
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-4 py-4">
          {navItems.map((item) => (
            <div key={item.href} className="px-3 py-2">
              {item.items ? (
                <>
                  <Button
                    variant="ghost"
                    className="w-full justify-between"
                    onClick={() => toggleSection(item.title)}
                  >
                    <div className="flex items-center">
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.title}
                    </div>
                    <ChevronDownIcon
                      className={cn(
                        'h-4 w-4 transition-transform',
                        openSections.includes(item.title) && 'rotate-180'
                      )}
                    />
                  </Button>
                  {openSections.includes(item.title) && (
                    <div className="mt-2 space-y-1 pl-4">
                      {item.items.map((subItem) => (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={cn(
                            'flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
                            pathname === subItem.href && 'bg-accent text-accent-foreground'
                          )}
                        >
                          <subItem.icon className="mr-2 h-4 w-4" />
                          {subItem.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
                    pathname === item.href && 'bg-accent text-accent-foreground'
                  )}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.title}
                </Link>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="border-t p-4">
        <UserButton afterSignOutUrl="/sign-in" />
      </div>
    </Sidebar>
  );
} 