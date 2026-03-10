import { memo } from 'react';
import { Sparkline } from '@/components/Sparkline';
import type { SparklinePoint } from '@/hooks/use-sparklines';

interface LazySparklineProps {
  data: SparklinePoint[];
  isUp: boolean;
}

export const LazySparkline = memo(function LazySparkline({ data, isUp }: LazySparklineProps) {
  if (data.length < 2) return null;
  return <Sparkline data={data} isUp={isUp} />;
});
