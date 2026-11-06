import { useEffect } from 'react';
import Icon from './Icon.jsx';

export default function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 animate-fadeIn bg-navy-950/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative max-h-[92vh] w-full max-w-lg animate-pop overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">{title}</h2>
          <button className="grid h-8 w-8 place-items-center rounded-full text-slate-500 hover:bg-slate-100" onClick={onClose} aria-label="Close"><Icon name="close" className="h-4 w-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}