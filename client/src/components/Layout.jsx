import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useData } from '../context/DataContext.jsx';
import Icon from './Icon.jsx';
import Brand from './Brand.jsx';
import QuickAdd from './QuickAdd.jsx';

const NAV = [
  { to: '/', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/gpay', label: 'GPay Management', icon: 'gpay' },
  { to: '/cash', label: 'Cash Management', icon: 'cash' },
  { to: '/transactions', label: 'Transactions', icon: 'list' },
  { to: '/reports', label: 'Monthly Reports', icon: 'chart' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
];

function SidebarBody({ onNavigate }) {
  const { user, logout } = useAuth();
  return (
    <div className="flex h-full flex-col bg-navy-900 text-slate-300">
      <div className="px-5 py-6"><Brand /></div>
      <nav className="flex flex-1 flex-col gap-1 px-3">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} onClick={onNavigate}
            className={({ isActive }) => `relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${isActive ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white'}`}>
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute -left-3 top-2 h-6 w-1 rounded-r-full bg-cash" />}
                <Icon name={n.icon} className="h-5 w-5" />
                {n.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="m-3 flex items-center gap-3 rounded-2xl bg-white/5 p-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gpay font-bold text-white">{user?.name?.[0]?.toUpperCase()}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
          <p className="text-xs capitalize text-slate-400">{user?.role}</p>
        </div>
        <button onClick={logout} className="grid h-9 w-9 place-items-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white" aria-label="Sign out"><Icon name="logout" className="h-5 w-5" /></button>
      </div>
    </div>
  );
}

export default function Layout() {
  const [open, setOpen] = useState(false);
  const { openQuick } = useData();

  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden w-72 shrink-0 lg:sticky lg:top-0 lg:block lg:h-screen"><SidebarBody /></aside>

      <header className="sticky top-0 z-30 flex items-center justify-between bg-navy-900 px-4 py-3 text-white lg:hidden">
        <Brand size="sm" />
        <button className="grid h-10 w-10 place-items-center rounded-xl bg-white/10" onClick={() => setOpen(true)} aria-label="Open menu"><Icon name="menu" /></button>
      </header>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 animate-fadeIn bg-navy-950/60" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 animate-slideInLeft shadow-2xl"><SidebarBody onNavigate={() => setOpen(false)} /></div>
        </div>
      )}

      <main className="min-w-0 flex-1 p-4 pb-28 sm:p-6 lg:p-10 lg:pb-28">
        <div className="mx-auto max-w-6xl"><Outlet /></div>
      </main>

      <button onClick={() => openQuick()} aria-label="Add entry"
        className="fixed bottom-5 right-5 z-30 flex items-center gap-2 rounded-full bg-gradient-to-br from-gpay to-gpay-dark px-5 py-4 font-semibold text-white shadow-xl shadow-gpay/30 transition hover:scale-105 active:scale-95 sm:bottom-8 sm:right-8">
        <Icon name="plus" className="h-5 w-5" /><span className="hidden sm:inline">Add entry</span>
      </button>
      <QuickAdd />
    </div>
  );
}