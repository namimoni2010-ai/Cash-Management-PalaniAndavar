import { useEffect, useState } from 'react';
import api, { errorMessage } from '../utils/api.js';
import TransactionForm from '../components/TransactionForm.jsx';
import TransactionTable from '../components/TransactionTable.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import Modal from '../components/Modal.jsx';
import Segmented from '../components/Segmented.jsx';
import Money from '../components/Money.jsx';
import Icon from '../components/Icon.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useData } from '../context/DataContext.jsx';
import { inr, modeLabel } from '../utils/format.js';

export default function ModePage({ mode }) {
  const toast = useToast();
  const { version, bump } = useData();
  const [tab, setTab] = useState('RECEIVED');
  const [summary, setSummary] = useState(null);
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const isGpay = mode === 'GPAY';

  useEffect(() => {
    setSummary(null);
    Promise.all([api.get('/summary'), api.get('/transactions', { params: { paymentMode: mode, limit: 15 } })])
      .then(([s, t]) => { setSummary(s.data[mode]); setItems(t.data.items); })
      .catch((e) => toast.error(errorMessage(e)));
  }, [mode, version, toast]);

  const confirmDelete = async () => {
    setBusy(true);
    try { await api.delete(`/transactions/${deleting._id}`); toast.success('Transaction deleted'); bump(); }
    catch (e) { toast.error(errorMessage(e)); }
    finally { setBusy(false); setDeleting(null); }
  };

  return (
    <div className="space-y-6">
      <div className={`relative overflow-hidden rounded-3xl p-7 text-white shadow-lg ${isGpay ? 'bg-gradient-to-br from-gpay-dark via-gpay to-sky-400' : 'bg-gradient-to-br from-cash-dark via-cash to-amber-300'}`}>
        <span className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-white/10" />
        <p className="relative flex items-center gap-2 text-sm font-semibold text-white/85"><Icon name={isGpay ? 'gpay' : 'cash'} className="h-4 w-4" />Current {modeLabel(mode)} balance</p>
        <p className="relative mt-2 font-display text-5xl font-extrabold">{summary ? <Money value={summary.closing} big /> : '…'}</p>
        {summary && (
          <div className="relative mt-5 flex flex-wrap gap-3 text-sm font-semibold">
            <span className="rounded-full bg-white/20 px-3 py-1.5">Received {inr(summary.received)}</span>
            <span className="rounded-full bg-white/20 px-3 py-1.5">Spent {inr(summary.expense)}</span>
            <span className="rounded-full bg-white/20 px-3 py-1.5">Opening {inr(summary.opening)}</span>
          </div>
        )}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-5">
        <div className="card lg:col-span-2">
          <Segmented value={tab} onChange={setTab} className="mb-5"
            options={[{ value: 'RECEIVED', label: 'Amount received' }, { value: 'EXPENSE', label: 'Expense' }]} />
          <TransactionForm key={tab} type={tab} mode={mode} balance={summary?.closing} />
        </div>
        <div className="lg:col-span-3">
          <h2 className="mb-3 font-display font-bold">Recent {modeLabel(mode)} transactions</h2>
          <TransactionTable items={items} compact onEdit={setEditing} onDelete={setDeleting} />
        </div>
      </div>

      {editing && (
        <Modal title="Edit transaction" onClose={() => setEditing(null)}>
          <TransactionForm type={editing.type} mode={editing.paymentMode} editing={editing} lockMode={false} onSaved={() => setEditing(null)} />
        </Modal>
      )}
      {deleting && (
        <ConfirmDialog title="Delete this transaction?" busy={busy} onCancel={() => setDeleting(null)} onConfirm={confirmDelete}
          message={`“${deleting.description}” for ${inr(deleting.amount)} will be removed and all balances will be recalculated. This cannot be undone.`} />
      )}
    </div>
  );
}