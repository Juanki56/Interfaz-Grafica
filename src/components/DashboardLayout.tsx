import React from 'react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardLayout({ children, className = '' }: DashboardLayoutProps) {
  return (
    <div className={`p-4 lg:p-6 xl:p-8 space-y-6 lg:space-y-8 min-h-screen bg-white ${className}`}>
      {children}
    </div>
  );
}

interface DashboardSectionProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardSection({ children, className = '' }: DashboardSectionProps) {
  return (
    <div className={`space-y-4 lg:space-y-6 ${className}`}>
      {children}
    </div>
  );
}

interface DashboardGridProps {
  children: React.ReactNode;
  columns?: number;
  className?: string;
}

export function DashboardGrid({ children, columns = 4, className = '' }: DashboardGridProps) {
  const gridCols = columns === 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' :
                   columns === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
                   columns === 2 ? 'grid-cols-1 sm:grid-cols-2' :
                   'grid-cols-1';
  
  return (
    <div className={`grid ${gridCols} gap-4 lg:gap-6 ${className}`}>
      {children}
    </div>
  );
}