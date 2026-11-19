import React from 'react';
import { UserRole } from '@/lib/types';

export function RoleBadge({ role }: { role: UserRole }) {
  const styles: Record<UserRole, string> = {
    admin: 'bg-navy-900 text-white border-navy-800',
    mentor: 'bg-blue-700 text-white border-blue-600',
    student: 'bg-emerald-700 text-white border-emerald-600'
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider ${styles[role] || 'bg-slate-700 text-white'}`}>
      {role}
    </span>
  );
}
