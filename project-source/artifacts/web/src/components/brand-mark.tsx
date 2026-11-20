import { Radio } from 'lucide-react';

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5" data-testid="brand-mark">
      <div className="relative grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[0_0_24px_hsl(39_97%_62%_/_0.14)]">
        <Radio size={18} strokeWidth={2.4} />
        <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full border-2 border-background bg-accent" />
      </div>
      {!compact && (
        <span className="text-[15px] font-extrabold tracking-[-0.03em] text-foreground">
          hush<span className="text-primary">/</span>room
        </span>
      )}
    </div>
  );
}