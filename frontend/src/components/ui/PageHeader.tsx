import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  category?: string;
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  icon?: LucideIcon;
  badge?: React.ReactNode;
  children?: React.ReactNode; // Right-hand actions
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  category,
  title,
  subtitle,
  icon: Icon,
  badge,
  children,
}) => {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-800/80 pb-5 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          {category && (
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400">
              {category}
            </span>
          )}
          {category && badge && <span className="text-slate-600">/</span>}
          {badge}
        </div>
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-800/80 text-cyan-400 border border-slate-700/60">
              <Icon className="h-4 w-4" />
            </div>
          )}
          <h1 className="text-lg font-bold tracking-tight text-white sm:text-xl lg:text-2xl">
            {title}
          </h1>
        </div>
        {subtitle && (
          <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {children && (
        <div className="flex shrink-0 flex-wrap items-center gap-2.5 self-start md:self-auto">
          {children}
        </div>
      )}
    </div>
  );
};
