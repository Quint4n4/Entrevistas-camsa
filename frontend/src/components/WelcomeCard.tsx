import type { Survey } from "../types/api";

export function WelcomeCard({
  survey,
  onStart,
  loading,
}: {
  survey: Survey;
  onStart: () => void;
  loading: boolean;
}) {
  return (
    <div className="card">
      <div className="eyebrow">Entrevista clínica premium</div>
      <h1>{survey.title}</h1>
      <p className="intro" style={{ whiteSpace: "pre-line" }}>
        {survey.intro_text}
      </p>
      <div className="btn-row" style={{ justifyContent: "flex-end" }}>
        <button className="btn btn-primary" onClick={onStart} disabled={loading}>
          {loading ? "Preparando…" : "Comenzar"}
        </button>
      </div>
    </div>
  );
}
