import { MONTHS, yearOptions } from '../utils/format.js';
import Icon from './Icon.jsx';

/**
 * value = { year: number | '', month: number | '' }
 * allowAll: lets the user pick "All time" and "Whole year".
 * Prev / next arrows step one month at a time when a month is selected.
 */
export default function MonthYearFilter({ value, onChange, allowAll = false }) {
  const years = yearOptions();
  const minY = years[years.length - 1];
  const maxY = years[0];
  const canStep = value.year !== '' && value.month !== '';
  const shift = (d) => {
    let m = value.month + d;
    let y = value.year;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    if (y < minY || y > maxY) return;
    onChange({ year: y, month: m });
  };
  const arrow = 'grid h-10 w-10 place-items-center rounded-xl bg-white text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50 active:scale-95 disabled:opacity-40';
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button className={arrow} disabled={!canStep} onClick={() => shift(-1)} aria-label="Previous month"><Icon name="chevL" className="h-4 w-4" /></button>
      <select className="input w-auto bg-white" aria-label="Month" value={value.month} disabled={allowAll && value.year === ''}
        onChange={(e) => onChange({ ...value, month: e.target.value === '' ? '' : Number(e.target.value) })}>
        {allowAll && <option value="">Whole year</option>}
        {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
      </select>
      <select className="input w-auto bg-white" aria-label="Year" value={value.year}
        onChange={(e) => onChange({ ...value, year: e.target.value === '' ? '' : Number(e.target.value), month: e.target.value === '' ? '' : value.month })}>
        {allowAll && <option value="">All time</option>}
        {years.map((y) => <option key={y} value={y}>{y}</option>)}
      </select>
      <button className={arrow} disabled={!canStep} onClick={() => shift(1)} aria-label="Next month"><Icon name="chevR" className="h-4 w-4" /></button>
    </div>
  );
}