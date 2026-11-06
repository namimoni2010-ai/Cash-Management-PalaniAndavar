/** Palani Andavar E Motors wordmark. tone="light" for dark backgrounds, "dark" for light ones. */
export default function Brand({ size = 'md', tone = 'light' }) {
  const big = size === 'md';
  const light = tone === 'light';
  return (
    <div className="flex items-center gap-3">
      <span className={`grid shrink-0 place-items-center bg-gradient-to-br from-gpay to-cash shadow-lg shadow-gpay/30 ${big ? 'h-12 w-12 rounded-2xl' : 'h-9 w-9 rounded-xl'}`}>
        <svg viewBox="0 0 24 24" className={big ? 'h-6 w-6' : 'h-5 w-5'} fill="white" aria-hidden="true">
          <path d="M13.5 2L4 13.5h6.5L9.5 22 20 9.5h-6.8z" />
        </svg>
      </span>
      <div className="leading-none">
        <p className={`font-brand font-extrabold tracking-tight ${big ? 'text-base' : 'text-sm'} ${light ? 'text-white' : 'text-ink'}`}>Palani Andavar</p>
        <p className={`mt-1.5 bg-gradient-to-r bg-clip-text font-brand font-bold text-transparent ${big ? 'text-[11px] tracking-[0.4em]' : 'text-[10px] tracking-[0.35em]'} ${light ? 'from-sky-300 to-amber-300' : 'from-gpay to-cash'}`}>E MOTORS</p>
      </div>
    </div>
  );
}