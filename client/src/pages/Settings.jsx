import { useEffect, useState } from 'react';
import api, { errorMessage } from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function Settings() {
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user?.role === 'admin';
  const [form, setForm] = useState({ GPAY: '', CASH: '', allowNegative: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/settings').then((r) => setForm({ GPAY: String(r.data.settings.openingBalances.GPAY), CASH: String(r.data.settings.openingBalances.CASH), allowNegative: r.data.settings.allowNegative }))
      .catch((e) => toast.error(errorMessage(e)));
  }, [toast]);

  const save = async (e) => {
    e.preventDefault();
    const g = Number(form.GPAY), c = Number(form.CASH);
    if (!(g >= 0) || !(c >= 0) || form.GPAY === '' || form.CASH === '') return toast.error('Enter opening balances of zero or more');
    setSaving(true);
    try {
      await api.put('/settings', { openingBalances: { GPAY: g, CASH: c }, allowNegative: form.allowNegative });
      toast.success('Settings saved. All balances were recalculated');
    } catch (err) { toast.error(errorMessage(err)); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Settings</h1>
        <p className="text-sm text-slate-500">{isAdmin ? 'Only the administrator can change these.' : 'Only the administrator can change these settings.'}</p>
      </div>
      <form onSubmit={save} className="card space-y-5">
        <div>
          <h2 className="font-bold">Opening balances</h2>
          <p className="mb-3 text-sm text-slate-500">The money you already had in GPay and in the cash drawer before the first transaction entered here.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="og">GPay opening balance (₹)</label>
              <input id="og" type="number" min="0" step="0.01" className="input" disabled={!isAdmin} value={form.GPAY} onChange={(e) => setForm({ ...form, GPAY: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="oc">Cash opening balance (₹)</label>
              <input id="oc" type="number" min="0" step="0.01" className="input" disabled={!isAdmin} value={form.CASH} onChange={(e) => setForm({ ...form, CASH: e.target.value })} />
            </div>
          </div>
        </div>
        <label className="flex items-start gap-3">
          <input type="checkbox" className="mt-1 h-4 w-4" disabled={!isAdmin} checked={form.allowNegative} onChange={(e) => setForm({ ...form, allowNegative: e.target.checked })} />
          <span>
            <span className="block font-semibold">Allow negative balances</span>
            <span className="text-sm text-slate-500">When off, an expense larger than the available GPay or Cash balance is blocked with a warning.</span>
          </span>
        </label>
        {isAdmin && <button className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save settings'}</button>}
      </form>
    </div>
  );
}
