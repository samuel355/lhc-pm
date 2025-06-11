"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface SidebarContextType {
  isMobileOpen: boolean;
  setIsMobileOpen: (isOpen: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) { // md breakpoint for Tailwind CSS
        setIsMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <SidebarContext.Provider value={{ isMobileOpen, setIsMobileOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
} 