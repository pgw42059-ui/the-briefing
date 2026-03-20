import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * online-users 채널의 presence를 읽어 실시간 접속자 수 반환
 * AdminPage에서 사용
 */
export function useOnlineCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const channel = supabase.channel('online-users');

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setCount(Object.keys(state).length);
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  return count;
}
