import { memo } from 'react';
import { cn } from '@/lib/utils';

export type ImportanceLevel = 'all' | 'high' | 'medium' | 'low';

const filters: { value: ImportanceLevel; label: string; dot?: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'high', label: '높음', dot: 'bg-destructive' },
  { value: 'medium', label: '보통', dot: 'bg-warning' },
  { value: 'low', label: '낮음', dot: 'bg-muted-foreground/40' },
];

interface Props {
  value: ImportanceLevel;
  onChange: (v: ImportanceLevel) => void;
  counts: Record<ImportanceLevel, number>;
}

export const ImportanceFilter = memo(function ImportanceFilter({ value, onChange, counts }: Props) {
  return (
    <div className="flex gap-1.5 flex-wrap" role="radiogroup" aria-label="중요도 필터">
      {filters.map((f) => (
        <button
          key={f.value}
          type="button"
          role="radio"
          aria-checked={value === f.value}
          onClick={() => onChange(f.value)}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200',
            value === f.value
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground'
          )}
        >
          {f.dot && <span className={cn('w-1.5 h-1.5 rounded-full', f.dot)} />}
          {f.label}
          <span className={cn(
            'text-[10px] tabular-nums',
            value === f.value ? 'text-primary-foreground/70' : 'text-muted-foreground/60'
          )}>
            {counts[f.value]}
          </span>
        </button>
      ))}
    </div>
  );
});
