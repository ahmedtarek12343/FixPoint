/**
 * A headline number. Deliberately not a chart — one value is a stat tile, not
 * a one-bar bar chart. Proportional figures on the value (tabular-nums makes
 * large standalone numbers look loose); tabular is for aligned columns only.
 */
export function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
      <div className="text-xs uppercase tracking-wide text-[#898781]">
        {label}
      </div>
      <div className="mt-1 text-3xl">{value}</div>
      {hint ? (
        <div className="mt-1 text-xs text-[#898781]">{hint}</div>
      ) : null}
    </div>
  );
}
