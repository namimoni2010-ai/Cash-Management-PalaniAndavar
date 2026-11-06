import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { inr, inrShort } from '../utils/format.js';

const C = { gain: '#16a34a', loss: '#dc2f2f', gpay: '#2563eb', cash: '#f08a0c', ink: '#14203d' };
const PIE = ['#2563eb', '#f08a0c', '#16a34a', '#dc2f2f', '#7c5cd6', '#0e9aa7', '#c2410c', '#64748b', '#a21caf', '#65a30d'];

const Box = ({ title, sub, children, empty }) => (
  <div className="card">
    <h3 className="font-display font-bold">{title}</h3>
    {sub && <p className="text-xs text-slate-500">{sub}</p>}
    <div className="mt-3">
      {empty ? <p className="py-16 text-center text-sm text-slate-400">No data for this period yet.</p> : <div className="h-64">{children}</div>}
    </div>
  </div>
);
const axis = { tick: { fontSize: 12, fill: '#64748b' }, axisLine: false, tickLine: false };
const tip = <Tooltip formatter={(v) => inr(v)} cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 30px rgba(15,27,61,.15)', fontSize: 13 }} />;
const grid = <CartesianGrid vertical={false} stroke="#eef2f7" />;

export function YearBalanceArea({ data, year }) {
  const rows = data.map((m) => ({ name: m.label, Balance: m.COMBINED.closing }));
  return (
    <Box title="Balance through the year" sub={`Combined closing balance by month, ${year}`} empty={!rows.some((r) => r.Balance)}>
      <ResponsiveContainer>
        <AreaChart data={rows}>
          <defs>
            <linearGradient id="bal" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.gpay} stopOpacity={0.35} /><stop offset="100%" stopColor={C.gpay} stopOpacity={0} /></linearGradient>
          </defs>
          {grid}<XAxis dataKey="name" {...axis} /><YAxis {...axis} tickFormatter={inrShort} width={60} />{tip}
          <Area type="monotone" dataKey="Balance" stroke={C.gpay} strokeWidth={3} fill="url(#bal)" />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
}

export function ReceivedVsExpensesChart({ data }) {
  const rows = data.map((m) => ({ name: m.label, Received: m.COMBINED.received, Expenses: m.COMBINED.expense }));
  return (
    <Box title="Monthly received vs expenses" empty={!rows.some((r) => r.Received || r.Expenses)}>
      <ResponsiveContainer>
        <BarChart data={rows} barGap={4}>{grid}<XAxis dataKey="name" {...axis} /><YAxis {...axis} tickFormatter={inrShort} width={60} />{tip}<Legend iconType="circle" />
          <Bar dataKey="Received" fill={C.gain} radius={[6, 6, 0, 0]} /><Bar dataKey="Expenses" fill={C.loss} radius={[6, 6, 0, 0]} /></BarChart>
      </ResponsiveContainer>
    </Box>
  );
}

export function ModeExpenseChart({ data }) {
  const rows = data.map((m) => ({ name: m.label, GPay: m.GPAY.expense, Cash: m.CASH.expense }));
  return (
    <Box title="GPay vs Cash expenses" empty={!rows.some((r) => r.GPay || r.Cash)}>
      <ResponsiveContainer>
        <BarChart data={rows} barGap={4}>{grid}<XAxis dataKey="name" {...axis} /><YAxis {...axis} tickFormatter={inrShort} width={60} />{tip}<Legend iconType="circle" />
          <Bar dataKey="GPay" fill={C.gpay} radius={[6, 6, 0, 0]} /><Bar dataKey="Cash" fill={C.cash} radius={[6, 6, 0, 0]} /></BarChart>
      </ResponsiveContainer>
    </Box>
  );
}

export function BalanceChart({ data }) {
  const rows = data.map((m) => ({ name: m.label, GPay: m.GPAY.closing, Cash: m.CASH.closing, Combined: m.COMBINED.closing }));
  return (
    <Box title="Monthly remaining balance" empty={!rows.some((r) => r.GPay || r.Cash)}>
      <ResponsiveContainer>
        <LineChart data={rows}>{grid}<XAxis dataKey="name" {...axis} /><YAxis {...axis} tickFormatter={inrShort} width={60} />{tip}<Legend iconType="circle" />
          <Line type="monotone" dataKey="GPay" stroke={C.gpay} strokeWidth={2.5} dot={false} /><Line type="monotone" dataKey="Cash" stroke={C.cash} strokeWidth={2.5} dot={false} /><Line type="monotone" dataKey="Combined" stroke={C.ink} strokeWidth={3} dot={false} /></LineChart>
      </ResponsiveContainer>
    </Box>
  );
}

export function CategoryPie({ data }) {
  return (
    <Box title="Expenses by category" empty={!data.length}>
      <ResponsiveContainer>
        <PieChart><Pie data={data} dataKey="total" nameKey="name" innerRadius={55} outerRadius={92} paddingAngle={3} cornerRadius={6}>{data.map((_, i) => <Cell key={i} fill={PIE[i % PIE.length]} />)}</Pie>{tip}<Legend iconType="circle" /></PieChart>
      </ResponsiveContainer>
    </Box>
  );
}

export function DailyTrendChart({ data }) {
  const rows = data.map((d) => ({ name: d.day, GPay: d.GPAY, Cash: d.CASH, Total: d.total }));
  return (
    <Box title="Daily expense trend" empty={!rows.some((r) => r.Total)}>
      <ResponsiveContainer>
        <LineChart data={rows}>{grid}<XAxis dataKey="name" {...axis} /><YAxis {...axis} tickFormatter={inrShort} width={60} />{tip}<Legend iconType="circle" />
          <Line type="monotone" dataKey="GPay" stroke={C.gpay} strokeWidth={2} dot={false} /><Line type="monotone" dataKey="Cash" stroke={C.cash} strokeWidth={2} dot={false} /><Line type="monotone" dataKey="Total" stroke={C.loss} strokeWidth={3} dot={false} /></LineChart>
      </ResponsiveContainer>
    </Box>
  );
}