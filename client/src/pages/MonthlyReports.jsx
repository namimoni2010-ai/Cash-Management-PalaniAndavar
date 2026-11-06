import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import api, { download, errorMessage } from '../utils/api.js';
import MonthYearFilter from '../components/MonthYearFilter.jsx';
import MonthlyReportCard from '../components/MonthlyReportCard.jsx';
import Icon from '../components/Icon.jsx';
import { BalanceChart, DailyTrendChart, ModeExpenseChart, ReceivedVsExpensesChart } from '../components/Charts.jsx';
import { MONTHS, SHORT_MONTHS } from '../utils/format.js';
import { useToast } from '../context/ToastContext.jsx';
import { useData } from '../context/DataContext.jsx';

export default function MonthlyReports() {
  const toast = useToast();
  const { version } = useData();
  const [filter, setFilter] = useState({ year: dayjs().year(), month: dayjs().month() + 1 });
  const [report, setReport] = useState(null);
  const [yearly, setYearly] = useState([]);
  const [daily, setDaily] = useState([]);
  const [exporting, setExporting] = useState('');

  useEffect(() => {
    const params = { year: filter.year, month: filter.month };
    Promise.all([
      api.get('/reports/monthly', { params }),
      api.get('/reports/yearly', { params: { year: filter.year } }),
      api.get('/reports/daily', { params }),
    ])
      .then(([m, y, d]) => {
        setReport(m.data);
        setYearly(y.data.months.map((x) => ({ ...x, label: SHORT_MONTHS[x.month - 1] })));
        setDaily(d.data.days);
      })
      .catch((e) => toast.error(errorMessage(e)));
  }, [filter, version, toast]);

  const exportAs = async (format) => {
    setExporting(format);
    try { await download('/reports/export', { year: filter.year, month: filter.month, format }, `report.${format}`); }
    catch { toast.error('Could not download the report. Try again'); }
    finally { setExporting(''); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Monthly Reports</h1>
          <p className="mt-1 text-sm text-slate-500">{MONTHS[filter.month - 1]} {filter.year}. Each month opens with the previous month’s closing balance.</p>
        </div>
        <MonthYearFilter value={filter} onChange={setFilter} />
      </div>

      <div className="flex flex-wrap gap-2">
        <button className="btn-ghost" disabled={!!exporting} onClick={() => exportAs('xlsx')}><Icon name="download" className="h-4 w-4" />{exporting === 'xlsx' ? 'Preparing…' : 'Download Excel'}</button>
        <button className="btn-ghost" disabled={!!exporting} onClick={() => exportAs('pdf')}><Icon name="download" className="h-4 w-4" />{exporting === 'pdf' ? 'Preparing…' : 'Download PDF'}</button>
      </div>

      {report ? (
        <div className="grid gap-5 md:grid-cols-3">
          <MonthlyReportCard mode="GPAY" report={report.GPAY} />
          <MonthlyReportCard mode="CASH" report={report.CASH} />
          <MonthlyReportCard mode="COMBINED" report={report.COMBINED} />
        </div>
      ) : <div className="grid gap-5 md:grid-cols-3"><div className="skeleton h-64" /><div className="skeleton h-64" /><div className="skeleton h-64" /></div>}

      <h2 className="pt-2 font-display text-xl font-bold">Charts for {filter.year}</h2>
      <div className="grid gap-5 lg:grid-cols-2">
        <ReceivedVsExpensesChart data={yearly} />
        <ModeExpenseChart data={yearly} />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <BalanceChart data={yearly} />
        <DailyTrendChart data={daily} />
      </div>
    </div>
  );
}