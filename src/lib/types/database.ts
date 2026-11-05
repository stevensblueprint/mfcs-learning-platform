/**
 * Database entity types matching the authoritative ER diagram (docs/database.md).
 */

export type UserRole = "STUDENT" | "TEACHER" | "ADMIN";
export type AccountStatus = "ACTIVE" | "INACTIVE";

export interface DbUser {
  id: number;
  auth_provider_id: string; // Cognito/Clerk User ID
  display_name: string;
  username: string;
  email: string;
  role: UserRole;
  account_status: AccountStatus;
  student_class_id: number | null; // Nullable, populated for Students
}

export interface DbClass {
  id: number;
  name: string;
  teacher_id: number; // Points to USERS (exactly 1 Teacher per class)
}

export type LessonStatus = "DRAFT" | "PUBLISHED";

export interface DbLesson {
  id: number;
  title: string;
  week_number: number;
  status: LessonStatus;
  student_instructions: string;
  creator_id: number; // Teacher or Admin ID
  created_at: Date;
  updated_at: Date;
}

export interface DbClassLesson {
  class_id: number;
  lesson_id: number;
}

export interface DbVocabularyConcept {
  id: number;
  lesson_id: number;
  order_num: number;
  primary_meaning: string;
  context_notes: string | null;
}

export interface DbChineseExpression {
  id: number;
  concept_id: number;
  traditional_chinese: string;
  simplified_chinese: string | null;
}

export type PronunciationLanguage = "MANDARIN" | "CANTONESE";
export type RomanizationSystem = "PINYIN" | "JYUTPING";

export interface DbPronunciation {
  id: number;
  expression_id: number;
  language: PronunciationLanguage;
  romanization_system: RomanizationSystem;
  reading: string;
  audio_s3_key: string | null;
}

export interface DbExampleSentence {
  id: number;
  concept_id: number;
  traditional_chinese: string;
  simplified_chinese: string | null;
  english_translation: string;
}

export type QuestionType = "RECOGNITION" | "PRONUNCIATION" | "WRITING";

export interface DbQuestion {
  id: number;
  lesson_id: number;
  concept_id: number | null;
  question_type: QuestionType;
  order_num: number;
  prompt: string;
  correct_answer: string;
  options: string[] | null; // JSON array in DB
}

export type LessonAttemptStatus = "IN_PROGRESS" | "COMPLETED";

export interface DbLessonAttempt {
  id: number;
  student_id: number;
  lesson_id: number;
  status: LessonAttemptStatus;
  score_percent: number | null;
  questions_correct: number | null;
  total_questions: number;
  started_at: Date;
  completed_at: Date | null;
}

export interface DbQuestionResponse {
  id: number;
  attempt_id: number;
  question_id: number;
  lesson_id: number;
  is_correct: boolean;
  student_audio_s3_key: string | null;
  student_stroke_data: unknown | null; // Nullable JSON for HTML5 Canvas
  student_text_answer: string | null;
  answered_at: Date;
}
