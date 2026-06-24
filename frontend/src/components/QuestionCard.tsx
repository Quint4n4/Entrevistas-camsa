import type { Question } from "../types/api";
import { Logo } from "./Logo";

export interface AnswerValue {
  value_text?: string;
  selected_options?: string[];
}

export function QuestionCard({
  question,
  answer,
  onChange,
  onNext,
  onBack,
  index,
  total,
}: {
  question: Question;
  answer: AnswerValue;
  onChange: (partial: AnswerValue) => void;
  onNext: () => void;
  onBack: () => void;
  index: number;
  total: number;
}) {
  const isOpen = question.type === "text" || question.type === "textarea";
  const isMulti = question.type === "multi_choice";
  const selected = answer.selected_options ?? [];

  const toggle = (text: string) => {
    if (isMulti) {
      onChange({
        selected_options: selected.includes(text)
          ? selected.filter((s) => s !== text)
          : [...selected, text],
      });
    } else {
      onChange({ selected_options: [text] });
    }
  };

  const hasAnswer = isOpen
    ? (answer.value_text ?? "").trim() !== ""
    : selected.length > 0;
  const canNext = !question.is_required || hasAnswer;

  return (
    <div className="card">
      <Logo size="sm" />
      <div className="eyebrow">
        Pregunta {index} de {total}
      </div>
      <h2 className="q-title">
        {question.text}
        {question.is_required && " *"}
      </h2>
      {question.help_text && <p className="help">{question.help_text}</p>}

      {isOpen ? (
        <textarea
          className="textarea"
          value={answer.value_text ?? ""}
          onChange={(e) => onChange({ value_text: e.target.value })}
          placeholder="Escribe tu respuesta…"
          autoFocus
        />
      ) : (
        <div className="choices">
          {question.choices.map((c) => (
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
      )}

      <div className="btn-row">
        <button className="btn btn-ghost" onClick={onBack}>
          Atrás
        </button>
        <button className="btn btn-primary" onClick={onNext} disabled={!canNext}>
          {index === total ? "Finalizar" : "Siguiente"}
        </button>
      </div>
    </div>
  );
}
