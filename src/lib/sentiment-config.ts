import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * 공통 감성(sentiment) 설정 상수
 * SentimentGauge, TechnicalIndicators, AssetDetail 등에서 공유 사용
 */
export const SENTIMENT_CONFIG = {
  bullish: {
    label: '강세',
    emoji: '🔴',
    colorClass: 'text-up',
    bgClass: 'bg-up-muted',
    borderClass: 'border-up/30',
    dotClass: 'bg-up',
    Icon: TrendingUp,
  },
  bearish: {
    label: '약세',
    emoji: '🔵',
    colorClass: 'text-down',
    bgClass: 'bg-down-muted',
    borderClass: 'border-down/30',
    dotClass: 'bg-down',
    Icon: TrendingDown,
  },
  neutral: {
    label: '중립',
    emoji: '⚪',
    colorClass: 'text-muted-foreground',
    bgClass: 'bg-muted',
    borderClass: 'border-border',
    dotClass: 'bg-muted-foreground',
    Icon: Minus,
  },
} as const;

export type SentimentKey = keyof typeof SENTIMENT_CONFIG;
