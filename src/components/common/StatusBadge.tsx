import React from 'react';
import { getStatusBadgeClass, humanizeStatus } from '@/lib/utils/formatters';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const badgeClass = getStatusBadgeClass(status);
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeClass} ${className}`}
    >
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-75" />
      {humanizeStatus(status)}
    </span>
  );
}
