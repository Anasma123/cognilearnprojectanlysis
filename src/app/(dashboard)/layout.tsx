'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopNav } from '@/components/layout/TopNav';
import { useApp } from '@/lib/context/AppContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    try {
      const storedAuth = typeof window !== 'undefined' ? localStorage.getItem('cognilearn_auth') : null;
      if (!isAuthenticated && !storedAuth) {
        router.replace('/login');
      } else {
        setChecking(false);
      }
    } catch {
      setChecking(false);
    }
  }, [isAuthenticated, router]);

  if (checking && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Verifying Cognilearn session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Slide-out Sidebar Drawer (opens when hamburger is clicked) */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Full-Width Application Container (No permanent fixed sidebar) */}
      <div className="flex-1 flex flex-col min-h-screen w-full">
        <TopNav onToggleSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
