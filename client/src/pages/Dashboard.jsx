import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import api, { errorMessage } from '../utils/api.js';
import MonthYearFilter from '../components/MonthYearFilter.jsx';
import Money from '../components/Money.jsx';
import Icon from '../components/Icon.jsx';
import TransactionTable from '../components/TransactionTable.jsx';
import { YearBalanceArea } from '../components/Charts.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useData } from '../context/DataContext.jsx';
import { inr, MONTHS, SHORT_MONTHS } from '../utils/format.js';

function Stat({ label, value, icon }) {
  return (
    <div className="rounded-2xl bg-white/15 p-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-white/80"><Icon name={icon} className="h-3.5 w-3.5" />{label}</p>
      <p className="mt-1 font-display text-lg font-bold"><Money value={value} /></p>
    </div>
  );
}

function Wallet({ to, title, tint, data }) {
  const available = data.opening + data.received;
  const pct = available > 0 ? Math.min(100, Math.round((data.expense / available) * 100)) : 0;
  return (
    <Link to={to} className={`group relative block overflow-hidden rounded-3xl p-6 text-white shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-2xl ${tint}`}>
      <span className="pointer-events-none absolute -bottom-12 -right-10 h-44 w-44 rounded-full bg-white/10" />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-white/85">{title} remaining balance</p>
          <p className="mt-2 font-display text-4xl font-extrabold"><Money value={data.closing} big /></p>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-full bg-white/20 transition group-hover:translate-x-1"><Icon name="chevR" /></span>
      </div>
      <div className="relative mt-6 grid grid-cols-2 gap-3">
        <Stat label={`${title} received`} value={data.received} icon="arrowDown" />
        <Stat label={`${title} expenses`} value={data.expense} icon="arrowUp" />
      </div>
      <div className="relative mt-5">
        <div className="mb-1.5 flex justify-between text-xs font-medium text-white/85"><span>Opening {inr(data.opening)}</span><span>{pct}% of available spent</span></div>
        <div className="h-2 rounded-full bg-white/25"><div className="h-2 rounded-full bg-white transition-all duration-700" style={{ width: `${pct}%` }} /></div>
      </div>
    </Link>
  );
}

function Combined({ data }) {
  const g = Math.max(0, data.GPAY.closing);
  const c = Math.max(0, data.CASH.closing);
  const total = g + c;
  const gShare = total ? Math.round((g / total) * 100) : 50;
  return (
    <div className="rounded-3xl bg-navy-900 p-6 text-white shadow-lg">
      <div className="grid gap-6 md:grid-cols-3">
        <div>
          <p className="text-sm font-semibold text-slate-300">Combined remaining balance</p>
          <p className="mt-2 font-display text-4xl font-extrabold"><Money value={data.COMBINED.closing} big /></p>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-300">Combined total received</p>
          <p className="mt-2 font-display text-2xl font-bold text-emerald-400"><Money value={data.COMBINED.received} /></p>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-300">Combined total expenses</p>
          <p className="mt-2 font-display text-2xl font-bold text-rose-400"><Money value={data.COMBINED.expense} /></p>
        </div>
      </div>
      <div className="mt-6">
        <div className="flex h-3 overflow-hidden rounded-full bg-white/10">
          <div className="bg-gpay transition-all duration-700" style={{ width: `${total ? gShare : 0}%` }} />
          <div className="bg-cash transition-all duration-700" style={{ width: `${total ? 100 - gShare : 0}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-xs font-medium text-slate-300">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-gpay" />GPay {total ? gShare : 0}% of the money</span>
          <span className="flex items-center gap-1.5">Cash {total ? 100 - gShare : 0}%<span className="h-2 w-2 rounded-full bg-cash" /></span>
        </div>
      </div>
    </div>
  );
}

const Skeleton = () => (
  <div className="space-y-5">
    <div className="grid gap-5 md:grid-cols-2"><div className="skeleton h-60" /><div className="skeleton h-60" /></div>
    <div className="skeleton h-44" />
  </div>
);

export default function Dashboard() {
  const toast = useToast();
  const { user } = useAuth();
  const { version } = useData();
  const [filter, setFilter] = useState({ year: dayjs().year(), month: dayjs().month() + 1 });
  const [data, setData] = useState(null);
  const [yearly, setYearly] = useState([]);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    const params = {};
    if (filter.year) params.year = filter.year;
    if (filter.year && filter.month) params.month = filter.month;
    const year = filter.year || dayjs().year();
    Promise.all([
      api.get('/summary', { params }),
      api.get('/reports/yearly', { params: { year } }),
      api.get('/transactions', { params: { limit: 6 } }),
    ])
      .then(([s, y, t]) => {
        setData(s.data);
        setYearly(y.data.months.map((m) => ({ ...m, label: SHORT_MONTHS[m.month - 1] })));
        setRecent(t.data.items);
      })
      .catch((e) => toast.error(errorMessage(e)));
  }, [filter, version, toast]);

  const hour = dayjs().hour();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const period = !filter.year ? 'all time' : filter.month ? `${MONTHS[filter.month - 1]} ${filter.year}` : `the year ${filter.year}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold">{greeting}, {user?.name?.split(' ')[0]}</h1>
          <p className="mt-1 text-sm text-slate-500">Here is where the showroom stands for {period}. Remaining balances include what carried forward.</p>
        </div>
        <MonthYearFilter value={filter} onChange={setFilter} allowAll />
      </div>

      {!data ? <Skeleton /> : (
        <>
          <div className="grid gap-5 md:grid-cols-2">
            <Wallet to="/gpay" title="GPay" data={data.GPAY} tint="bg-gradient-to-br from-gpay-dark via-gpay to-sky-400" />
            <Wallet to="/cash" title="Cash" data={data.CASH} tint="bg-gradient-to-br from-cash-dark via-cash to-amber-300" />
          </div>
          <Combined data={data} />
          <div className="grid gap-5 lg:grid-cols-5">
            <div className="lg:col-span-3"><YearBalanceArea data={yearly} year={filter.year || dayjs().year()} /></div>
            <div className="lg:col-span-2">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display font-bold">Recent activity</h2>
                <Link to="/transactions" className="text-sm font-semibold text-gpay hover:underline">View all</Link>
              </div>
              <TransactionTable items={recent} readOnly />
            </div>
          </div>
        </>
      )}
    </div>
  );
}