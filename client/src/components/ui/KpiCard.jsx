import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

/**
 * KpiCard
 * Props:
 *   label  — heading text
 *   value  — numeric value
 *   icon   — lucide icon component
 *   detail — sub-text below the number
 *   color  — Tailwind CSS class string for card colour variant (e.g. 'card-green')
 */
function KpiCard({ label, value, icon: Icon, detail, color }) {
  return (
    <article className={`kpi-card ${color}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-ink/60">{label}</span>
        <span className="kpi-icon"><Icon aria-hidden="true" size={18} /></span>
      </div>
      <p className="mt-4 text-4xl font-extrabold tracking-tight">{value}</p>
      <p className="mt-1 text-xs font-medium text-ink/50">{detail}</p>
      <span className="kpi-trend">
        {value > 0
          ? <ArrowUpRight aria-hidden="true" size={14} />
          : <ArrowDownRight aria-hidden="true" size={14} />
        } Live count
      </span>
    </article>
  );
}

export default KpiCard;
