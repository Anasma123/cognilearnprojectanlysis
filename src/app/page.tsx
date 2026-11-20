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
    <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="font-semibold tracking-wide">Starting Cognilearn System...</span>
      </div>
    </div>
  );
}
