import { useQuery } from '@tanstack/react-query';

export interface SparklinePoint {
  close: number;
}

async function fetchSparkline(symbol: string): Promise<SparklinePoint[]> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/market-chart?symbol=${symbol}&range=5d&interval=1d`;
  const res = await fetch(url, {
    headers: {
      'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
  });
  if (!res.ok) return [];
  const json = await res.json();
  if (!json.points?.length) return [];
  return json.points.map((p: { close: number }) => ({ close: p.close }));
}

async function fetchAllSparklines(symbols: string[]): Promise<Record<string, SparklinePoint[]>> {
  const results = await Promise.allSettled(symbols.map(s => fetchSparkline(s)));
  const map: Record<string, SparklinePoint[]> = {};
  symbols.forEach((s, i) => {
    const r = results[i];
    map[s] = r.status === 'fulfilled' ? r.value : [];
  });
  return map;
}

export function useSparklines(symbols: string[]) {
  return useQuery({
    queryKey: ['sparklines', ...symbols],
    queryFn: () => fetchAllSparklines(symbols),
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
    retry: 1,
    enabled: symbols.length > 0,
  });
}
