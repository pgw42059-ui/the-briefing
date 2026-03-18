import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { FuturesQuote } from '@/lib/mock-data';
import type { EconomicEvent } from '@/lib/mock-data';

export interface AppNotification {
  id: string;
  type: 'price' | 'calendar' | 'watchlist' | 'summary';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  symbol?: string;
}

export interface PriceAlert {
  id: string;
  symbol: string;
  symbolName: string; // 한국어 이름 (표시용)
  targetPrice: number;
  direction: 'above' | 'below'; // 이 가격 이상 / 이하 도달 시
  createdAt: number;
  triggered: boolean;
}

interface NotificationPrefs {
  priceThreshold: number; // percent
  calendarEnabled: boolean;
  watchlistEnabled: boolean;
  summaryEnabled: boolean;
  browserPushEnabled: boolean; // 브라우저 네이티브 알림
}

const DEFAULT_PREFS: NotificationPrefs = {
  priceThreshold: 2,
  calendarEnabled: true,
  watchlistEnabled: true,
  summaryEnabled: true,
  browserPushEnabled: false,
};

const PREFS_KEY = 'fx-notification-prefs';
const NOTIFS_KEY = 'fx-notifications';
export const PRICE_ALERTS_KEY = 'fx-price-alerts';
const MAX_NOTIFICATIONS = 50;

function loadPrefs(): NotificationPrefs {
  try {
    const saved = localStorage.getItem(PREFS_KEY);
    return saved ? { ...DEFAULT_PREFS, ...JSON.parse(saved) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

function loadNotifications(): AppNotification[] {
  try {
    const saved = localStorage.getItem(NOTIFS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function loadPriceAlerts(): PriceAlert[] {
  try {
    const saved = localStorage.getItem(PRICE_ALERTS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function savePriceAlerts(alerts: PriceAlert[]): void {
  localStorage.setItem(PRICE_ALERTS_KEY, JSON.stringify(alerts));
}

export function useNotifications(
  quotes?: FuturesQuote[],
  events?: EconomicEvent[],
  watchlistSymbols?: string[]
) {
  const [notifications, setNotifications] = useState<AppNotification[]>(loadNotifications);
  const [prefs, setPrefs] = useState<NotificationPrefs>(loadPrefs);
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>(loadPriceAlerts);
  const priceAlertsRef = useRef<PriceAlert[]>([]);
  const prefsRef = useRef<NotificationPrefs>(DEFAULT_PREFS);
  const prevQuotesRef = useRef<Map<string, number>>(new Map());
  const checkedEventsRef = useRef<Set<string>>(new Set());

  // ref 동기화 — 콜백에서 dep 없이 최신값 읽기 위해
  useEffect(() => { priceAlertsRef.current = priceAlerts; }, [priceAlerts]);
  useEffect(() => { prefsRef.current = prefs; }, [prefs]);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Persist notifications
  useEffect(() => {
    localStorage.setItem(NOTIFS_KEY, JSON.stringify(notifications.slice(0, MAX_NOTIFICATIONS)));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  }, [prefs]);

  // Persist price alerts
  useEffect(() => {
    localStorage.setItem(PRICE_ALERTS_KEY, JSON.stringify(priceAlerts));
  }, [priceAlerts]);

  const addNotification = useCallback((notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      read: false,
    };

    setNotifications(prev => [newNotif, ...prev].slice(0, MAX_NOTIFICATIONS));

    const emoji = notif.type === 'price' ? '📈' : notif.type === 'calendar' ? '📅' : notif.type === 'watchlist' ? '⭐' : '📋';
    toast(`${emoji} ${notif.title}`, { description: notif.message, duration: 5000 });

    // 브라우저 네이티브 알림 — 탭이 백그라운드일 때 팝업 표시
    if (
      prefsRef.current.browserPushEnabled &&
      'Notification' in window &&
      Notification.permission === 'granted' &&
      document.visibilityState === 'hidden'
    ) {
      new Notification(`${emoji} ${notif.title}`, {
        body: notif.message,
        icon: '/icons/pwa-192x192.png',
        tag: notif.symbol ?? notif.type,
        renotify: true,
      });
    }
  }, []);

  // Price movement alerts (% 변동)
  useEffect(() => {
    if (!quotes || quotes.length === 0) return;

    const prevMap = prevQuotesRef.current;

    quotes.forEach(q => {
      const prevPrice = prevMap.get(q.symbol);

      if (prevPrice != null && prevPrice !== q.price) {
        const changePct = Math.abs(((q.price - prevPrice) / prevPrice) * 100);

        if (changePct >= prefs.priceThreshold) {
          const isUp = q.price > prevPrice;
          const isWatchlisted = watchlistSymbols?.includes(q.symbol);

          if (isWatchlisted && prefs.watchlistEnabled) {
            // 관심종목은 watchlist 타입 알림 하나만 발송
            addNotification({
              type: 'watchlist',
              title: `관심종목 알림: ${q.nameKr} ${isUp ? '급등' : '급락'}`,
              message: `${q.symbol} ${isUp ? '+' : ''}${changePct.toFixed(2)}% 변동 (${prevPrice.toLocaleString()} → ${q.price.toLocaleString()})`,
              symbol: q.symbol,
            });
          } else {
            // 일반 종목 price 알림
            addNotification({
              type: 'price',
              title: `${q.nameKr} ${isUp ? '급등' : '급락'}`,
              message: `${q.symbol} ${isUp ? '+' : ''}${changePct.toFixed(2)}% 변동 (${prevPrice.toLocaleString()} → ${q.price.toLocaleString()})`,
              symbol: q.symbol,
            });
          }
        }
      }

      prevMap.set(q.symbol, q.price);
    });
  }, [quotes, prefs.priceThreshold, prefs.watchlistEnabled, watchlistSymbols, addNotification]);

  // Price target alerts (특정 가격 도달)
  useEffect(() => {
    if (!quotes || quotes.length === 0) return;

    const activeAlerts = priceAlertsRef.current.filter(a => !a.triggered);
    if (activeAlerts.length === 0) return;

    const triggeredIds = new Set<string>();
    const quoteMap = new Map(quotes.map(q => [q.symbol, q]));

    activeAlerts.forEach(alert => {
      const q = quoteMap.get(alert.symbol);
      if (!q) return;

      const hit =
        alert.direction === 'above'
          ? q.price >= alert.targetPrice
          : q.price <= alert.targetPrice;

      if (hit) {
        triggeredIds.add(alert.id);
        const dirLabel = alert.direction === 'above' ? '이상' : '이하';
        addNotification({
          type: 'price',
          title: `🎯 가격 목표 도달: ${alert.symbolName}`,
          message: `${alert.symbol} 현재가 ${q.price.toLocaleString()} — 목표가 ${alert.targetPrice.toLocaleString()} ${dirLabel} 도달`,
          symbol: alert.symbol,
        });
      }
    });

    if (triggeredIds.size > 0) {
      setPriceAlerts(prev =>
        prev.map(a => triggeredIds.has(a.id) ? { ...a, triggered: true } : a)
      );
    }
  }, [quotes, addNotification]);

  // Economic calendar + Earnings alerts (high importance only)
  useEffect(() => {
    if (!events || !prefs.calendarEnabled) return;

    // 경제지표: 10분·5분·1분 전 / 실적발표: 30분 전
    const ECO_MILESTONES = [10, 5, 1];
    const EARNINGS_MILESTONES = [30];

    const checkEvents = () => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];

      // 날짜가 바뀌면 이전 날 키 정리 (자정 넘긴 뒤 누적 방지)
      for (const key of checkedEventsRef.current) {
        if (!key.startsWith(today)) checkedEventsRef.current.delete(key);
      }

      events
        .filter(e =>
          e.importance === 'high' &&
          e.date === today &&
          e.time &&
          e.time !== 'TBD'
        )
        .forEach(e => {
          const [h, m] = e.time.split(':').map(Number);
          const eventTime = new Date(now);
          eventTime.setHours(h, m, 0, 0);
          const diffMin = (eventTime.getTime() - now.getTime()) / 60000;

          if (diffMin <= 0) return; // 이미 지난 이벤트

          const isEarnings = !!e.ticker;
          const milestones = isEarnings ? EARNINGS_MILESTONES : ECO_MILESTONES;

          for (const milestone of milestones) {
            if (diffMin > milestone) continue; // 아직 이 마일스톤 구간 미진입
            const key = `${e.date}-${e.name}-${e.time}-${milestone}`;
            if (checkedEventsRef.current.has(key)) continue; // 이미 발송됨
            checkedEventsRef.current.add(key);

            const title = isEarnings
              ? `📊 실적발표 예정: ${e.ticker}`
              : `📅 ${e.name}`;
            const message = isEarnings
              ? `${e.companyName ?? e.ticker} ${milestone}분 후 실적 발표 예정`
              : `${milestone}분 후 발표 예정 (중요도: 높음)`;

            addNotification({ type: 'calendar', title, message });
          }
        });
    };

    checkEvents(); // 즉시 1회 실행
    const id = setInterval(checkEvents, 30_000); // 30초마다 체크 (1분 알림 놓치지 않기 위해)
    return () => clearInterval(id);
  }, [events, prefs.calendarEnabled, addNotification]);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const markOneRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const deleteOne = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const updatePrefs = useCallback((update: Partial<NotificationPrefs>) => {
    setPrefs(prev => ({ ...prev, ...update }));
  }, []);

  // 가격 목표 알림 CRUD
  const addPriceAlert = useCallback((
    symbol: string,
    symbolName: string,
    targetPrice: number,
    direction: 'above' | 'below'
  ) => {
    const newAlert: PriceAlert = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      symbol,
      symbolName,
      targetPrice,
      direction,
      createdAt: Date.now(),
      triggered: false,
    };
    setPriceAlerts(prev => [newAlert, ...prev]);
  }, []);

  const deletePriceAlert = useCallback((id: string) => {
    setPriceAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  const clearTriggeredAlerts = useCallback(() => {
    setPriceAlerts(prev => prev.filter(a => !a.triggered));
  }, []);

  // 브라우저 알림 권한 요청
  const requestBrowserPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') {
      updatePrefs({ browserPushEnabled: true });
      return true;
    }
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    if (result === 'granted') {
      updatePrefs({ browserPushEnabled: true });
      return true;
    }
    return false;
  }, [updatePrefs]);

  return {
    notifications,
    unreadCount,
    prefs,
    updatePrefs,
    markAllRead,
    markOneRead,
    deleteOne,
    clearAll,
    addNotification,
    requestBrowserPermission,
    priceAlerts,
    addPriceAlert,
    deletePriceAlert,
    clearTriggeredAlerts,
  };
}
