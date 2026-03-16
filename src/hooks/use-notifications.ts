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
const PRICE_ALERTS_KEY = 'fx-price-alerts';
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

function loadPriceAlerts(): PriceAlert[] {
  try {
    const saved = localStorage.getItem(PRICE_ALERTS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function useNotifications(
  quotes?: FuturesQuote[],
  events?: EconomicEvent[],
  watchlistSymbols?: string[]
) {
  const [notifications, setNotifications] = useState<AppNotification[]>(loadNotifications);
  const [prefs, setPrefs] = useState<NotificationPrefs>(loadPrefs);
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>(loadPriceAlerts);
  const prevQuotesRef = useRef<Map<string, number>>(new Map());
  const checkedEventsRef = useRef<Set<string>>(new Set());

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
    setPrefs(currentPrefs => {
      if (
        currentPrefs.browserPushEnabled &&
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
      return currentPrefs;
    });
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

    const activeAlerts = priceAlerts.filter(a => !a.triggered);
    if (activeAlerts.length === 0) return;

    const triggeredIds: string[] = [];

    activeAlerts.forEach(alert => {
      const q = quotes.find(q => q.symbol === alert.symbol);
      if (!q) return;

      const hit =
        alert.direction === 'above'
          ? q.price >= alert.targetPrice
          : q.price <= alert.targetPrice;

      if (hit) {
        triggeredIds.push(alert.id);
        const dirLabel = alert.direction === 'above' ? '이상' : '이하';
        addNotification({
          type: 'price',
          title: `🎯 가격 목표 도달: ${alert.symbolName}`,
          message: `${alert.symbol} 현재가 ${q.price.toLocaleString()} — 목표가 ${alert.targetPrice.toLocaleString()} ${dirLabel} 도달`,
          symbol: alert.symbol,
        });
      }
    });

    if (triggeredIds.length > 0) {
      setPriceAlerts(prev =>
        prev.map(a => triggeredIds.includes(a.id) ? { ...a, triggered: true } : a)
      );
    }
  }, [quotes, priceAlerts, addNotification]);

  // Economic calendar alerts (upcoming high-importance events)
  useEffect(() => {
    if (!events || !prefs.calendarEnabled) return;

    const now = new Date();
    const today = now.toISOString().split('T')[0];

    events
      .filter(e => e.date === today && e.importance === 'high')
      .forEach(e => {
        const eventKey = `${e.date}-${e.time}-${e.name}`;
        if (checkedEventsRef.current.has(eventKey)) return;
        checkedEventsRef.current.add(eventKey);

        const [h, m] = e.time.split(':').map(Number);
        const eventTime = new Date(now);
        eventTime.setHours(h, m, 0, 0);

        const diffMin = (eventTime.getTime() - now.getTime()) / 60000;

        if (diffMin > 0 && diffMin <= 30) {
          addNotification({
            type: 'calendar',
            title: `${e.country} ${e.name}`,
            message: `약 ${Math.round(diffMin)}분 후 발표 예정 (중요도: 높음)`,
          });
        }
      });
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
