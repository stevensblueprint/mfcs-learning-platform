import { classesFor, demoTeacher, type Actor } from "./classes";
export { classes } from "./classes";
let sequence = 0;
export const nextId = () => Date.now() * 1000 + (sequence++ % 1000);
export type Pronunciation = {
  id: number;
  expression_id: number;
  language: "MANDARIN" | "CANTONESE";
  romanization_system: "PINYIN" | "JYUTPING";
  reading: string;
  audio_s3_key: string | null;
};
export type Expression = {
  id: number;
  concept_id: number;
  traditional_chinese: string;
  simplified_chinese: string | null;
  pronunciations: Pronunciation[];
};
export type ExampleSentence = {
  id: number;
  concept_id: number;
  traditional_chinese: string;
  simplified_chinese: string | null;
  english_translation: string;
};
export type Vocabulary = {
  id: number;
  lesson_id: number;
  order_num: number;
  primary_meaning: string;
  context_notes: string | null;
  expressions: Expression[];
  examples: ExampleSentence[];
};
export type Question = {
  id: number;
  lesson_id: number;
  concept_id: number | null;
  question_type: "RECOGNITION" | "PRONUNCIATION" | "WRITING";
  order_num: number;
  prompt: string;
  correct_answer: string;
  options: string[] | null;
};
export type Lesson = {
  id: number;
  title: string;
  week_number: number;
  creator_id: number;
  classIds: number[];
  student_instructions: string;
  vocabulary: Vocabulary[];
  questions: Question[];
  status: "DRAFT" | "PUBLISHED";
  created_at: string;
  updated_at: string;
};
export const blankLesson = (): Lesson => {
  const now = new Date().toISOString();
  return {
    id: nextId(),
    title: "",
    week_number: 1,
    creator_id: demoTeacher.id,
    classIds: [],
    student_instructions: "",
    vocabulary: [],
    questions: [],
    status: "DRAFT",
    created_at: now,
    updated_at: now,
  };
};
export const blankVocabulary = (lessonId: number): Vocabulary => {
  const id = nextId();
  return {
    id,
    lesson_id: lessonId,
    order_num: 0,
    primary_meaning: "",
    context_notes: null,
    expressions: [
      {
        id: nextId(),
        concept_id: id,
        traditional_chinese: "",
        simplified_chinese: null,
        pronunciations: [],
      },
    ],
    examples: [],
  };
};
export const blankQuestion = (lessonId: number): Question => ({
  id: nextId(),
  lesson_id: lessonId,
  concept_id: null,
  question_type: "RECOGNITION",
  order_num: 0,
  prompt: "",
  correct_answer: "",
  options: ["", "", "", ""],
});
export const orderedLesson = (lesson: Lesson): Lesson => ({
  ...lesson,
  vocabulary: lesson.vocabulary.map((v, i) => ({ ...v, order_num: i })),
  questions: lesson.questions.map((q, i) => ({ ...q, order_num: i })),
});
export function validateLesson(
  lesson: Lesson,
  publish: boolean,
  actor: Actor = demoTeacher,
): string[] {
  const errors: string[] = [];
  if (
    actor.role === "STUDENT" ||
    (actor.role === "TEACHER" && lesson.creator_id !== actor.id)
  )
    errors.push("You may only manage your own lessons.");
  const permitted = classesFor(actor);
  if (lesson.classIds.some((id) => !permitted.some((c) => c.id === id)))
    errors.push("You may only assign lessons to your own classes.");
  if (!Number.isInteger(lesson.week_number) || lesson.week_number < 1)
    errors.push("Week number must be a positive whole number.");
  if (
    lesson.vocabulary.some(
      (v) =>
        v.lesson_id !== lesson.id ||
        v.expressions.some(
          (e) =>
            e.concept_id !== v.id ||
            e.pronunciations.some(
              (p) =>
                p.expression_id !== e.id ||
                (p.language === "MANDARIN"
                  ? p.romanization_system !== "PINYIN"
                  : p.romanization_system !== "JYUTPING"),
            ),
        ) ||
        v.examples.some((e) => e.concept_id !== v.id),
    ) ||
    lesson.questions.some(
      (q) =>
        q.lesson_id !== lesson.id ||
        (q.concept_id !== null &&
          !lesson.vocabulary.some((v) => v.id === q.concept_id)),
    )
  )
    errors.push("Content references or pronunciation systems are invalid.");
  if (new Set(lesson.classIds).size !== lesson.classIds.length)
    errors.push("Assigned classes must be unique.");
  if (publish) {
    if (!lesson.title.trim()) errors.push("Add a lesson title.");
    if (!lesson.classIds.length) errors.push("Select at least one class.");
    if (!lesson.student_instructions.trim())
      errors.push("Add instructions for your students.");
    if (
      lesson.vocabulary.some(
        (v) =>
          !v.primary_meaning.trim() ||
          !v.expressions.length ||
          v.expressions.some(
            (e) =>
              !e.traditional_chinese.trim() ||
              e.pronunciations.some((p) => !p.reading.trim()),
          ) ||
          v.examples.some(
            (e) =>
              !e.traditional_chinese.trim() || !e.english_translation.trim(),
          ),
      )
    )
      errors.push(
        "Complete vocabulary meanings, traditional Chinese, pronunciation readings, and example translations.",
      );
    if (!lesson.questions.length) errors.push("Add at least one question.");
    if (
      lesson.questions.some(
        (q) =>
          !q.prompt.trim() ||
          !q.correct_answer.trim() ||
          (q.question_type === "RECOGNITION" &&
            (!q.options ||
              q.options.filter((o) => o.trim()).length < 2 ||
              !q.options.includes(q.correct_answer))),
      )
    )
      errors.push(
        "Complete each question and answer; recognition questions need two options and a matching answer.",
      );
  }
  return errors;
}
export interface LessonRepository {
  list(): Promise<Lesson[]>;
  save(lesson: Lesson): Promise<Lesson>;
  remove(id: number): Promise<void>;
}
export { lessonRepository } from "./mock-database";
