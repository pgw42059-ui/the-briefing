import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';

export interface MarketAnalysisItem {
  type: 'alert' | 'info';
  text: string;
}

interface QuoteInput {
  symbol: string;
  name: string;
  nameKr: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
}

interface EventInput {
  time: string;
  country: string;
  name: string;
  importance: string;
  forecast?: string;
  previous?: string;
}

async function fetchMarketAnalysis(
  quotes: QuoteInput[],
  events: EventInput[],
  forceRefresh = false,
  cacheTtlMinutes?: number
): Promise<MarketAnalysisItem[]> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/market-analysis`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ quotes, events, forceRefresh, cacheTtlMinutes }),
  });

  if (!res.ok) throw new Error('Market analysis fetch failed');
  const json = await res.json();
  return json.items || [];
}

async function clearAnalysisCache(): Promise<void> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/clear-analysis-cache`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new Error('Failed to clear cache');
}

export function useMarketAnalysis(
  quotes: QuoteInput[] | undefined,
  events: EventInput[] | undefined,
  cacheTtlMinutes?: number
) {
  const forceRefreshRef = useRef(false);

  const query = useQuery({
    queryKey: ['market-analysis'],
    queryFn: () => {
      const force = forceRefreshRef.current;
      forceRefreshRef.current = false;
      return fetchMarketAnalysis(quotes!, events || [], force, cacheTtlMinutes);
    },
    enabled: !!quotes && quotes.length > 0,
    staleTime: 10 * 60_000,
    retry: 1,
  });

  const forceRefetch = () => {
    forceRefreshRef.current = true;
    query.refetch();
  };

  return { ...query, forceRefetch, clearCache: clearAnalysisCache };
}
