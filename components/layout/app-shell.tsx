"use client";

import { ReactNode } from 'react';
import { DataProvider } from '@/lib/data-context';
import { SidebarNav } from './sidebar-nav';
import { Topbar } from './topbar';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <DataProvider>
      <div className="flex min-h-screen bg-background text-foreground">
        <SidebarNav />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <main className="flex-1 p-4 lg:p-8">{children}</main>
        </div>
      </div>
    </DataProvider>
  );
}
