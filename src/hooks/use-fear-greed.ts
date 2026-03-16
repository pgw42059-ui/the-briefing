import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FearGreedData {
  score: number;
  rating: string;
  previousClose: number;
  oneWeekAgo: number;
  oneMonthAgo: number;
  oneYearAgo: number;
  timestamp: string;
}

async function fetchFearGreed(): Promise<FearGreedData> {
  const { data, error } = await supabase.functions.invoke('fear-greed');
  if (error) throw error;
  if (!data?.score && data?.score !== 0) throw new Error('No data');
  return data as FearGreedData;
}

export function useFearGreed() {
  return useQuery({
    queryKey: ['fear-greed'],
    queryFn: fetchFearGreed,
    staleTime: 5 * 60_000, // 5 minutes
    gcTime: 30 * 60_000,
    refetchInterval: 10 * 60_000, // 10 minutes
    retry: 2,
  });
}
