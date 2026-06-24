import type { SubmissionData } from "../types/api";
import { Logo } from "./Logo";

const EDADES = ["30-40", "40-50", "50-60", "60+"];

export function DataCard({
  value,
  onChange,
  onNext,
  onBack,
}: {
  value: SubmissionData;
  onChange: <K extends keyof SubmissionData>(field: K, val: SubmissionData[K]) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const canNext =
    value.nombre.trim() !== "" && value.email.trim() !== "" && value.consent;

  return (
    <div className="card">
      <Logo size="sm" />
      <div className="eyebrow">Datos de la entrevista</div>
      <h1 style={{ fontSize: "clamp(26px, 4vw, 36px)" }}>Antes de empezar</h1>
      <p className="intro">Cuéntanos quién eres para personalizar tu experiencia.</p>

      <div style={{ marginTop: 24 }}>
        <div className="field">
          <label>Nombre *</label>
          <input
            className="input"
            value={value.nombre}
            onChange={(e) => onChange("nombre", e.target.value)}
            placeholder="Ej. Alejandro R."
          />
        </div>
        <div className="field">
          <label>Email *</label>
          <input
            className="input"
            type="email"
            value={value.email}
            onChange={(e) => onChange("email", e.target.value)}
            placeholder="tu@correo.com"
          />
        </div>
        <div className="field">
          <label>WhatsApp</label>
          <input
            className="input"
            value={value.whatsapp}
            onChange={(e) => onChange("whatsapp", e.target.value)}
            placeholder="Ej. 55 1234 5678"
          />
        </div>
        <div className="field">
          <label>Profesión / cargo</label>
          <input
            className="input"
            value={value.perfil}
            onChange={(e) => onChange("perfil", e.target.value)}
            placeholder="Ej. CEO, empresario, director general"
          />
        </div>
        <div className="field">
          <label>Empresa</label>
          <input
            className="input"
            value={value.empresa}
            onChange={(e) => onChange("empresa", e.target.value)}
            placeholder="Ej. Grupo CAMSA"
          />
        </div>
        <div className="field">
          <label>Edad</label>
          <select
            className="input"
            value={value.edad}
            onChange={(e) => onChange("edad", e.target.value)}
          >
            <option value="">Selecciona…</option>
            {EDADES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Ciudad</label>
          <input
            className="input"
            value={value.ciudad}
            onChange={(e) => onChange("ciudad", e.target.value)}
            placeholder="Ej. Mérida"
          />
        </div>

        <label className="consent">
          <input
            type="checkbox"
            checked={value.consent}
            onChange={(e) => onChange("consent", e.target.checked)}
          />
          <span>
            Autorizo que me contacten y entiendo que esta información es confidencial.
          </span>
        </label>
      </div>

      <div className="btn-row">
        <button className="btn btn-ghost" onClick={onBack}>
          Atrás
        </button>
        <button className="btn btn-primary" onClick={onNext} disabled={!canNext}>
          Continuar
        </button>
      </div>
    </div>
  );
}
