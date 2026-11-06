import { useEffect, useState } from 'react';
import api, { errorMessage } from '../utils/api.js';
import TransactionTable from '../components/TransactionTable.jsx';
import TransactionForm from '../components/TransactionForm.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import Modal from '../components/Modal.jsx';
import Segmented from '../components/Segmented.jsx';
import Icon from '../components/Icon.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useData } from '../context/DataContext.jsx';
import { inr, MONTHS, yearOptions } from '../utils/format.js';

const EMPTY = { date: '', month: '', year: '', paymentMode: '', type: '', search: '' };

export default function Transactions() {
  const toast = useToast();
  const { version, bump } = useData();
  const [filters, setFilters] = useState(EMPTY);
  const [search, setSearch] = useState('');
  const [showMore, setShowMore] = useState(false);
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => { setFilters((f) => ({ ...f, search })); setPage(1); }, 350); // debounce search
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const params = { page, limit: 20 };
    Object.entries(filters).forEach(([k, v]) => v !== '' && (params[k] = v));
    api.get('/transactions', { params }).then((r) => setData(r.data)).catch((e) => toast.error(errorMessage(e))).finally(() => setLoading(false));
  }, [filters, page, version, toast]);

  const setF = (k, v) => { setFilters((f) => ({ ...f, [k]: v, ...(k === 'date' && v ? { month: '', year: '' } : {}) })); setPage(1); };
  const moreActive = ['date', 'month', 'year'].some((k) => filters[k] !== '');

  const confirmDelete = async () => {
    setBusy(true);
    try { await api.delete(`/transactions/${deleting._id}`); toast.success('Transaction deleted'); bump(); }
    catch (e) { toast.error(errorMessage(e)); }
    finally { setBusy(false); setDeleting(null); }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl font-extrabold">Transactions</h1>
        <p className="mt-1 text-sm text-slate-500">{data.total} transaction{data.total === 1 ? '' : 's'} found</p>
      </div>

      <div className="card space-y-4">
        <div className="relative">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><Icon name="search" className="h-4 w-4" /></span>
          <input className="input pl-10" placeholder="Search by description, received from or paid to" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search" />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Segmented value={filters.type} onChange={(v) => setF('type', v)} options={[{ value: '', label: 'All' }, { value: 'RECEIVED', label: 'Received' }, { value: 'EXPENSE', label: 'Expense' }]} />
          <Segmented value={filters.paymentMode} onChange={(v) => setF('paymentMode', v)} options={[{ value: '', label: 'GPay + Cash' }, { value: 'GPAY', label: 'GPay' }, { value: 'CASH', label: 'Cash' }]} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className="chip flex items-center gap-1.5" onClick={() => setShowMore((s) => !s)} aria-expanded={showMore}>
            <Icon name="filter" className="h-4 w-4" />More filters{moreActive && <span className="h-2 w-2 rounded-full bg-gpay" />}
          </button>
          {(moreActive || filters.type || filters.paymentMode || search) && (
            <button className="chip text-slate-500" onClick={() => { setFilters(EMPTY); setSearch(''); setPage(1); }}>Clear all</button>
          )}
        </div>
        {showMore && (
          <div className="grid animate-fadeIn gap-3 sm:grid-cols-3">
            <input type="date" className="input" value={filters.date} onChange={(e) => setF('date', e.target.value)} aria-label="Date" />
            <select className="input" value={filters.month} onChange={(e) => setF('month', e.target.value)} aria-label="Month" disabled={!!filters.date}>
              <option value="">Any month</option>{MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
            <select className="input" value={filters.year} onChange={(e) => setF('year', e.target.value)} aria-label="Year" disabled={!!filters.date}>
              <option value="">Any year</option>{yearOptions().map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        )}
      </div>

      {loading ? <div className="space-y-3"><div className="skeleton h-40" /><div className="skeleton h-40" /></div>
        : <TransactionTable items={data.items} onEdit={setEditing} onDelete={setDeleting} />}

      {data.pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button className="btn-ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span className="text-sm text-slate-500">Page {page} of {data.pages}</span>
          <button className="btn-ghost" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}

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