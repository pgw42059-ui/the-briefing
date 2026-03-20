import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AdminLog {
  id: string;
  level: 'ERROR' | 'WARN' | 'INFO';
  message: string;
  context: Record<string, unknown> | null;
  created_at: string;
}

export interface DayCount { date: string; count: number; }
export interface SymbolCount { symbol: string; count: number; }

export interface AdminStats {
  totalUsers: number;
  newUsersToday: number;
  newUsersWeek: number;
  signupsByDay: DayCount[];          // 최근 7일 일별 신규 가입
  topWatchlist: SymbolCount[];       // 찜 많은 종목 TOP 5
  logLevelCounts: { ERROR: number; WARN: number; INFO: number };
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
  const [totalUsers,      setTotalUsers]      = useState(0);
  const [newUsersToday,   setNewUsersToday]   = useState(0);
  const [newUsersWeek,    setNewUsersWeek]    = useState(0);
  const [signupsByDay,    setSignupsByDay]    = useState<DayCount[]>([]);
  const [topWatchlist,    setTopWatchlist]    = useState<SymbolCount[]>([]);
  const [logLevelCounts,  setLogLevelCounts]  = useState({ ERROR: 0, WARN: 0, INFO: 0 });
  const [logs,            setLogs]            = useState<AdminLog[]>([]);
  const [logsLoading,     setLogsLoading]     = useState(true);

  const fetchUserCounts = useCallback(async () => {
    const now   = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const week  = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [{ count: total }, { count: todayCount }, { count: weekCount }] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', today),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', week),
    ]);

    setTotalUsers(total ?? 0);
    setNewUsersToday(todayCount ?? 0);
    setNewUsersWeek(weekCount ?? 0);
  }, []);

  const fetchSignupsByDay = useCallback(async () => {
    const weekAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
    weekAgo.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from('profiles')
      .select('created_at')
      .gte('created_at', weekAgo.toISOString());

    // 7일 버킷 초기화
    const counts: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      counts[d.toISOString().split('T')[0]] = 0;
    }
    (data ?? []).forEach(row => {
      const key = row.created_at.split('T')[0];
      if (key in counts) counts[key] = (counts[key] ?? 0) + 1;
    });

    setSignupsByDay(
      Object.entries(counts).map(([iso, count]) => ({
        date: new Date(iso).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' }),
        count,
      }))
    );
  }, []);

  const fetchTopWatchlist = useCallback(async () => {
    const { data } = await supabase.from('watchlist').select('symbol');
    const counts: Record<string, number> = {};
    (data ?? []).forEach(row => {
      counts[row.symbol] = (counts[row.symbol] ?? 0) + 1;
    });
    setTopWatchlist(
      Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([symbol, count]) => ({ symbol, count }))
    );
  }, []);

  const fetchLogLevelCounts = useCallback(async () => {
    const [{ count: e }, { count: w }, { count: i }] = await Promise.all([
      supabase.from('admin_logs').select('*', { count: 'exact', head: true }).eq('level', 'ERROR'),
      supabase.from('admin_logs').select('*', { count: 'exact', head: true }).eq('level', 'WARN'),
      supabase.from('admin_logs').select('*', { count: 'exact', head: true }).eq('level', 'INFO'),
    ]);
    setLogLevelCounts({ ERROR: e ?? 0, WARN: w ?? 0, INFO: i ?? 0 });
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
    fetchSignupsByDay();
    fetchTopWatchlist();
    fetchLogLevelCounts();
    fetchLogs();

    // admin_logs 실시간 구독
    const channel = supabase
      .channel('admin-logs-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_logs' },
        (payload) => {
          setLogs(prev => [payload.new as AdminLog, ...prev].slice(0, 20));
          setLogLevelCounts(prev => ({
            ...prev,
            [(payload.new as AdminLog).level]: prev[(payload.new as AdminLog).level] + 1,
          }));
        }
      )
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [fetchUserCounts, fetchSignupsByDay, fetchTopWatchlist, fetchLogLevelCounts, fetchLogs]);

  return {
    totalUsers, newUsersToday, newUsersWeek,
    signupsByDay, topWatchlist, logLevelCounts,
    logs, logsLoading,
  };
}
