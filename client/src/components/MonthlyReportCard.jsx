import { inr } from '../utils/format.js';
import Money from './Money.jsx';

const T = {
  GPAY: { name: 'GPay', dot: 'bg-gpay', box: 'bg-gpay-soft text-gpay-dark' },
  CASH: { name: 'Cash', dot: 'bg-cash', box: 'bg-cash-soft text-cash-dark' },
  COMBINED: { name: 'Combined', dot: 'bg-ink', box: 'bg-navy-900 text-white' },
};

export default function MonthlyReportCard({ mode, report }) {
  const t = T[mode];
  const rows = [['Opening balance', report.opening, ''], ['Amount received', report.received, 'text-gain'], ['Expenses', report.expense, 'text-loss']];
  return (
    <div className="card">
      <h3 className="mb-4 flex items-center gap-2 font-display font-bold"><span className={`h-2.5 w-2.5 rounded-full ${t.dot}`} />{t.name}</h3>
      <dl className="space-y-2.5 text-sm">
        {rows.map(([k, v, c]) => (
          <div key={k} className="flex justify-between">
            <dt className="text-slate-500">{k}</dt>
            <dd className={`font-semibold tabular-nums ${c}`}>{inr(v)}</dd>
          </div>
        ))}
      </dl>
      <div className={`mt-4 rounded-xl px-4 py-3 ${t.box}`}>
        <p className="text-xs font-semibold opacity-80">Closing balance</p>
        <p className="font-display text-xl font-bold"><Money value={report.closing} /></p>
      </div>
    </div>
  );
}