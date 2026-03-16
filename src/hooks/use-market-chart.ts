import { useQuery } from '@tanstack/react-query';

export interface ChartPoint {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  date: string; // formatted for display
}

interface RawPoint {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

function formatDate(ts: number, interval: string): string {
  const d = new Date(ts);
  if (interval === '1d' || interval === '1wk') {
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

async function fetchChartData(
  symbol: string,
  range: string,
  interval: string
): Promise<ChartPoint[]> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/market-chart?symbol=${symbol}&range=${range}&interval=${interval}`;
  const res = await fetch(url, {
    headers: {
      'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
  });

  if (!res.ok) throw new Error('Chart fetch failed');
  const json = await res.json();

  if (!json.points?.length) return [];

  return json.points.map((p: RawPoint) => ({
    ...p,
    date: formatDate(p.timestamp, interval),
  }));
}

export function useMarketChart(symbol: string, range = '1mo', interval = '1d') {
  return useQuery({
    queryKey: ['market-chart', symbol, range, interval],
    queryFn: () => fetchChartData(symbol, range, interval),
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    retry: 2,
  });
}
