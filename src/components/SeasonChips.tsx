import { seasons, type Season } from '../lib/stats';
import type { AppData } from '../lib/types';
import { Chip } from './ui';

export function SeasonChips({ data, value, onChange }: { data: AppData; value: Season; onChange: (s: Season) => void }) {
  const years = seasons(data);
  if (years.length < 2) return null;
  return (
    <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 no-scrollbar">
      <Chip active={value === 'all'} onClick={() => onChange('all')}>
        Gesamt
      </Chip>
      {years.map((y) => (
        <Chip key={y} active={value === y} onClick={() => onChange(y)}>
          {y}
        </Chip>
      ))}
    </div>
  );
}
