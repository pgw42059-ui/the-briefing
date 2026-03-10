import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';

export function useWatchlist() {
  const { user } = useAuth();
  const [symbols, setSymbols] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWatchlist = useCallback(async () => {
    if (!user) {
      setSymbols([]);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('watchlist')
      .select('symbol')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    setSymbols(data?.map(d => d.symbol) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  const toggle = useCallback(async (symbol: string) => {
    if (!user) return;
    if (symbols.includes(symbol)) {
      await supabase.from('watchlist').delete().eq('user_id', user.id).eq('symbol', symbol);
      setSymbols(prev => prev.filter(s => s !== symbol));
    } else {
      await supabase.from('watchlist').insert({ user_id: user.id, symbol });
      setSymbols(prev => [...prev, symbol]);
    }
  }, [user, symbols]);

  const isWatched = useCallback((symbol: string) => symbols.includes(symbol), [symbols]);

  return { symbols, loading, toggle, isWatched, refetch: fetchWatchlist };
}
