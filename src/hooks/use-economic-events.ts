import { useQuery } from '@tanstack/react-query';
import type { EconomicEvent } from '@/lib/mock-data';

async function fetchEconomicEvents(): Promise<EconomicEvent[]> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/economic-calendar`;
  const res = await fetch(url, {
    headers: {
      'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
  });

  if (!res.ok) throw new Error('Economic calendar fetch failed');
  const json = await res.json();
  return json.events || [];
}

export function useEconomicEvents() {
  return useQuery({
    queryKey: ['economic-events'],
    queryFn: fetchEconomicEvents,
    staleTime: 3 * 60_000, // 3 minutes
    refetchInterval: 3 * 60_000, // auto-refresh every 3 min
    retry: 2,
  });
}
