import { useMemo } from 'react';
import type { SparklinePoint } from '@/hooks/use-sparklines';

interface SparklineProps {
  data: SparklinePoint[];
  isUp: boolean;
}

export function Sparkline({ data, isUp }: SparklineProps) {
  const path = useMemo(() => {
    if (data.length < 2) return '';

    const closes = data.map(d => d.close);
    const min = Math.min(...closes);
    const max = Math.max(...closes);
    const range = max - min || 1;
    const h = 32;
    const w = 200;
    const padding = 2;

    return data
      .map((d, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = padding + ((max - d.close) / range) * (h - padding * 2);
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [data]);

  if (!path) return null;

  const color = isUp ? 'hsl(var(--up))' : 'hsl(var(--down))';

  return (
    <svg
      viewBox="0 0 200 32"
      preserveAspectRatio="none"
      className="w-full h-8"
      aria-hidden="true"
    >
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
