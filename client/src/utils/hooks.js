import { useCallback, useEffect, useState } from 'react';
import api from './api.js';

export function useCategories() {
  const [categories, setCategories] = useState([]);
  const reload = useCallback(() => api.get('/categories').then((r) => setCategories(r.data.categories)).catch(() => {}), []);
  useEffect(() => { reload(); }, [reload]);
  return { categories, reload };
}
