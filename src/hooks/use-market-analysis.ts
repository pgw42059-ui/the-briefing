import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { FuturesQuote, EconomicEvent } from '@/lib/mock-data';

export interface MarketAnalysisItem {
  type: 'alert' | 'info';
  text: string;
}

// FuturesQuote에서 API 전송에 불필요한 필드만 제외
type QuoteInput = Pick<FuturesQuote, 'symbol' | 'name' | 'nameKr' | 'price' | 'change' | 'changePercent' | 'high' | 'low'>;

// EconomicEvent에서 AI 분석에 필요한 필드만 선택
type EventInput = Pick<EconomicEvent, 'time' | 'country' | 'name' | 'importance' | 'forecast' | 'previous'>;

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
