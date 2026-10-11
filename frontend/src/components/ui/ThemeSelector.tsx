import React from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import type { ThemeMode } from '../../hooks/useTheme';

interface ThemeSelectorProps {
  variant?: 'compact' | 'segmented' | 'cards';
  className?: string;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { theme, setTheme } = useTheme();

  const options: Array<{ mode: ThemeMode; label: string; icon: React.ComponentType<{ className?: string }>; description: string }> = [
    {
      mode: 'dark',
      label: 'Dark',
      icon: Moon,
      description: 'High-density dark SOC palette optimized for low-glare operations',
    },
    {
      mode: 'light',
      label: 'Light',
      icon: Sun,
      description: 'Clean, high-contrast enterprise light theme with crisp typography',
    },
    {
      mode: 'system',
      label: 'System',
      icon: Laptop,
      description: 'Automatically synchronizes with your operating system appearance',
    },
  ];

  if (variant === 'cards') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 ${className}`}>
        {options.map((opt) => {
          const Icon = opt.icon;
          const isSelected = theme === opt.mode;
          return (
            <button
              key={opt.mode}
              type="button"
              onClick={() => setTheme(opt.mode)}
              className={`p-4 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between space-y-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500/50 ${
                isSelected
                  ? 'border-sky-500 bg-sky-500/10 shadow-sm'
                  : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900'
              }`}
              aria-pressed={isSelected}
              title={`Switch to ${opt.label} mode`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-lg border ${
                    isSelected
                      ? 'border-sky-500/50 bg-sky-500/20 text-sky-400'
                      : 'border-slate-800 bg-slate-900 text-slate-400'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                {isSelected && (
                  <span className="flex h-2 w-2 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
                )}
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
                  {opt.label} Mode
                  {isSelected && (
                    <span className="text-[10px] font-mono text-sky-400 font-normal">
                      (Active)
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  {opt.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  // Compact variant for Header / Top Nav
  return (
    <div
      role="radiogroup"
      aria-label="Theme mode selector"
      className={`inline-flex items-center rounded-lg border border-slate-800/80 bg-slate-900/70 p-0.5 backdrop-blur-sm ${className}`}
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const isSelected = theme === opt.mode;
        return (
          <button
            key={opt.mode}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => setTheme(opt.mode)}
            title={`${opt.label} Mode (${opt.mode === theme ? 'Active' : 'Click to select'})`}
            className={`relative flex h-7 w-7 items-center justify-center rounded-md text-xs transition-all duration-150 cursor-pointer focus:outline-none focus:ring-1 focus:ring-sky-500 ${
              isSelected
                ? 'bg-slate-800 text-sky-400 font-semibold shadow-sm border border-slate-700/80'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="sr-only">{opt.label} Mode</span>
          </button>
        );
      })}
    </div>
  );
};
