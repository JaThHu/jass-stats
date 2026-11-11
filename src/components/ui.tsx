import { useEffect, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cx } from '../lib/cx';


export function Card({ children, className, ...rest }: { children: ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx('rounded-2xl bg-surface border border-line', className)} {...rest}>
      {children}
    </div>
  );
}

export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cx('text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3', className)}>{children}</p>
  );
}

export function PageHeader({ title, subtitle, right }: { title: ReactNode; subtitle?: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3 pt-2">
      <div className="min-w-0">
        <h1 className="text-[28px] font-bold tracking-tight leading-tight text-ink">{title}</h1>
        {subtitle && <p className="text-sm text-ink-3 mt-0.5">{subtitle}</p>}
      </div>
      {right && <div className="flex-shrink-0">{right}</div>}
    </div>
  );
}

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold' | 'weis';

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-[#06140d] active:bg-brand-strong disabled:bg-surface-3 disabled:text-ink-3',
  secondary: 'bg-surface-2 text-ink active:bg-surface-3 border border-line disabled:text-ink-3',
  ghost: 'bg-transparent text-ink-2 active:bg-surface-2',
  danger: 'bg-danger/15 text-danger active:bg-danger/25',
  gold: 'bg-gold text-[#1c1405] active:brightness-95',
  weis: 'bg-weis text-white active:brightness-110 disabled:bg-surface-3 disabled:text-ink-3',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <button
      className={cx(
        'inline-flex items-center justify-center gap-2 font-semibold transition-colors select-none disabled:cursor-not-allowed',
        size === 'sm' && 'text-sm px-3 py-2 rounded-xl',
        size === 'md' && 'text-[15px] px-4 py-3 rounded-xl',
        size === 'lg' && 'text-base px-5 py-4 rounded-2xl',
        variants[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Chip({
  active,
  children,
  onClick,
  className,
}: {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        'px-3.5 py-1.5 rounded-full text-sm font-semibold transition-colors border whitespace-nowrap',
        active ? 'bg-ink text-bg border-ink' : 'bg-surface text-ink-2 border-line active:bg-surface-2',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  className,
}: {
  value: T;
  options: { value: T; label: ReactNode; activeClass?: string }[];
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cx('flex gap-1 p-1 rounded-xl bg-surface-2 border border-line', className)}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          onClick={() => onChange(o.value)}
          className={cx(
            'flex-1 min-w-0 py-2.5 rounded-lg text-[15px] font-semibold transition-colors truncate px-2',
            value === o.value ? o.activeClass ?? 'bg-surface-3 text-ink shadow-sm' : 'text-ink-3 active:text-ink-2',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function TeamDot({ team, className }: { team: 0 | 1; className?: string }) {
  return (
    <span
      aria-hidden
      className={cx('inline-block w-2.5 h-2.5 rounded-full flex-shrink-0', team === 0 ? 'bg-team0' : 'bg-team1', className)}
    />
  );
}

function useEscape(onClose: () => void) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
}

export function Sheet({
  title,
  onClose,
  children,
  right,
}: {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  right?: ReactNode;
}) {
  useEscape(onClose);
  return (
    <div className="fixed inset-0 z-[60] flex items-end bg-black/60 animate-fade" onClick={onClose}>
      <div
        className="w-full max-w-lg mx-auto bg-surface border-t border-x border-line rounded-t-3xl shadow-sheet max-h-[94dvh] overflow-y-auto pb-safe animate-sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="sticky top-0 z-10 bg-surface/95 backdrop-blur px-5 pt-3 pb-2">
          <div className="w-10 h-1 bg-surface-3 rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-ink truncate">{title}</h3>
            <div className="flex items-center gap-1">
              {right}
              <button onClick={onClose} aria-label="Schliessen" className="p-2 -mr-2 text-ink-3 active:text-ink rounded-full">
                <X size={22} />
              </button>
            </div>
          </div>
        </div>
        <div className="px-5 pb-5">{children}</div>
      </div>
    </div>
  );
}

export function Modal({ children, onClose }: { children: ReactNode; onClose?: () => void }) {
  useEscape(onClose ?? (() => {}));
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-5 bg-black/70 animate-fade" onClick={onClose}>
      <div
        className="w-full max-w-sm bg-surface border border-line rounded-3xl p-6 shadow-pop animate-pop"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  );
}

export function ConfirmModal({
  title,
  text,
  confirmLabel,
  danger,
  onConfirm,
  onCancel,
}: {
  title: string;
  text?: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal onClose={onCancel}>
      <p className="text-lg font-bold text-ink text-center">{title}</p>
      {text && <p className="text-sm text-ink-2 text-center mt-2">{text}</p>}
      <div className="flex gap-3 mt-6">
        <Button className="flex-1" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button className="flex-1" variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

export function Empty({ icon, title, text, children }: { icon: ReactNode; title: string; text?: string; children?: ReactNode }) {
  return (
    <div className="text-center py-14 px-6">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-surface-2 border border-line flex items-center justify-center text-ink-3 mb-4">
        {icon}
      </div>
      <p className="font-semibold text-ink">{title}</p>
      {text && <p className="text-sm text-ink-3 mt-1">{text}</p>}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}

export function StatTile({
  label,
  value,
  sub,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx('rounded-2xl bg-surface border border-line p-4', className)}>
      <p className="text-xs font-medium text-ink-3">{label}</p>
      <p className="text-2xl font-bold text-ink mt-1 leading-none">{value}</p>
      {sub && <p className="text-xs text-ink-3 mt-1.5">{sub}</p>}
    </div>
  );
}

export function Avatar({ name, size = 40, className }: { name: string; size?: number; className?: string }) {
  return (
    <span
      className={cx(
        'inline-flex items-center justify-center rounded-full bg-surface-3 text-ink font-bold flex-shrink-0 border border-line',
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
