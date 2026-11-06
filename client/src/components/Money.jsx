import { useEffect, useRef, useState } from 'react';
import { inr } from '../utils/format.js';

const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Smoothly counts from the previous value to the new one. */
export function useCountUp(target, ms = 800) {
  const [val, setVal] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const b = Number(target) || 0;
    if (reduced()) { setVal(b); from.current = b; return undefined; }
    const a = from.current;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / ms);
      const cur = a + (b - a) * (1 - Math.pow(1 - t, 3));
      from.current = cur;
      setVal(cur);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return val;
}

export default function Money({ value, big = false, className = '' }) {
  const v = useCountUp(value);
  const [whole, dec] = inr(v).split('.');
  return (
    <span className={`tabular-nums ${className}`}>
      {whole}
      {big ? <span className="text-[0.5em] opacity-70">.{dec}</span> : `.${dec}`}
    </span>
  );
}