import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import api, { errorMessage, fieldErrors } from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Brand from '../components/Brand.jsx';

export default function Login() {
  const { user, authenticate } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/auth/status').then((r) => { setRegistrationOpen(r.data.registrationOpen); if (r.data.registrationOpen) setMode('register'); }).catch(() => {});
  }, []);
  if (user) return <Navigate to="/" replace />;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErrors({});
    try {
      const { data } = await api.post(mode === 'login' ? '/auth/login' : '/auth/register', form);
      authenticate(data);
      navigate('/');
    } catch (err) {
      setErrors(fieldErrors(err));
      toast.error(errorMessage(err));
    } finally { setBusy(false); }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-navy-900 p-12 text-white lg:flex">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="pointer-events-none absolute -right-20 top-1/2 h-[30rem] w-[30rem] -translate-y-1/2 text-white/[0.04]">
          <path d="M13.5 2L4 13.5h6.5L9.5 22 20 9.5h-6.8z" />
        </svg>
        <span className="relative w-fit rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-sky-200">Showroom expense tracker</span>

        <div className="relative">
          <span className="mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-gpay to-cash shadow-xl shadow-gpay/30">
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="white" aria-hidden="true"><path d="M13.5 2L4 13.5h6.5L9.5 22 20 9.5h-6.8z" /></svg>
          </span>
          <h2 className="font-brand text-5xl font-extrabold leading-[1.05] xl:text-6xl">Palani<br />Andavar</h2>
          <p className="mt-3 bg-gradient-to-r from-sky-300 via-sky-400 to-amber-300 bg-clip-text font-brand text-3xl font-extrabold text-transparent xl:text-4xl">E Motors</p>
        </div>

        <div className="relative">
          <p className="max-w-sm text-lg font-semibold">Every rupee, in GPay and in cash, accounted for.</p>
          <p className="mt-1 text-sm text-slate-400">Balances carry forward from month to month.</p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm space-y-5" noValidate>
          <div className="lg:hidden"><Brand tone="dark" /></div>
          <div>
            <h1 className="font-display text-3xl font-extrabold">{mode === 'register' ? 'Set up your account' : 'Welcome back'}</h1>
            <p className="mt-1 text-sm text-slate-500">{mode === 'register' ? 'Create the administrator account to get started.' : 'Sign in to manage GPay and cash.'}</p>
          </div>
          {mode === 'register' && (
            <div>
              <label className="label" htmlFor="name">Your name</label>
              <input id="name" className={`input ${errors.name ? 'input-error' : ''}`} value={form.name} onChange={set('name')} autoComplete="name" />
              {errors.name && <p className="field-error">{errors.name}</p>}
            </div>
          )}
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" className={`input ${errors.email ? 'input-error' : ''}`} value={form.email} onChange={set('email')} autoComplete="email" />
            {errors.email && <p className="field-error">{errors.email}</p>}
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" type="password" className={`input ${errors.password ? 'input-error' : ''}`} value={form.password} onChange={set('password')} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
            {errors.password && <p className="field-error">{errors.password}</p>}
          </div>
          <button className="btn-primary w-full py-3" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
          {registrationOpen && (
            <button type="button" className="w-full text-sm text-slate-500 underline" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
              {mode === 'login' ? 'Create the administrator account' : 'I already have an account'}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}