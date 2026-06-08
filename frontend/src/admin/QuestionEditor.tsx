import { useCallback, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  editorApi,
  QUESTION_TYPE_LABELS,
  type EditorBlock,
  type EditorChoice,
  type EditorQuestion,
  type QuestionType,
} from "./api";
import { ApiError } from "../lib/http";

const CHOICE_TYPES: QuestionType[] = ["single_choice", "multi_choice", "scale"];
const isChoice = (t: QuestionType) => CHOICE_TYPES.includes(t);

type Apply = (p: Promise<unknown>) => Promise<unknown>;

/** Borrador en vivo de los campos de una pregunta (lo que aún no se guarda). */
interface Draft {
  text: string;
  help_text: string;
  type: QuestionType;
  is_required: boolean;
  is_active: boolean;
}
type OnDraft = (id: number, draft: Draft) => void;

interface PreviewQuestion {
  id: number;
  text: string;
  help_text: string;
  type: QuestionType;
  is_required: boolean;
  is_active: boolean;
  choices: EditorChoice[];
}

export function QuestionEditor({
  onBack,
  onLogout,
}: {
  onBack: () => void;
  onLogout: () => void;
}) {
  const qc = useQueryClient();
  const [err, setErr] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "structure"],
    queryFn: editorApi.structure,
  });

  useEffect(() => {
    if (error instanceof ApiError && error.status === 401) onLogout();
  }, [error, onLogout]);

  const reportDraft = useCallback<OnDraft>((id, draft) => {
    setDrafts((prev) => ({ ...prev, [id]: draft }));
  }, []);

  const apply: Apply = (p) =>
    p
      .then((r) => {
        setErr(null);
        qc.invalidateQueries({ queryKey: ["admin", "structure"] });
        return r;
      })
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) onLogout();
        else setErr(e instanceof ApiError ? e.detail : "Error al guardar.");
        throw e;
      });

  // Lista de preguntas activas (con los cambios sin guardar) para la vista previa.
  const previewQuestions: PreviewQuestion[] = (data?.blocks ?? [])
    .flatMap((b) => b.questions)
    .map((q) => {
      const d = drafts[q.id];
      return {
        id: q.id,
        text: d?.text ?? q.text,
        help_text: d?.help_text ?? q.help_text,
        type: (d?.type ?? q.type) as QuestionType,
        is_required: d?.is_required ?? q.is_required,
        is_active: d?.is_active ?? q.is_active,
        choices: q.choices,
      };
    })
    .filter((q) => q.is_active);

  return (
    <div className="admin">
      <div className="admin-bar">
        <div className="brand">
          <small>Editor del formulario</small>
          Preguntas
        </div>
        <button className="chip" onClick={onBack}>
          ← Volver
        </button>
      </div>

      <div className="admin-content editor-content">
        <p className="intro" style={{ marginTop: 0, marginBottom: 18 }}>
          Edita el texto, las opciones, el orden o desactiva preguntas. A la derecha ves
          la vista previa de cómo lo verá el cliente, en vivo.
        </p>

        {err && <div className="error-banner">{err}</div>}

        <div className="editor-layout">
          <div className="editor-main">
            {isLoading || !data ? (
              <p style={{ color: "var(--ink-soft)" }}>Cargando…</p>
            ) : (
              data.blocks.map((b) => (
                <BlockSection
                  key={b.id}
                  block={b}
                  apply={apply}
                  onDraft={reportDraft}
                />
              ))
            )}
          </div>

          <aside className="editor-aside">
            <PreviewPanel questions={previewQuestions} />
          </aside>
        </div>
      </div>
    </div>
  );
}

function BlockSection({
  block,
  apply,
  onDraft,
}: {
  block: EditorBlock;
  apply: Apply;
  onDraft: OnDraft;
}) {
  const [title, setTitle] = useState(block.title);
  const qs = block.questions;

  const move = (index: number, dir: "up" | "down") => {
    const j = dir === "up" ? index - 1 : index + 1;
    if (j < 0 || j >= qs.length) return;
    const a = qs[index];
    const b = qs[j];
    apply(
      Promise.all([
        editorApi.updateQuestion(a.id, { order: b.order }),
        editorApi.updateQuestion(b.id, { order: a.order }),
      ]),
    ).catch(() => {});
  };

  const addQuestion = () => {
    const maxOrder = qs.reduce((m, q) => Math.max(m, q.order), 0);
    apply(
      editorApi.createQuestion({
        block: block.id,
        text: "Nueva pregunta",
        type: "textarea",
        order: maxOrder + 1,
      }),
    ).catch(() => {});
  };

  return (
    <div className="editor-block">
      <div className="editor-block-head">
        <input
          className="input block-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => {
            if (title.trim() && title !== block.title)
              apply(editorApi.updateBlock(block.id, { title })).catch(() => {});
          }}
        />
      </div>

      {qs.map((q, i) => (
        <QuestionRow
          key={q.id}
          q={q}
          index={i}
          count={qs.length}
          apply={apply}
          onMove={move}
          onDraft={onDraft}
        />
      ))}

      <button className="btn-outline" onClick={addQuestion}>
        + Agregar pregunta
      </button>
    </div>
  );
}

function QuestionRow({
  q,
  index,
  count,
  apply,
  onMove,
  onDraft,
}: {
  q: EditorQuestion;
  index: number;
  count: number;
  apply: Apply;
  onMove: (index: number, dir: "up" | "down") => void;
  onDraft: OnDraft;
}) {
  const [text, setText] = useState(q.text);
  const [help, setHelp] = useState(q.help_text);
  const [type, setType] = useState<QuestionType>(q.type);
  const [req, setReq] = useState(q.is_required);
  const [active, setActive] = useState(q.is_active);
  const [justSaved, setJustSaved] = useState(false);

  // Reporta el borrador a la vista previa cada vez que algo cambia.
  useEffect(() => {
    onDraft(q.id, {
      text,
      help_text: help,
      type,
      is_required: req,
      is_active: active,
    });
  }, [text, help, type, req, active, q.id, onDraft]);

  const dirty =
    text !== q.text ||
    help !== q.help_text ||
    type !== q.type ||
    req !== q.is_required ||
    active !== q.is_active;

  const touch = () => setJustSaved(false);

  const save = () =>
    apply(
      editorApi.updateQuestion(q.id, {
        text,
        help_text: help,
        type,
        is_required: req,
        is_active: active,
      }),
    )
      .then(() => setJustSaved(true))
      .catch(() => {});

  const remove = () => {
    if (confirm("¿Eliminar esta pregunta? (las respuestas viejas se conservan)"))
      apply(editorApi.deleteQuestion(q.id)).catch(() => {});
  };

  const addOption = () => {
    const maxOrder = q.choices.reduce((m, c) => Math.max(m, c.order), 0);
    apply(
      editorApi.createChoice({
        question: q.id,
        text: "Nueva opción",
        order: maxOrder + 1,
      }),
    ).catch(() => {});
  };

  return (
    <div className="q-edit" style={{ opacity: active ? 1 : 0.6 }}>
      <div className="q-edit-top">
        <span className="eyebrow">
          Pregunta {index + 1}
          {!active && <span className="inactive-tag" style={{ marginLeft: 8 }}>Inactiva</span>}
        </span>
        <div className="q-edit-tools">
          <button
            className="icon-btn"
            disabled={index === 0}
            onClick={() => onMove(index, "up")}
            title="Subir"
          >
            ↑
          </button>
          <button
            className="icon-btn"
            disabled={index === count - 1}
            onClick={() => onMove(index, "down")}
            title="Bajar"
          >
            ↓
          </button>
          <button className="icon-btn" onClick={remove} title="Eliminar">
            🗑
          </button>
        </div>
      </div>

      <textarea
        className="textarea"
        style={{ minHeight: 70 }}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          touch();
        }}
      />

      <div className="field" style={{ marginTop: 10, marginBottom: 0 }}>
        <label>Texto de ayuda (opcional)</label>
        <input
          className="input"
          value={help}
          onChange={(e) => {
            setHelp(e.target.value);
            touch();
          }}
        />
      </div>

      <div className="q-row2">
        <select
          className="input"
          value={type}
          onChange={(e) => {
            setType(e.target.value as QuestionType);
            touch();
          }}
        >
          {(Object.keys(QUESTION_TYPE_LABELS) as QuestionType[]).map((t) => (
            <option key={t} value={t}>
              {QUESTION_TYPE_LABELS[t]}
            </option>
          ))}
        </select>

        <label className="toggle">
          <input
            type="checkbox"
            checked={req}
            onChange={(e) => {
              setReq(e.target.checked);
              touch();
            }}
          />
          Obligatoria
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => {
              setActive(e.target.checked);
              touch();
            }}
          />
          Activa (visible)
        </label>
      </div>

      {isChoice(type) && (
        <div className="options-edit">
          <div className="label">Opciones de respuesta</div>
          {q.choices.map((c) => (
            <ChoiceRow
              key={c.id}
              choice={c}
              onSave={(t) =>
                apply(editorApi.updateChoice(c.id, { text: t })).catch(() => {})
              }
              onDelete={() => apply(editorApi.deleteChoice(c.id)).catch(() => {})}
            />
          ))}
          <button className="btn-outline btn-sm" onClick={addOption}>
            + Agregar opción
          </button>
        </div>
      )}

      <div className="btn-row" style={{ marginTop: 16, justifyContent: "flex-end" }}>
        {justSaved && !dirty && (
          <span style={{ color: "#2e7d4f", fontSize: 13, fontWeight: 600 }}>
            ✓ Guardado
          </span>
        )}
        <button className="btn btn-primary btn-sm" onClick={save} disabled={!dirty}>
          Guardar pregunta
        </button>
      </div>
    </div>
  );
}

function ChoiceRow({
  choice,
  onSave,
  onDelete,
}: {
  choice: EditorChoice;
  onSave: (text: string) => void;
  onDelete: () => void;
}) {
  const [text, setText] = useState(choice.text);
  return (
    <div className="choice-edit">
      <input
        className="input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          if (text.trim() && text !== choice.text) onSave(text);
        }}
      />
      <button className="icon-btn" onClick={onDelete} title="Eliminar opción">
        ✕
      </button>
    </div>
  );
}

// --------------------------------------------------------------------------- //
//  Vista previa lateral (como lo ve el cliente)                               //
// --------------------------------------------------------------------------- //
function PreviewPanel({ questions }: { questions: PreviewQuestion[] }) {
  const [idx, setIdx] = useState(0);
  const total = questions.length;
  const safeIdx = Math.min(idx, Math.max(0, total - 1));
  const q = questions[safeIdx];

  return (
    <div className="preview-panel">
      <div className="preview-panel-head">👁 Vista previa · como lo ve el cliente</div>
      <div className="preview-stage">
        <div className="preview-veil" />
        {q ? (
          <PreviewCard key={q.id} q={q} index={safeIdx + 1} total={total} />
        ) : (
          <div className="pv-card">
            <p className="help">No hay preguntas activas para mostrar.</p>
          </div>
        )}
      </div>
      <div className="pv-nav">
        <button
          className="icon-btn"
          disabled={safeIdx <= 0}
          onClick={() => setIdx((i) => Math.max(0, i - 1))}
          title="Anterior"
        >
          ←
        </button>
        <span>{total ? `${safeIdx + 1} / ${total}` : "0 / 0"}</span>
        <button
          className="icon-btn"
          disabled={safeIdx >= total - 1}
          onClick={() => setIdx((i) => Math.min(total - 1, i + 1))}
          title="Siguiente"
        >
          →
        </button>
      </div>
    </div>
  );
}

function PreviewCard({
  q,
  index,
  total,
}: {
  q: PreviewQuestion;
  index: number;
  total: number;
}) {
  const isOpen = q.type === "text" || q.type === "textarea";
  const isMulti = q.type === "multi_choice";
  const [selected, setSelected] = useState<string[]>([]);
  const [val, setVal] = useState("");

  const toggle = (t: string) => {
    if (isMulti)
      setSelected((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]));
    else setSelected([t]);
  };

  return (
    <div className="pv-card">
      <div className="eyebrow">
        Pregunta {index} de {total}
      </div>
      <h2 className="q-title">
        {q.text || "(sin texto)"}
        {q.is_required && " *"}
      </h2>
      {q.help_text && <p className="help">{q.help_text}</p>}

      {isOpen ? (
        <textarea
          className="textarea"
          placeholder="Escribe tu respuesta…"
          value={val}
          onChange={(e) => setVal(e.target.value)}
        />
      ) : q.choices.length > 0 ? (
        <div className="choices">
          {q.choices.map((c) => (
            <div
              key={c.id}
              className={`choice${isMulti ? " multi" : ""}${
                selected.includes(c.text) ? " selected" : ""
              }`}
              onClick={() => toggle(c.text)}
            >
              <span className="marker" />
              <span>{c.text}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="help">Agrega opciones para que el cliente pueda elegir.</p>
      )}
    </div>
  );
}
