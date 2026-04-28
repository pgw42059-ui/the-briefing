import { memo, useMemo, useState } from 'react';
import { Bell, CheckCheck, Trash2, Settings2, TrendingUp, CalendarDays, Star, FileText, X, Eye, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { SwipeableNotificationItem } from '@/components/SwipeableNotificationItem';
import type { AppNotification, PriceAlert } from '@/hooks/use-notifications';

const BELL_FILTER_KEY = 'notif-bell-filter';
type FilterKey = 'all' | 'price' | 'calendar' | 'watchlist' | 'summary';

interface NotificationBellProps {
  notifications: AppNotification[];
  unreadCount: number;
  prefs: {
    priceThreshold: number;
    calendarEnabled: boolean;
    watchlistEnabled: boolean;
    summaryEnabled: boolean;
    browserPushEnabled: boolean;
  };
  onUpdatePrefs: (update: Partial<NotificationBellProps['prefs']>) => void;
  onRequestBrowserPermission: () => Promise<boolean>;
  onMarkAllRead: () => void;
  onMarkOneRead: (id: string) => void;
  onDeleteOne: (id: string) => void;
  onClearAll: () => void;
  priceAlerts?: PriceAlert[];
  onDeletePriceAlert?: (id: string) => void;
  onClearTriggeredAlerts?: () => void;
}

const typeConfig = {
  price: { icon: TrendingUp, label: '시세', color: 'text-primary' },
  calendar: { icon: CalendarDays, label: '경제지표', color: 'text-warning' },
  watchlist: { icon: Star, label: '관심종목', color: 'text-warning' },
  summary: { icon: FileText, label: '시황', color: 'text-primary' },
};

function formatTimeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return '방금';
  if (min < 60) return `${min}분 전`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}시간 전`;
  return `${Math.floor(hrs / 24)}일 전`;
}

function getDateLabel(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.floor((today.getTime() - target.getTime()) / 86400000);
  if (diffDays === 0) return '오늘';
  if (diffDays === 1) return '어제';
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function groupByDate(notifications: AppNotification[]): { label: string; items: AppNotification[] }[] {
  const groups: { label: string; items: AppNotification[] }[] = [];
  let currentLabel = '';
  for (const n of notifications) {
    const label = getDateLabel(n.timestamp);
    if (label !== currentLabel) {
      currentLabel = label;
      groups.push({ label, items: [n] });
    } else {
      groups[groups.length - 1].items.push(n);
    }
  }
  return groups;
}

export const NotificationBell = memo(function NotificationBell({
  notifications,
  unreadCount,
  prefs,
  onUpdatePrefs,
  onRequestBrowserPermission,
  onMarkAllRead,
  onMarkOneRead,
  onDeleteOne,
  onClearAll,
  priceAlerts = [],
  onDeletePriceAlert,
  onClearTriggeredAlerts,
}: NotificationBellProps) {
  const activeAlerts = priceAlerts.filter(a => !a.triggered);
  const triggeredAlerts = priceAlerts.filter(a => a.triggered);
  const [filter, setFilter] = useState<FilterKey>(
    () => (localStorage.getItem(BELL_FILTER_KEY) as FilterKey) ?? 'all'
  );
  const filtered = useMemo(() => filter === 'all' ? notifications : notifications.filter(n => n.type === filter), [notifications, filter]);
  const grouped = useMemo(() => groupByDate(filtered), [filtered]);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl relative"
          aria-label={unreadCount > 0 ? `알림 ${unreadCount > 9 ? '9+' : unreadCount}개 읽지 않음` : '알림'}
        >
          <Bell className={`w-4 h-4 transition-colors ${unreadCount > 0 ? 'text-warning animate-[bell-shake_0.6s_ease-in-out]' : ''}`} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96 p-0 rounded-xl" align="end">
        <Tabs defaultValue="notifications" className="w-full">
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <h3 className="text-sm font-bold">알림</h3>
            <TabsList className="h-7 p-0.5 rounded-lg bg-muted">
              <TabsTrigger value="notifications" className="text-[10px] px-2 h-6 rounded-md data-[state=active]:shadow-sm">
                <Bell className="w-3 h-3 mr-1" />
                목록
              </TabsTrigger>
              <TabsTrigger value="settings" className="text-[10px] px-2 h-6 rounded-md data-[state=active]:shadow-sm">
                <Settings2 className="w-3 h-3 mr-1" />
                설정
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="notifications" className="mt-0">
            {/* Filter chips */}
            <div className="flex items-center gap-1 px-4 pb-2 overflow-x-auto scrollbar-none">
              {([['all', '전체', Bell], ['price', '시세', TrendingUp], ['calendar', '경제지표', CalendarDays], ['watchlist', '관심종목', Star], ['summary', '시황', FileText]] as const).map(([key, label, Icon]) => (
                <Button
                  key={key}
                  variant={filter === key ? 'default' : 'outline'}
                  size="sm"
                  className={`h-6 text-[10px] gap-1 px-2 rounded-full shrink-0 ${filter === key ? '' : 'border-border/60'}`}
                  onClick={() => { setFilter(key); localStorage.setItem(BELL_FILTER_KEY, key); }}
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </Button>
              ))}
            </div>

            {notifications.length > 0 && (
              <div className="flex items-center gap-1 px-4 pb-2">
                <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 px-2 rounded-lg" onClick={onMarkAllRead}>
                  <CheckCheck className="w-3 h-3" />
                  모두 읽음
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 px-2 rounded-lg text-destructive" onClick={onClearAll}>
                  <Trash2 className="w-3 h-3" />
                  전체 삭제
                </Button>
              </div>
            )}

            <ScrollArea className="max-h-80">
              {filtered.length === 0 ? (
                <div className="py-10 text-center">
                  <Bell className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">{filter === 'all' ? '알림이 없습니다' : '해당 유형의 알림이 없습니다'}</p>
                </div>
              ) : (
                <div>
                  {grouped.map(group => (
                    <div key={group.label}>
                      <div className="sticky top-0 z-10 px-4 py-1.5 bg-muted/80 backdrop-blur-sm">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{group.label}</p>
                      </div>
                      <div className="divide-y divide-border/50">
                        {group.items.map(n => {
                          const cfg = typeConfig[n.type];
                          const Icon = cfg.icon;
                          return (
                            <SwipeableNotificationItem key={n.id} id={n.id} isRead={n.read} onDelete={onDeleteOne} onMarkRead={onMarkOneRead}>
                              <div className={`px-4 py-3 flex items-start gap-3 transition-colors group ${!n.read ? 'bg-primary/5' : ''}`}>
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${!n.read ? 'bg-primary/10' : 'bg-muted/50'}`}>
                                  <Icon className={`w-4 h-4 ${!n.read ? cfg.color : 'text-muted-foreground'}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className={`text-xs font-semibold truncate ${!n.read ? '' : 'text-muted-foreground'}`}>{n.title}</p>
                                    {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                                  </div>
                                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                                  <p className="text-[10px] text-muted-foreground/60 mt-1">{formatTimeAgo(n.timestamp)}</p>
                                </div>
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                  {!n.read && (
                                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md" onClick={() => onMarkOneRead(n.id)} aria-label="읽음 처리">
                                      <Eye className="w-3 h-3" />
                                    </Button>
                                  )}
                                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md text-destructive" onClick={() => onDeleteOne(n.id)} aria-label="삭제">
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </SwipeableNotificationItem>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <ScrollArea className="max-h-96">
            <div className="px-4 pb-4 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium">급등/급락 알림</label>
                <span className="text-[10px] text-muted-foreground font-mono">{prefs.priceThreshold}% 이상</span>
              </div>
              <Slider
                value={[prefs.priceThreshold]}
                onValueChange={([v]) => onUpdatePrefs({ priceThreshold: v })}
                min={0.5}
                max={10}
                step={0.5}
                className="w-full"
              />
              <p className="text-[10px] text-muted-foreground">변동률이 설정값 이상일 때 알림</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium">경제지표 알림</p>
                  <p className="text-[10px] text-muted-foreground">중요 지표 발표 30분 전</p>
                </div>
                <Switch checked={prefs.calendarEnabled} onCheckedChange={(v) => onUpdatePrefs({ calendarEnabled: v })} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium">관심종목 알림</p>
                  <p className="text-[10px] text-muted-foreground">관심종목 큰 변동 시</p>
                </div>
                <Switch checked={prefs.watchlistEnabled} onCheckedChange={(v) => onUpdatePrefs({ watchlistEnabled: v })} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium">시황 요약 알림</p>
                  <p className="text-[10px] text-muted-foreground">AI 시황 분석 업데이트 시</p>
                </div>
                <Switch checked={prefs.summaryEnabled} onCheckedChange={(v) => onUpdatePrefs({ summaryEnabled: v })} />
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-border/40">
                <div>
                  <p className="text-xs font-medium">브라우저 알림</p>
                  <p className="text-[10px] text-muted-foreground">
                    {'Notification' in window
                      ? (Notification.permission === 'denied'
                        ? '브라우저에서 차단됨 (설정에서 허용 필요)'
                        : '탭이 백그라운드일 때 팝업 알림')
                      : '이 브라우저는 지원하지 않음'}
                  </p>
                </div>
                <Switch
                  checked={prefs.browserPushEnabled}
                  disabled={!('Notification' in window) || Notification.permission === 'denied'}
                  onCheckedChange={async (v) => {
                    if (v) {
                      await onRequestBrowserPermission();
                    } else {
                      onUpdatePrefs({ browserPushEnabled: false });
                    }
                  }}
                />
              </div>
            </div>

            {/* 가격 목표 알림 */}
            <div className="pt-1 border-t border-border/40">
              {priceAlerts.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium">가격 목표 알림</p>
                    {triggeredAlerts.length > 0 && onClearTriggeredAlerts && (
                      <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 rounded text-muted-foreground" onClick={onClearTriggeredAlerts}>
                        완료 삭제
                      </Button>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {priceAlerts.map(alert => (
                      <div key={alert.id} className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs ${alert.triggered ? 'opacity-50 bg-muted/20' : 'bg-muted/50'}`}>
                        <span className={`text-sm shrink-0 ${alert.direction === 'above' ? 'text-up' : 'text-down'}`}>
                          {alert.direction === 'above' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </span>
                        <span className="font-mono font-semibold shrink-0">{alert.targetPrice.toLocaleString()}</span>
                        <span className="text-muted-foreground shrink-0">{alert.direction === 'above' ? '이상' : '이하'}</span>
                        <span className="text-[10px] text-muted-foreground/70 truncate flex-1">{alert.symbolName}</span>
                        {alert.triggered && <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">완료</span>}
                        {onDeletePriceAlert && (
                          <Button variant="ghost" size="icon" className="h-5 w-5 rounded shrink-0" onClick={() => onDeletePriceAlert(alert.id)}>
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  {activeAlerts.length === 0 && triggeredAlerts.length > 0 && (
                    <p className="text-[10px] text-muted-foreground text-center">활성 알림 없음 — 상세 페이지에서 추가</p>
                  )}
                </div>
              ) : (
                <>
                  <p className="text-xs font-medium mb-1">가격 목표 알림</p>
                  <p className="text-[10px] text-muted-foreground">종목 상세 페이지에서 🔔 버튼으로 목표가를 설정하세요</p>
                </>
              )}
            </div>
            </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
});
