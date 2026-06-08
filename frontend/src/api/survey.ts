/** Funciones de API tipadas para el cuestionario. */
import { http } from "../lib/http";
import type { Survey, SubmissionData } from "../types/api";

export interface AnswerInput {
  question_id: number;
  value_text?: string;
  selected_options?: string[];
}

export const surveyApi = {
  /** Estructura del formulario activo. */
  getForm: () => http.get<Survey>("/form/"),

  /** Crea una entrevista nueva y devuelve su token. */
  start: () => http.post<{ token: string }>("/submissions/"),

  /** Autoguarda datos del entrevistado / prioridad. */
  saveData: (token: string, data: Partial<SubmissionData>) =>
    http.patch<unknown>(`/submissions/${token}/`, data),

  /** Autoguarda la respuesta a una pregunta. */
  saveAnswer: (token: string, body: AnswerInput) =>
    http.post<{ progress: number }>(`/submissions/${token}/answer/`, body),

  /** Marca la entrevista como completada. */
  complete: (token: string) =>
    http.post<{ status: string }>(`/submissions/${token}/complete/`),
};
