import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSurvey } from "./hooks/useSurvey";
import { surveyApi } from "./api/survey";
import { ApiError } from "./lib/http";
import type { Priority, Question, SubmissionData } from "./types/api";
import { AnimatedBackground } from "./components/AnimatedBackground";
import { ProgressBar } from "./components/ProgressBar";
import { WelcomeCard } from "./components/WelcomeCard";
import { DataCard } from "./components/DataCard";
import { PriorityCard } from "./components/PriorityCard";
import { QuestionCard, type AnswerValue } from "./components/QuestionCard";
import { ThankYouCard } from "./components/ThankYouCard";

type Step =
  | { kind: "welcome" }
  | { kind: "datos" }
  | { kind: "priority" }
  | { kind: "question"; question: Question; qIndex: number }
  | { kind: "thankyou" };

const TOKEN_KEY = "entrevista.token";

const emptyData: SubmissionData = {
  nombre: "",
  email: "",
  whatsapp: "",
  perfil: "",
  edad: "",
  consent: false,
  priority: "",
};

export function FormApp() {
  const { data: survey, isLoading, isError } = useSurvey();

  const [stepIdx, setStepIdx] = useState(0);
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY),
  );
  const [data, setData] = useState<SubmissionData>(emptyData);
  const [answers, setAnswers] = useState<Record<number, AnswerValue>>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const questions = useMemo(
    () => (survey ? survey.blocks.flatMap((b) => b.questions) : []),
    [survey],
  );

  const steps: Step[] = useMemo(() => {
    if (!survey) return [];
    return [
      { kind: "welcome" },
      { kind: "datos" },
      { kind: "priority" },
      ...questions.map(
        (q, i): Step => ({ kind: "question", question: q, qIndex: i + 1 }),
      ),
      { kind: "thankyou" },
    ];
  }, [survey, questions]);

  const totalQ = questions.length;
  const current = steps[stepIdx];

  // --- helpers ---
  async function guard(fn: () => Promise<void>) {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch (e) {
      setErr(e instanceof ApiError ? e.detail : "Error de conexión con el servidor.");
    } finally {
      setBusy(false);
    }
  }

  const next = () => setStepIdx((i) => Math.min(i + 1, steps.length - 1));
  const back = () => setStepIdx((i) => Math.max(i - 1, 0));

  async function ensureToken(): Promise<string> {
    if (token) return token;
    const { token: t } = await surveyApi.start();
    localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
    return t;
  }

  const handleStart = () =>
    guard(async () => {
      await ensureToken();
      next();
    });

  const handleDataChange = <K extends keyof SubmissionData>(
    field: K,
    val: SubmissionData[K],
  ) => setData((prev) => ({ ...prev, [field]: val }));

  const handleDataNext = () =>
    guard(async () => {
      const t = await ensureToken();
      await surveyApi.saveData(t, {
        nombre: data.nombre,
        email: data.email,
        whatsapp: data.whatsapp,
        perfil: data.perfil,
        edad: data.edad,
        consent: data.consent,
      });
      next();
    });

  const handlePriorityNext = () =>
    guard(async () => {
      const t = await ensureToken();
      await surveyApi.saveData(t, { priority: data.priority });
      next();
    });

  const handleAnswerChange = (qid: number, partial: AnswerValue) =>
    setAnswers((prev) => ({ ...prev, [qid]: { ...prev[qid], ...partial } }));

  const handleQuestionNext = (q: Question, isLast: boolean) =>
    guard(async () => {
      const t = await ensureToken();
      const a = answers[q.id] ?? {};
      await surveyApi.saveAnswer(t, {
        question_id: q.id,
        value_text: a.value_text,
        selected_options: a.selected_options,
      });
      if (isLast) {
        await surveyApi.complete(t);
        localStorage.removeItem(TOKEN_KEY);
      }
      next();
    });

  // --- progreso ---
  let percent = 0;
  let label: string | undefined;
  if (current?.kind === "question") {
    percent = Math.round((current.qIndex / totalQ) * 100);
    label = `${current.qIndex} / ${totalQ}`;
  } else if (current?.kind === "thankyou") {
    percent = 100;
  } else if (stepIdx > 0) {
    percent = 3;
  }

  // --- estados de carga / error de la API ---
  if (isLoading) {
    return (
      <>
        <AnimatedBackground />
        <div className="center-msg">Cargando…</div>
      </>
    );
  }
  if (isError || !survey) {
    return (
      <>
        <AnimatedBackground />
        <div className="center-msg">No se pudo cargar el formulario.</div>
      </>
    );
  }

  function renderStep() {
    if (!current) return null;
    switch (current.kind) {
      case "welcome":
        return <WelcomeCard survey={survey!} onStart={handleStart} loading={busy} />;
      case "datos":
        return (
          <DataCard
            value={data}
            onChange={handleDataChange}
            onNext={handleDataNext}
            onBack={back}
          />
        );
      case "priority":
        return (
          <PriorityCard
            value={data.priority}
            onSelect={(p: Priority) => handleDataChange("priority", p)}
            onNext={handlePriorityNext}
            onBack={back}
          />
        );
      case "question": {
        const isLast = current.qIndex === totalQ;
        return (
          <QuestionCard
            question={current.question}
            answer={answers[current.question.id] ?? {}}
            onChange={(partial) => handleAnswerChange(current.question.id, partial)}
            onNext={() => handleQuestionNext(current.question, isLast)}
            onBack={back}
            index={current.qIndex}
            total={totalQ}
          />
        );
      }
      case "thankyou":
        return <ThankYouCard name={data.nombre} />;
    }
  }

  return (
    <>
      <AnimatedBackground />
      <ProgressBar percent={percent} label={label} />

      {err && (
        <div
          style={{
            position: "fixed",
            top: 16,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#fff",
            border: "1px solid #e0b4b4",
            color: "#9a3b3b",
            padding: "10px 18px",
            borderRadius: 12,
            zIndex: 60,
            boxShadow: "0 8px 24px -10px rgba(0,0,0,.3)",
            fontSize: 14,
          }}
        >
          {err}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={stepIdx}
          className="stage"
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -26 }}
          transition={{ duration: 0.45, ease: [0.22, 0.8, 0.2, 1] }}
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
