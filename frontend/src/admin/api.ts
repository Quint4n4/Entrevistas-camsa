/** Funciones de API del panel de administrador (todas requieren token). */
import { http } from "../lib/http";

export interface DashboardStats {
  total: number;
  completed: number;
  in_progress: number;
  completion_rate: number;
  by_priority: Record<string, number>;
}

export interface SubmissionListItem {
  token: string;
  nombre: string;
  email: string;
  priority: string;
  priority_display: string;
  status: string;
  status_display: string;
  progress: number;
  started_at: string;
}

export interface AnswerDetail {
  question_id: number;
  question_text_snapshot: string;
  value_text: string;
  selected_options: string[];
  answered_at: string;
}

export interface SubmissionDetail {
  token: string;
  nombre: string;
  email: string;
  whatsapp: string;
  perfil: string;
  empresa: string;
  edad: string;
  ciudad: string;
  consent: boolean;
  priority: string;
  priority_display: string;
  status: string;
  status_display: string;
  progress: number;
  started_at: string;
  last_activity_at: string;
  completed_at: string | null;
  notes_copy: string;
  notes_objeciones: string;
  notes_motivadores: string;
  notes_prioridad: string;
  notes_insight: string;
  notes_offer: string;
  notes_final: string;
  answers: AnswerDetail[];
  strategic_reading: string;
}

export interface NotesInput {
  notes_copy: string;
  notes_objeciones: string;
  notes_motivadores: string;
  notes_prioridad: string;
  notes_insight: string;
  notes_offer: string;
  notes_final: string;
}

export const adminApi = {
  login: (username: string, password: string) =>
    http.post<{ token: string; username: string }>("/admin/login/", {
      username,
      password,
    }),
  dashboard: () => http.get<DashboardStats>("/admin/dashboard/"),
  submissions: (statusFilter = "") =>
    http.get<SubmissionListItem[]>(
      `/admin/submissions/${statusFilter ? `?status=${statusFilter}` : ""}`,
    ),
  submission: (token: string) =>
    http.get<SubmissionDetail>(`/admin/submissions/${token}/`),
  saveNotes: (token: string, notes: NotesInput) =>
    http.patch<NotesInput>(`/admin/submissions/${token}/notes/`, notes),
};

// --------------------------------------------------------------------------- //
//  Editor del formulario                                                       //
// --------------------------------------------------------------------------- //
export type QuestionType =
  | "text"
  | "textarea"
  | "single_choice"
  | "multi_choice"
  | "scale";

export interface EditorChoice {
  id: number;
  text: string;
  order: number;
}

export interface EditorQuestion {
  id: number;
  block: number;
  code: string;
  text: string;
  help_text: string;
  type: QuestionType;
  is_required: boolean;
  is_active: boolean;
  order: number;
  choices: EditorChoice[];
}

export interface EditorBlock {
  id: number;
  survey: number;
  title: string;
  description: string;
  order: number;
  is_active: boolean;
  questions: EditorQuestion[];
}

export interface EditorStructure {
  id: number;
  title: string;
  slug: string;
  blocks: EditorBlock[];
}

export const editorApi = {
  structure: () => http.get<EditorStructure>("/admin/structure/"),

  updateBlock: (id: number, data: Partial<EditorBlock>) =>
    http.patch<EditorBlock>(`/admin/blocks/${id}/`, data),

  createQuestion: (data: {
    block: number;
    text: string;
    type: QuestionType;
    order: number;
    help_text?: string;
    is_required?: boolean;
  }) => http.post<EditorQuestion>("/admin/questions/", data),

  updateQuestion: (
    id: number,
    data: Partial<Omit<EditorQuestion, "id" | "choices">>,
  ) => http.patch<EditorQuestion>(`/admin/questions/${id}/`, data),

  deleteQuestion: (id: number) => http.del<void>(`/admin/questions/${id}/`),

  createChoice: (data: { question: number; text: string; order: number }) =>
    http.post<EditorChoice>("/admin/choices/", data),

  updateChoice: (id: number, data: { text?: string; order?: number }) =>
    http.patch<EditorChoice>(`/admin/choices/${id}/`, data),

  deleteChoice: (id: number) => http.del<void>(`/admin/choices/${id}/`),
};

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  text: "Texto corto",
  textarea: "Texto largo",
  single_choice: "Opción única",
  multi_choice: "Opción múltiple",
  scale: "Escala",
};
