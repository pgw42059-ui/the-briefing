import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { FuturesQuote } from '@/lib/mock-data';
import { mockQuotes } from '@/lib/mock-data';

async function fetchQuotes(): Promise<FuturesQuote[]> {
  const { data, error } = await supabase.functions.invoke('market-quotes');
  
  if (error) throw error;

  if (data?.quotes?.length > 0) {
    return data.quotes;
  }

  // Fallback to mock data if API returns empty
  return mockQuotes;
}

export function useMarketQuotes() {
  return useQuery({
    queryKey: ['market-quotes'],
    queryFn: fetchQuotes,
    refetchInterval: 30_000, // Refresh every 30 seconds
    staleTime: 15_000,
    retry: 2,
    placeholderData: mockQuotes,
  });
}
