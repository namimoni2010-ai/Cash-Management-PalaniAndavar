import { createContext, useCallback, useContext, useState } from 'react';
import Icon from '../components/Icon.jsx';

const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

const styles = {
  success: { box: 'bg-white ring-gain/30', dot: 'bg-gain-soft text-gain', icon: 'check' },
  error: { box: 'bg-white ring-loss/30', dot: 'bg-loss-soft text-loss', icon: 'close' },
  warning: { box: 'bg-white ring-cash/40', dot: 'bg-cash-soft text-cash-dark', icon: 'alert' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((type, message) => {
    const id = Math.random();
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), type === 'success' ? 3500 : 7000);
  }, []);
  const api = { success: (m) => push('success', m), error: (m) => push('error', m), warning: (m) => push('warning', m) };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed right-4 top-4 z-[70] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2" role="status" aria-live="polite">
        {toasts.map((t) => {
          const s = styles[t.type];
          return (
            <div key={t.id} className={`flex animate-toastIn items-start gap-3 rounded-2xl p-3.5 text-sm font-medium shadow-xl ring-1 ${s.box}`}>
              <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${s.dot}`}><Icon name={s.icon} className="h-4 w-4" /></span>
              <p className="pt-0.5">{t.message}</p>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}