/** Gráfica de dona (pastel) para la distribución por prioridad. SVG puro, sin librerías. */

// Tonos dorados + un gris cálido para "Sin definir".
const COLORS = ["#9a7b2e", "#c8a24b", "#e6cd8b", "#b9b2a3", "#7c5e1f"];

export function PriorityPie({
  data,
  total,
}: {
  data: Record<string, number>;
  total: number;
}) {
  const entries = Object.entries(data);
  const size = 190;
  const stroke = 32;
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;

  let acc = 0;
  const segments = entries.map(([label, count], i) => {
    const frac = total ? count / total : 0;
    const seg = {
      label,
      count,
      pct: Math.round(frac * 100),
      color: COLORS[i % COLORS.length],
      dash: frac * C,
      offset: acc,
    };
    acc += frac * C;
    return seg;
  });

  return (
    <div className="pie-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgba(154,123,46,0.12)"
            strokeWidth={stroke}
          />
          {segments
            .filter((s) => s.dash > 0)
            .map((s) => (
              <circle
                key={s.label}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={stroke}
                strokeDasharray={`${s.dash} ${C}`}
                strokeDashoffset={-s.offset}
                strokeLinecap="butt"
              />
            ))}
        </g>
        <text x="50%" y="48%" textAnchor="middle" dominantBaseline="middle" className="pie-total">
          {total}
        </text>
        <text x="50%" y="62%" textAnchor="middle" dominantBaseline="middle" className="pie-sub">
          entrevistas
        </text>
      </svg>

      <div className="pie-legend">
        {segments.map((s) => (
          <div className="legend-row" key={s.label}>
            <span className="legend-dot" style={{ background: s.color }} />
            <span className="legend-label">{s.label}</span>
            <span className="legend-val">
              {s.pct}% <small>({s.count})</small>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
