import type { Priority } from "../types/api";
import { Logo } from "./Logo";

const PRIORITIES: { value: Priority; icon: string; title: string; desc: string }[] = [
  {
    value: "appearance",
    icon: "✨",
    title: "Verse joven y sano",
    desc: "Anti-aging, apariencia, vitalidad física, energía visible, verse bien y sentirse atractivo, fuerte y saludable.",
  },
  {
    value: "longevity",
    icon: "⏳",
    title: "Vivir más años",
    desc: "Longevidad, prevención, salud futura, vivir más tiempo con calidad y reducir riesgos silenciosos.",
  },
  {
    value: "mind",
    icon: "🧠",
    title: "Claridad mental y productividad",
    desc: "Mente, enfoque, memoria, toma de decisiones, productividad, liderazgo y rendimiento cognitivo.",
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
      <div className="eyebrow">Filtro inicial</div>
      <h1 style={{ fontSize: "clamp(26px, 4vw, 36px)" }}>
        ¿Qué es lo más importante para ti hoy?
      </h1>
      <p className="intro">Prioricemos lo que más te mueve en este momento.</p>

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
