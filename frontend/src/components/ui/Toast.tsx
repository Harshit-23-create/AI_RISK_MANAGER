import React, { useEffect } from 'react';
import { ShieldAlert, CheckCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed inset-x-3 bottom-3 z-[90] flex max-w-sm flex-col gap-2 pointer-events-none sm:left-auto sm:right-5 sm:bottom-5 sm:w-full">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  let icon = <Info className="w-5 h-5 text-cyan-400" />;
  let border = 'border-cyan-500/30';

  if (toast.type === 'error' || toast.type === 'warning') {
    icon = <ShieldAlert className="w-5 h-5 text-rose-400" />;
    border = 'border-rose-500/40 bg-rose-950/20';
  } else if (toast.type === 'success') {
    icon = <CheckCircle className="w-5 h-5 text-emerald-400" />;
    border = 'border-emerald-500/30';
  }

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 rounded-xl border ${border} bg-slate-900/95 p-4 shadow-xl backdrop-blur-md transition-all duration-300 animate-slide-up`}
    >
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <h4 className="break-words text-xs font-bold text-white">{toast.title}</h4>
        <p className="break-words text-[11px] text-slate-300 mt-0.5 leading-snug">{toast.message}</p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-slate-400 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
