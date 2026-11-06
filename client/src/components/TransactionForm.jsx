import { useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import api, { errorMessage, fieldErrors } from '../utils/api.js';
import { inr, modeLabel, newRequestId, today } from '../utils/format.js';
import { useToast } from '../context/ToastContext.jsx';
import { useData } from '../context/DataContext.jsx';

const QUICK = [100, 500, 1000, 5000];
const blank = (type, mode) => ({ transactionDate: today(), type, paymentMode: mode, amount: '', description: '', receivedFrom: '', paidTo: '', notes: '' });

/**
 * Entry form for received amounts and expenses.
 * Props: type, mode, balance (live overspend warning), editing, onSaved(), lockMode
 */
export default function TransactionForm({ type, mode, balance, editing = null, onSaved, lockMode = true }) {
  const toast = useToast();
  const { bump } = useData();
  const [form, setForm] = useState(blank(type, mode));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const requestId = useRef(newRequestId());
  const submitting = useRef(false);

  useEffect(() => {
    if (editing) {
      setForm({
        transactionDate: editing.transactionDate, type: editing.type, paymentMode: editing.paymentMode, amount: String(editing.amount),
        description: editing.description, receivedFrom: editing.receivedFrom || '', paidTo: editing.paidTo || '', notes: editing.notes || '',
      });
    } else setForm(blank(type, mode));
    setErrors({});
  }, [editing, type, mode]);

  const patch = (k, v) => { setForm((f) => ({ ...f, [k]: v })); if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined })); };
  const set = (k) => (e) => patch(k, e.target.value);
  const addAmount = (n) => patch('amount', String(Math.round(((Number(form.amount) || 0) + n) * 100) / 100));

  const isExpense = form.type === 'EXPENSE';
  const amountNum = Number(form.amount);
  const overspend = isExpense && balance != null && !editing && amountNum > balance && form.paymentMode === mode;

  const validate = () => {
    const e = {};
    if (!form.transactionDate) e.transactionDate = 'Choose a date';
    else if (form.transactionDate > today()) e.transactionDate = 'Date cannot be in the future';
    if (!form.amount || !(amountNum > 0)) e.amount = 'Enter an amount greater than zero';
    else if (Math.round(amountNum * 100) / 100 !== amountNum) e.amount = 'Use at most 2 decimal places';
    if (form.description.trim().length < 2) e.description = isExpense ? 'Describe the expense' : 'Describe the purpose';
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (submitting.current) return; // blocks double clicks / double Enter
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length) return;
    submitting.current = true;
    setSaving(true);
    try {
      const payload = { ...form, amount: amountNum };
      if (editing) await api.put(`/transactions/${editing._id}`, payload);
      else await api.post('/transactions', { ...payload, clientRequestId: requestId.current });
      toast.success(editing ? 'Transaction updated' : isExpense ? 'Expense saved' : 'Amount received saved');
      requestId.current = newRequestId();
      if (!editing) setForm(blank(type, mode));
      bump();
      onSaved?.();
    } catch (err) {
      setErrors(fieldErrors(err));
      (err.response?.data?.code === 'INSUFFICIENT_BALANCE' ? toast.warning : toast.error)(errorMessage(err));
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  };

  const Err = ({ k }) => (errors[k] ? <p className="field-error">{errors[k]}</p> : null);
  const cls = (k) => `input ${errors[k] ? 'input-error' : ''}`;

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      {!lockMode && (
        <div>
          <label className="label">Payment mode</label>
          <select className="input" value={form.paymentMode} onChange={set('paymentMode')}>
            <option value="GPAY">GPay</option><option value="CASH">Cash</option>
          </select>
        </div>
      )}
      {editing && (
        <div>
          <label className="label">Transaction type</label>
          <select className="input" value={form.type} onChange={set('type')}>
            <option value="RECEIVED">Received</option><option value="EXPENSE">Expense</option>
          </select>
        </div>
      )}

      <div>
        <label className="label" htmlFor="amount">{isExpense ? 'Expense amount' : 'Amount received'}</label>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-display text-xl font-bold text-slate-400">₹</span>
          <input id="amount" type="number" inputMode="decimal" step="0.01" min="0" placeholder="0" value={form.amount} onChange={set('amount')}
            className={`${cls('amount')} py-3.5 pl-10 font-display text-2xl font-bold`} />
        </div>
        <Err k="amount" />
        <div className="mt-2 flex flex-wrap gap-2">
          {QUICK.map((n) => <button key={n} type="button" className="chip" onClick={() => addAmount(n)}>+₹{n.toLocaleString('en-IN')}</button>)}
          {form.amount && <button type="button" className="chip text-slate-400" onClick={() => patch('amount', '')}>Clear</button>}
        </div>
      </div>

      {overspend && (
        <p className="rounded-xl bg-cash-soft px-3.5 py-2.5 text-sm font-medium text-cash-dark">
          This is more than the available {modeLabel(mode)} balance ({inr(balance)}). It will be blocked unless the administrator allows negative balances.
        </p>
      )}

      <div>
        <label className="label" htmlFor="date">{isExpense ? 'Expense date' : 'Transaction date'}</label>
        <div className="flex flex-wrap items-center gap-2">
          <input id="date" type="date" max={today()} className={`${cls('transactionDate')} w-auto`} value={form.transactionDate} onChange={set('transactionDate')} />
          <button type="button" className="chip" onClick={() => patch('transactionDate', today())}>Today</button>
          <button type="button" className="chip" onClick={() => patch('transactionDate', dayjs().subtract(1, 'day').format('YYYY-MM-DD'))}>Yesterday</button>
        </div>
        <Err k="transactionDate" />
      </div>

      <div>
        <label className="label" htmlFor="desc">{isExpense ? 'Expense description' : 'Description / purpose'}</label>
        <input id="desc" className={cls('description')} maxLength={200} placeholder={isExpense ? 'e.g. Vehicle fuel expense' : 'e.g. Showroom collection'} value={form.description} onChange={set('description')} />
        <Err k="description" />
      </div>
      <div>
        <label className="label" htmlFor="party">{isExpense ? 'Paid to (optional)' : 'Received from (optional)'}</label>
        <input id="party" className="input" maxLength={100} value={isExpense ? form.paidTo : form.receivedFrom} onChange={set(isExpense ? 'paidTo' : 'receivedFrom')} />
      </div>
      <div>
        <label className="label" htmlFor="notes">Notes (optional)</label>
        <textarea id="notes" rows={2} maxLength={500} className="input" value={form.notes} onChange={set('notes')} />
      </div>

      <button type="submit" disabled={saving}
        className={`btn w-full py-3.5 text-base text-white shadow-md hover:brightness-110 ${isExpense ? 'bg-loss' : 'bg-gain'}`}>
        {saving ? 'Saving…' : editing ? 'Save changes' : isExpense ? 'Save expense' : 'Save amount received'}
      </button>
    </form>
  );
}