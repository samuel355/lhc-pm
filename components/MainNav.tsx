'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { UsersIcon, BriefcaseIcon, ClipboardListIcon, HomeIcon } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: HomeIcon },
  { href: '/dashboard/departments', label: 'Departments', icon: UsersIcon },
  { href: '/dashboard/projects', label: 'Projects', icon: BriefcaseIcon },
  { href: '/dashboard/tasks', label: 'Tasks', icon: ClipboardListIcon },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <div className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/40">
      <div className="container mx-auto px-4">
        <NavigationMenu className="h-16">
          <NavigationMenuList className="gap-6">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <NavigationMenuItem key={item.href}>
                  <Link href={item.href} legacyBehavior passHref>
                    <NavigationMenuLink
                      className={cn(
                        navigationMenuTriggerStyle(),
                        'bg-transparent hover:bg-accent/50',
                        isActive && 'bg-accent/80 text-accent-foreground'
                      )}
                    >
                      <item.icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              );
            })}
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </div>
  );
} 