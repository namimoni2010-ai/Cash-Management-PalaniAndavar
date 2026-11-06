import { createContext, useCallback, useContext, useMemo, useState } from 'react';

// `version` goes up after every save/delete so any page showing data re-fetches itself.
// `quick` controls the global "Add entry" drawer.
const DataContext = createContext(null);
export const useData = () => useContext(DataContext);

export function DataProvider({ children }) {
  const [version, setVersion] = useState(0);
  const [quick, setQuick] = useState(null);
  const bump = useCallback(() => setVersion((v) => v + 1), []);
  const openQuick = useCallback((opts = {}) => setQuick({ mode: 'GPAY', type: 'EXPENSE', ...opts }), []);
  const closeQuick = useCallback(() => setQuick(null), []);
  const value = useMemo(() => ({ version, bump, quick, openQuick, closeQuick }), [version, bump, quick, openQuick, closeQuick]);
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}