export function ChartTooltipShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm shadow-popover">{children}</div>
  );
}

export function ChartTooltipRow({ colorHex, label, value }: { colorHex: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-1.5 text-xs text-ink-soft">
        <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: colorHex }} aria-hidden="true" />
        {label}
      </span>
      <span className="font-semibold text-ink">{value}</span>
    </div>
  );
}
