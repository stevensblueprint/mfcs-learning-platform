import type { Lesson } from "./lessons";
type Check = (value: unknown) => boolean;
const text: Check = (v) => typeof v === "string";
const id: Check = (v) => Number.isSafeInteger(v) && (v as number) > 0;
const nullable =
  (check: Check): Check =>
  (v) =>
    v === null || check(v);
const array =
  (check: Check): Check =>
  (v) =>
    Array.isArray(v) && v.every(check);
const oneOf =
  (...values: string[]): Check =>
  (v) =>
    values.includes(v as string);
const object =
  (shape: Record<string, Check>): Check =>
  (v) =>
    typeof v === "object" &&
    v !== null &&
    Object.entries(shape).every(([k, check]) =>
      check((v as Record<string, unknown>)[k]),
    );
const pronunciation = object({
  id,
  expression_id: id,
  language: oneOf("MANDARIN", "CANTONESE"),
  romanization_system: oneOf("PINYIN", "JYUTPING"),
  reading: text,
  audio_s3_key: nullable(text),
});
const expression = object({
  id,
  concept_id: id,
  traditional_chinese: text,
  simplified_chinese: nullable(text),
  pronunciations: array(pronunciation),
});
const example = object({
  id,
  concept_id: id,
  traditional_chinese: text,
  simplified_chinese: nullable(text),
  english_translation: text,
});
const order: Check = (v) => Number.isInteger(v) && (v as number) >= 0;
const vocabulary = object({
  id,
  lesson_id: id,
  order_num: order,
  primary_meaning: text,
  context_notes: nullable(text),
  expressions: array(expression),
  examples: array(example),
});
const question = object({
  id,
  lesson_id: id,
  concept_id: nullable(id),
  question_type: oneOf("RECOGNITION", "PRONUNCIATION", "WRITING"),
  order_num: order,
  prompt: text,
  correct_answer: text,
  options: nullable(array(text)),
});
const date: Check = (v) =>
  typeof v === "string" && Number.isFinite(Date.parse(v));
const check = object({
  id,
  title: text,
  creator_id: id,
  week_number: id,
  status: oneOf("DRAFT", "PUBLISHED"),
  student_instructions: text,
  classIds: array(id),
  vocabulary: array(vocabulary),
  questions: array(question),
  created_at: date,
  updated_at: date,
});
export const isLesson = (value: unknown): value is Lesson => check(value);
