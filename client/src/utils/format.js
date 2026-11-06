import dayjs from 'dayjs';

export const inr = (n) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const inrShort = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
export const fmtDate = (s) => dayjs(s).format('DD-MM-YYYY');
export const today = () => dayjs().format('YYYY-MM-DD');
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const SHORT_MONTHS = MONTHS.map((m) => m.slice(0, 3));
export const modeLabel = (m) => (m === 'GPAY' ? 'GPay' : 'Cash');
export const yearOptions = () => {
  const y = dayjs().year();
  return Array.from({ length: 8 }, (_, i) => y + 1 - i);
};
export const newRequestId = () =>
  globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
