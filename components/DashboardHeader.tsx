'use client';
import ThemeToggle from './ThemeToggle';
import { Button } from '@/components/ui/button';
import { LogOutIcon } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';

export default function DashboardHeader() {
  const { signOut } = useAuth();
  return (
    <header className="flex items-center justify-between bg-card px-6 py-4 border-b border-border">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="flex items-center space-x-4">
        <ThemeToggle />
        <Button variant="ghost" onClick={() => signOut()}>
          <LogOutIcon className="w-5 h-5" />
          <span className="sr-only">Sign out</span>
        </Button>
      </div>
    </header>
  )
}