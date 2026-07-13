export function StatTile({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

type BarRow = { label: string; value: number; color: string };

export function BarList({ title, rows }: { title: string; rows: BarRow[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="mb-4 text-sm font-semibold text-slate-900">{title}</h3>
      <div className="space-y-3">
        {rows.map((row) => {
          const pct = Math.max(2, Math.round((row.value / max) * 100));
          return (
            <div key={row.label}>
              <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                <span className="font-medium">{row.label}</span>
                <span className="font-semibold text-slate-900">{row.value}</span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-100">
                <div
                  className="h-3 rounded-r-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: row.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
