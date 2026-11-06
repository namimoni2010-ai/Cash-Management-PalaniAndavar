import { useEffect, useState } from 'react';
import api from '../utils/api.js';
import Drawer from './Drawer.jsx';
import Segmented from './Segmented.jsx';
import TransactionForm from './TransactionForm.jsx';
import Money from './Money.jsx';
import { useData } from '../context/DataContext.jsx';

/** Global "Add entry" drawer, opened from the floating button on any page. */
export default function QuickAdd() {
  const { quick, closeQuick, version } = useData();
  const [mode, setMode] = useState('GPAY');
  const [type, setType] = useState('EXPENSE');
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (!quick) return;
    setMode(quick.mode || 'GPAY');
    setType(quick.type || 'EXPENSE');
  }, [quick]);

  useEffect(() => {
    if (!quick) return;
    api.get('/summary').then((r) => setSummary(r.data)).catch(() => {});
  }, [quick, version]);

  if (!quick) return null;
  const balance = summary?.[mode]?.closing;

  return (
    <Drawer title="Add entry" onClose={closeQuick}>
      <div className="space-y-4">
        <Segmented value={type} onChange={setType} options={[{ value: 'EXPENSE', label: 'Expense' }, { value: 'RECEIVED', label: 'Amount received' }]} />
        <Segmented value={mode} onChange={setMode} options={[{ value: 'GPAY', label: 'GPay' }, { value: 'CASH', label: 'Cash' }]} />
        <div className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold ${mode === 'GPAY' ? 'bg-gpay-soft text-gpay-dark' : 'bg-cash-soft text-cash-dark'}`}>
          <span>{mode === 'GPAY' ? 'GPay' : 'Cash'} balance now</span>
          {balance != null ? <Money value={balance} className="font-display font-bold" /> : <span>…</span>}
        </div>
        <TransactionForm key={`${mode}-${type}`} type={type} mode={mode} balance={balance} onSaved={closeQuick} />
      </div>
    </Drawer>
  );
}