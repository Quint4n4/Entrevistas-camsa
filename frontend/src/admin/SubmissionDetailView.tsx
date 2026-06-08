import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi, type NotesInput } from "./api";
import { ApiError } from "../lib/http";

const EMPTY_NOTES: NotesInput = {
  notes_copy: "",
  notes_insight: "",
  notes_offer: "",
  notes_final: "",
};

export function SubmissionDetailView({
  token,
  onBack,
  onLogout,
}: {
  token: string;
  onBack: () => void;
  onLogout: () => void;
}) {
  const detail = useQuery({
    queryKey: ["admin", "submission", token],
    queryFn: () => adminApi.submission(token),
  });

  const [notes, setNotes] = useState<NotesInput>(EMPTY_NOTES);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Cargar las notas existentes cuando llega el detalle.
  useEffect(() => {
    if (detail.data) {
      setNotes({
        notes_copy: detail.data.notes_copy,
        notes_insight: detail.data.notes_insight,
        notes_offer: detail.data.notes_offer,
        notes_final: detail.data.notes_final,
      });
    }
  }, [detail.data]);

  useEffect(() => {
    if (detail.error instanceof ApiError && detail.error.status === 401) onLogout();
  }, [detail.error, onLogout]);

  const setNote = (k: keyof NotesInput, v: string) => {
    setNotes((prev) => ({ ...prev, [k]: v }));
    setSaved(false);
  };

  const saveNotes = async () => {
    setSaving(true);
    try {
      await adminApi.saveNotes(token, notes);
      setSaved(true);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) onLogout();
    } finally {
      setSaving(false);
    }
  };

  const d = detail.data;

  return (
    <div className="admin">
      <div className="admin-bar">
        <div className="brand">
          <small>Detalle de entrevista</small>
          {d?.nombre || "Entrevista"}
        </div>
        <button className="chip" onClick={onBack}>
          ← Volver
        </button>
      </div>

      <div className="admin-content">
        {detail.isLoading || !d ? (
          <p style={{ color: "var(--ink-soft)" }}>Cargando…</p>
        ) : (
          <>
            {/* Datos */}
            <div className="metric-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
              <div className="metric">
                <div className="label">Contacto</div>
                <div style={{ marginTop: 8, lineHeight: 1.6 }}>
                  <strong>{d.nombre || "Sin nombre"}</strong>
                  <br />
                  {d.email || "—"}
                  <br />
                  {d.whatsapp || "—"}
                </div>
              </div>
              <div className="metric">
                <div className="label">Perfil</div>
                <div style={{ marginTop: 8, lineHeight: 1.6 }}>
                  {d.perfil || "—"}
                  <br />
                  Edad: {d.edad || "—"}
                  <br />
                  <span className={`badge ${d.status === "completed" ? "done" : "prog"}`}>
                    {d.status_display} · {d.progress}%
                  </span>
                </div>
              </div>
            </div>

            {/* Lectura estratégica automática */}
            {d.priority_display && (
              <div className="strategic">
                <div className="label" style={{ fontWeight: 700, marginBottom: 4 }}>
                  Prioridad: {d.priority_display}
                </div>
                <div style={{ color: "var(--ink-soft)" }}>{d.strategic_reading}</div>
              </div>
            )}

            {/* Respuestas */}
            <div className="section-title">Respuestas</div>
            {d.answers.length === 0 ? (
              <p style={{ color: "var(--ink-soft)" }}>Aún no hay respuestas.</p>
            ) : (
              d.answers.map((a) => (
                <div className="answer" key={a.question_id}>
                  <div className="q">{a.question_text_snapshot}</div>
                  <div className="a">
                    {a.selected_options.length > 0
                      ? a.selected_options.join(" · ")
                      : a.value_text || <em style={{ color: "#bbb" }}>Sin respuesta</em>}
                  </div>
                </div>
              ))
            )}

            {/* Notas estratégicas */}
            <div className="section-title">Notas estratégicas (privadas)</div>
            <div className="notes-grid">
              {(
                [
                  ["notes_copy", "Frases para copy de marketing"],
                  ["notes_insight", "Insight central para estrategia"],
                  ["notes_offer", "Hipótesis de oferta / ángulo comercial"],
                  ["notes_final", "Notas finales"],
                ] as [keyof NotesInput, string][]
              ).map(([key, label]) => (
                <div className="field" key={key}>
                  <label>{label}</label>
                  <textarea
                    className="textarea"
                    style={{ minHeight: 90 }}
                    value={notes[key]}
                    onChange={(e) => setNote(key, e.target.value)}
                  />
                </div>
              ))}
            </div>

            <div className="btn-row" style={{ justifyContent: "flex-end" }}>
              {saved && (
                <span style={{ color: "#2e7d4f", fontSize: 14, fontWeight: 600 }}>
                  ✓ Guardado
                </span>
              )}
              <button className="btn btn-primary" onClick={saveNotes} disabled={saving}>
                {saving ? "Guardando…" : "Guardar notas"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
