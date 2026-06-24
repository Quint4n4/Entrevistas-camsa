import type { Priority } from "../types/api";
import { Logo } from "./Logo";

const PRIORITIES: { value: Priority; icon: string; title: string; desc: string }[] = [
  {
    value: "appearance",
    icon: "✨",
    title: "Verse joven y sano",
    desc: "Apariencia, vitalidad física, energía, fuerza, composición corporal, anti-aging.",
  },
  {
    value: "longevity",
    icon: "⏳",
    title: "Vivir más años con calidad",
    desc: "Prevención, longevidad, biomarcadores, disminución de riesgos futuros, salud a largo plazo.",
  },
  {
    value: "mind",
    icon: "🧠",
    title: "Claridad mental y productividad",
    desc: "Memoria, concentración, toma de decisiones, rendimiento cognitivo, liderazgo, productividad.",
  },
];

export function PriorityCard({
  value,
  onSelect,
  onNext,
  onBack,
}: {
  value: Priority | "";
  onSelect: (p: Priority) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="card">
      <Logo size="sm" />
      <div className="eyebrow">Filtro inicial de prioridad</div>
      <h1 style={{ fontSize: "clamp(22px, 3.4vw, 30px)" }}>
        Si solo pudieras mejorar una de estas áreas durante los próximos 12 meses, ¿cuál
        elegirías?
      </h1>

      <div className="priority-list">
        {PRIORITIES.map((p) => (
          <div
            key={p.value}
            className={`priority${value === p.value ? " selected" : ""}`}
            onClick={() => onSelect(p.value)}
          >
            <div className="icon">{p.icon}</div>
            <div>
              <h3>{p.title}</h3>
              <p>{p.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="btn-row">
        <button className="btn btn-ghost" onClick={onBack}>
          Atrás
        </button>
        <button className="btn btn-primary" onClick={onNext} disabled={!value}>
          Continuar
        </button>
      </div>
    </div>
  );
}
