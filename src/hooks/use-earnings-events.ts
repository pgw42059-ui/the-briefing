import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { EconomicEvent } from '@/lib/mock-data';

async function fetchEarningsEvents(): Promise<EconomicEvent[]> {
  const { data, error } = await supabase.functions.invoke('earnings-calendar');
  if (error) throw error;
  return (data?.events ?? []) as EconomicEvent[];
}

export function useEarningsEvents() {
  return useQuery({
    queryKey: ['earnings-events'],
    queryFn: fetchEarningsEvents,
    staleTime: 60 * 60_000, // 1시간 (서버 캐시와 동기)
    gcTime: 2 * 60 * 60_000,
    retry: 1,
  });
}
