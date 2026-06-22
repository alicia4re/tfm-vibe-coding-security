import { Loader2 } from 'lucide-react';

export function Spinner({ className = '' }: { className?: string }) {
  return <Loader2 className={`h-5 w-5 animate-spin ${className}`} />;
}

export function FullPageLoader({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-ink-50">
      <Spinner className="h-8 w-8 text-ink-400" />
      <p className="text-sm text-ink-500">{label}</p>
    </div>
  );
}
