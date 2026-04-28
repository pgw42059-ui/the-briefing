import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { FuturesQuote } from '@/lib/mock-data';

async function fetchQuotes(): Promise<FuturesQuote[]> {
  const { data, error } = await supabase.functions.invoke('market-quotes');
  if (error) throw error;
  if (!data?.quotes?.length) throw new Error('시세 데이터를 받지 못했습니다');
  return data.quotes as FuturesQuote[];
}

export function useMarketQuotes() {
  return useQuery({
    queryKey: ['market-quotes'],
    queryFn: fetchQuotes,
    refetchInterval: 30_000,
    staleTime: 15_000,
    retry: 2,
  });
}
