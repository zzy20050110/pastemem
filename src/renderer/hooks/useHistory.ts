import { useState, useEffect, useCallback } from 'react';
import type { ClipboardRecord } from '../types';

export function useHistory(search: string) {
  const [records, setRecords] = useState<ClipboardRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    try {
      if (!window.pasteMemo) {
        console.error('[PasteMemo] window.pasteMemo is not available');
        setLoading(false);
        return;
      }
      const data = await window.pasteMemo.getHistory(search || undefined);
      console.log('[PasteMemo] Renderer fetched records:', data.length);
      setRecords(data);
    } catch (err) {
      console.error('[PasteMemo] Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    setLoading(true);
    fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    const unsubscribe = window.pasteMemo.onNewRecord(() => {
      fetchRecords();
    });
    return unsubscribe;
  }, [fetchRecords]);

  const handleCopy = useCallback(async (id: number) => {
    await window.pasteMemo.copyToClipboard(id);
  }, []);

  const handlePin = useCallback(async (id: number) => {
    await window.pasteMemo.togglePin(id);
    fetchRecords();
  }, [fetchRecords]);

  const handleDelete = useCallback(async (id: number) => {
    await window.pasteMemo.deleteRecord(id);
    fetchRecords();
  }, [fetchRecords]);

  return { records, loading, handleCopy, handlePin, handleDelete };
}
