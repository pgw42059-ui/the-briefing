import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AdminLog {
  id: string;
  level: 'ERROR' | 'WARN' | 'INFO';
  message: string;
  context: Record<string, unknown> | null;
  created_at: string;
}

export interface AdminStats {
  newUsersToday: number;
  newUsersWeek: number;
  logs: AdminLog[];
  logsLoading: boolean;
}

/** admin_logs 테이블에 이벤트 기록 (전역 유틸) */
export async function logAdminEvent(
  level: 'ERROR' | 'WARN' | 'INFO',
  message: string,
  context?: Record<string, unknown>,
) {
  try {
    await supabase.from('admin_logs').insert({ level, message, context: context ?? null });
  } catch {
    // 로그 실패는 무시
  }
}

export function useAdminStats(): AdminStats {
  const [newUsersToday, setNewUsersToday] = useState(0);
  const [newUsersWeek,  setNewUsersWeek]  = useState(0);
  const [logs,          setLogs]          = useState<AdminLog[]>([]);
  const [logsLoading,   setLogsLoading]   = useState(true);

  const fetchUserCounts = useCallback(async () => {
    const now   = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const week  = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [{ count: todayCount }, { count: weekCount }] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true })
        .gte('created_at', today),
      supabase.from('profiles').select('*', { count: 'exact', head: true })
        .gte('created_at', week),
    ]);

    setNewUsersToday(todayCount ?? 0);
    setNewUsersWeek(weekCount ?? 0);
  }, []);

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    const { data } = await supabase
      .from('admin_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    setLogs((data as AdminLog[]) ?? []);
    setLogsLoading(false);
  }, []);

  useEffect(() => {
    fetchUserCounts();
    fetchLogs();

    // admin_logs 실시간 구독
    const channel = supabase
      .channel('admin-logs-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_logs' },
        (payload) => setLogs(prev => [payload.new as AdminLog, ...prev].slice(0, 20))
      )
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [fetchUserCounts, fetchLogs]);

  return { newUsersToday, newUsersWeek, logs, logsLoading };
}
