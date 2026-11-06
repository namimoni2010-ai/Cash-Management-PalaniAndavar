import dayjs from 'dayjs';
import Icon from './Icon.jsx';
import { inr, modeLabel } from '../utils/format.js';

const dayLabel = (s) => {
  const d = dayjs(s);
  if (d.isSame(dayjs(), 'day')) return 'Today';
  if (d.isSame(dayjs().subtract(1, 'day'), 'day')) return 'Yesterday';
  return d.format('ddd, DD MMM YYYY');
};

/** Transactions grouped by day, with a net total for each day. */
export default function TransactionTable({ items, onEdit, onDelete, compact = false, readOnly = false }) {
  if (!items.length) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400"><Icon name="inbox" className="h-6 w-6" /></span>
        <p className="mt-3 font-semibold">No transactions here yet</p>
        <p className="text-sm text-slate-500">Use “Add entry” to record one, or change the filters.</p>
      </div>
    );
  }
  const groups = [];
  for (const t of items) {
    const last = groups[groups.length - 1];
    if (last && last.date === t.transactionDate) last.items.push(t);
    else groups.push({ date: t.transactionDate, items: [t] });
  }
  return (
    <div className="space-y-3">
      {groups.map((g) => {
        const netPaise = g.items.reduce((s, t) => s + Math.round(t.amount * 100) * (t.type === 'RECEIVED' ? 1 : -1), 0);
        return (
          <section key={g.date} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70">
            <header className="flex items-center justify-between bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-500">
              <span>{dayLabel(g.date)}</span>
              <span className={netPaise >= 0 ? 'text-gain' : 'text-loss'}>Day net {netPaise >= 0 ? '+' : '−'}{inr(Math.abs(netPaise) / 100)}</span>
            </header>
            <ul className="divide-y divide-slate-100">
              {g.items.map((t) => {
                const received = t.type === 'RECEIVED';
                const party = received ? t.receivedFrom : t.paidTo;
                return (
                  <li key={t._id} className="flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50">
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${received ? 'bg-gain-soft text-gain' : 'bg-loss-soft text-loss'}`}>
                      <Icon name={received ? 'arrowDown' : 'arrowUp'} className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold" title={t.description}>{t.description}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                        {party && <span>{received ? 'From' : 'To'} {party}</span>}
                        {!compact && (
                          <span className={`rounded-full px-2 py-0.5 font-semibold ${t.paymentMode === 'GPAY' ? 'bg-gpay-soft text-gpay-dark' : 'bg-cash-soft text-cash-dark'}`}>{modeLabel(t.paymentMode)}</span>
                        )}
                      </p>
                    </div>
                    <p className={`whitespace-nowrap font-display font-bold tabular-nums ${received ? 'text-gain' : 'text-loss'}`}>{received ? '+' : '−'}{inr(t.amount)}</p>
                    {!readOnly && (
                      <div className="flex shrink-0 gap-1">
                        <button className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-gpay-soft hover:text-gpay" onClick={() => onEdit(t)} aria-label="Edit"><Icon name="edit" className="h-4 w-4" /></button>
                        <button className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-loss-soft hover:text-loss" onClick={() => onDelete(t)} aria-label="Delete"><Icon name="trash" className="h-4 w-4" /></button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}