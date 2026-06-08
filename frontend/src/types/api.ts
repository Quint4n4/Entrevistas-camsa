/** Tipos que reflejan EXACTO lo que devuelve el backend (serializers de surveys). */

export type QuestionType =
  | "text"
  | "textarea"
  | "single_choice"
  | "multi_choice"
  | "scale";

export interface Choice {
  id: number;
  text: string;
  order: number;
}

export interface Question {
  id: number;
  code: string;
  text: string;
  help_text: string;
  type: QuestionType;
  is_required: boolean;
  order: number;
  choices: Choice[];
}

export interface Block {
  id: number;
  title: string;
  description: string;
  order: number;
  questions: Question[];
}

export interface Survey {
  id: number;
  title: string;
  slug: string;
  intro_text: string;
  blocks: Block[];
}

export type Priority = "appearance" | "longevity" | "mind";

/** Datos del entrevistado que se autoguardan. */
export interface SubmissionData {
  nombre: string;
  email: string;
  whatsapp: string;
  perfil: string;
  edad: string;
  consent: boolean;
  priority: Priority | "";
}
