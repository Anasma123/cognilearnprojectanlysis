'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    try {
      const auth = typeof window !== 'undefined' ? localStorage.getItem('cognilearn_auth') : null;
      if (auth === 'admin' || auth === 'staff') {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    } catch {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white text-xs gap-4">
      <img
        src="/logo.jpeg"
        alt="Cognilearn Logo"
        className="w-14 h-14 rounded-2xl bg-white p-1 object-contain shadow-lg"
      />
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="font-semibold tracking-wide text-slate-300">Starting Cognilearn System...</span>
      </div>
    </div>
  );
}
