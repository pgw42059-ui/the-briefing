import { useRef, useState, useCallback, type TouchEvent } from 'react';
import { Trash2, Eye } from 'lucide-react';

interface SwipeableNotificationItemProps {
  id: string;
  isRead: boolean;
  onDelete: (id: string) => void;
  onMarkRead: (id: string) => void;
  children: React.ReactNode;
}

const SWIPE_THRESHOLD = 80;
const ACTION_THRESHOLD = 140;
const MAX_OFFSET = ACTION_THRESHOLD + 20;

function vibrate(ms: number = 10) {
  try { navigator?.vibrate?.(ms); } catch (_e) { /* vibration not supported */ }
}

export function SwipeableNotificationItem({ id, isRead, onDelete, onMarkRead, children }: SwipeableNotificationItemProps) {
  const [offsetX, setOffsetX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const isHorizontalRef = useRef<boolean | null>(null);
  const crossedThresholdRef = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    isHorizontalRef.current = null;
    crossedThresholdRef.current = false;
    setSwiping(true);
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!swiping) return;
    const dx = e.touches[0].clientX - startXRef.current;
    const dy = e.touches[0].clientY - startYRef.current;

    if (isHorizontalRef.current === null) {
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        isHorizontalRef.current = Math.abs(dx) > Math.abs(dy);
      }
      return;
    }

    if (!isHorizontalRef.current) return;

    if (dx > 0 && isRead) return;

    const clampedX = Math.max(-MAX_OFFSET, Math.min(isRead ? 0 : MAX_OFFSET, dx));

    // Haptic when crossing threshold
    const crossed = Math.abs(clampedX) > ACTION_THRESHOLD;
    if (crossed && !crossedThresholdRef.current) {
      vibrate(15);
      crossedThresholdRef.current = true;
    } else if (!crossed && crossedThresholdRef.current) {
      crossedThresholdRef.current = false;
    }

    setOffsetX(clampedX);
  }, [swiping, isRead]);

  const handleTouchEnd = useCallback(() => {
    setSwiping(false);
    isHorizontalRef.current = null;

    if (offsetX < -ACTION_THRESHOLD) {
      vibrate(30);
      setOffsetX(-400);
      setTimeout(() => onDelete(id), 200);
    } else if (offsetX > ACTION_THRESHOLD && !isRead) {
      vibrate(30);
      setOffsetX(400);
      setTimeout(() => onMarkRead(id), 200);
    } else {
      setOffsetX(0);
    }
  }, [offsetX, onDelete, onMarkRead, id, isRead]);

  const absOffset = Math.abs(offsetX);
  const revealRatio = Math.min(1, absOffset / SWIPE_THRESHOLD);
  const isTriggered = absOffset > ACTION_THRESHOLD;
  const isRightSwipe = offsetX > 0;

  return (
    <div className="relative overflow-hidden">
      {/* Left swipe background — delete (right side) */}
      {offsetX < 0 && (
        <div
          className={`absolute inset-y-0 right-0 flex items-center justify-end px-4 transition-colors ${
            isTriggered ? 'bg-destructive' : 'bg-destructive/80'
          }`}
          style={{ width: absOffset }}
        >
          <Trash2
            className="w-4 h-4 text-destructive-foreground"
            style={{ opacity: revealRatio, transform: `scale(${0.6 + revealRatio * 0.4})` }}
          />
        </div>
      )}

      {/* Right swipe background — mark read (left side) */}
      {offsetX > 0 && (
        <div
          className={`absolute inset-y-0 left-0 flex items-center justify-start px-4 transition-colors ${
            isTriggered ? 'bg-primary' : 'bg-primary/80'
          }`}
          style={{ width: absOffset }}
        >
          <Eye
            className="w-4 h-4 text-primary-foreground"
            style={{ opacity: revealRatio, transform: `scale(${0.6 + revealRatio * 0.4})` }}
          />
        </div>
      )}

      {/* Foreground content */}
      <div
        className="relative bg-card"
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: swiping ? 'none' : 'transform 0.25s ease-out',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}
