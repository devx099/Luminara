
import React from 'react';
import type { ToastState } from '../types';

interface ToastProps {
  toast: ToastState | null;
}

const Toast: React.FC<ToastProps> = ({ toast }) => {
  if (!toast) return null;

  const bg = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
  }[toast.type] || 'bg-gray-800';

  return (
    <div className={`fixed bottom-6 right-6 ${bg} text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-4 z-50 animate-fade-in-up`}>
      <span>{toast.message}</span>
      {toast.undoAction && (
        <button
          onClick={() => {
            toast.undoAction?.();
          }}
          className="px-3 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded font-semibold text-sm"
        >
          Undo
        </button>
      )}
    </div>
  );
};

export default Toast;
