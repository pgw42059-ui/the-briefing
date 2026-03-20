import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * 앱 전체에서 한 번만 마운트 — 방문자를 online-users 채널에 등록
 * App.tsx에서 호출
 */
export function usePresenceTracker() {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    const sessionId = Math.random().toString(36).slice(2);

    const channel = supabase.channel('online-users', {
      config: { presence: { key: sessionId } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {})
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, []);
}
