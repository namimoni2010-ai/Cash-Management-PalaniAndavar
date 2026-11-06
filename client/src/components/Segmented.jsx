/** Pill switcher with a sliding highlight. options: [{ value, label }] */
export default function Segmented({ options, value, onChange, className = '' }) {
  const n = options.length;
  const idx = Math.max(0, options.findIndex((o) => o.value === value));
  return (
    <div className={`relative grid rounded-xl bg-slate-100 p-1 ${className}`} style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }} role="tablist">
      <span
        className="absolute inset-y-1 left-1 rounded-lg bg-white shadow transition-transform duration-300 ease-out"
        style={{ width: `calc((100% - 0.5rem) / ${n})`, transform: `translateX(${idx * 100}%)` }}
      />
      {options.map((o) => (
        <button key={o.value} type="button" role="tab" aria-selected={o.value === value} onClick={() => onChange(o.value)}
          className={`relative z-10 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${o.value === value ? 'text-ink' : 'text-slate-500 hover:text-ink'}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}