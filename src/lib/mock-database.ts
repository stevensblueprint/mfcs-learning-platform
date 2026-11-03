import type {
  Lesson,
  LessonRepository,
  Vocabulary,
  Expression,
  Pronunciation,
  ExampleSentence,
  Question,
} from "./lessons";
import { demoTeacher } from "./classes";
type LessonRow = Omit<Lesson, "classIds" | "vocabulary" | "questions">;
export type MockDatabase = {
  version: 2;
  lessons: LessonRow[];
  class_lessons: { class_id: number; lesson_id: number }[];
  vocabulary_concepts: Omit<Vocabulary, "expressions" | "examples">[];
  chinese_expressions: Omit<Expression, "pronunciations">[];
  pronunciations: Pronunciation[];
  example_sentences: ExampleSentence[];
  questions: Question[];
};
const key = "mfcs.database.v2";
const empty = (): MockDatabase => ({
  version: 2,
  lessons: [],
  class_lessons: [],
  vocabulary_concepts: [],
  chinese_expressions: [],
  pronunciations: [],
  example_sentences: [],
  questions: [],
});
function read(): MockDatabase {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : empty();
}
export function hydrate(db: MockDatabase, row: LessonRow): Lesson {
  return {
    ...row,
    classIds: db.class_lessons
      .filter((c) => c.lesson_id === row.id)
      .map((c) => c.class_id),
    vocabulary: db.vocabulary_concepts
      .filter((v) => v.lesson_id === row.id)
      .sort((a, b) => a.order_num - b.order_num)
      .map((v) => ({
        ...v,
        expressions: db.chinese_expressions
          .filter((e) => e.concept_id === v.id)
          .map((e) => ({
            ...e,
            pronunciations: db.pronunciations.filter(
              (p) => p.expression_id === e.id,
            ),
          })),
        examples: db.example_sentences.filter((e) => e.concept_id === v.id),
      })),
    questions: db.questions
      .filter((q) => q.lesson_id === row.id)
      .sort((a, b) => a.order_num - b.order_num),
  };
}
function withoutLesson(db: MockDatabase, id: number): MockDatabase {
  const concepts = db.vocabulary_concepts
    .filter((v) => v.lesson_id === id)
    .map((v) => v.id);
  const expressions = db.chinese_expressions
    .filter((e) => concepts.includes(e.concept_id))
    .map((e) => e.id);
  return {
    version: 2,
    lessons: db.lessons.filter((l) => l.id !== id),
    class_lessons: db.class_lessons.filter((c) => c.lesson_id !== id),
    vocabulary_concepts: db.vocabulary_concepts.filter(
      (v) => v.lesson_id !== id,
    ),
    chinese_expressions: db.chinese_expressions.filter(
      (e) => !concepts.includes(e.concept_id),
    ),
    pronunciations: db.pronunciations.filter(
      (p) => !expressions.includes(p.expression_id),
    ),
    example_sentences: db.example_sentences.filter(
      (e) => !concepts.includes(e.concept_id),
    ),
    questions: db.questions.filter((q) => q.lesson_id !== id),
  };
}
async function authorize(lesson: Lesson) {
  const response = await fetch("/api/lessons/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(lesson),
  });
  if (!response.ok) {
    const body = await response.json();
    throw new Error(body.error || "Unable to save lesson.");
  }
}
export const lessonRepository: LessonRepository = {
  async list() {
    const db = read();
    return db.lessons
      .filter((l) => l.creator_id === demoTeacher.id)
      .map((l) => hydrate(db, l));
  },
  async save(lesson) {
    await authorize(lesson);
    const source = read();
    const previous = source.lessons.find((l) => l.id === lesson.id);
    if (previous && previous.creator_id !== demoTeacher.id)
      throw new Error("You may only edit your own lessons.");
    const db = withoutLesson(source, lesson.id);
    const { classIds, vocabulary, questions, ...row } = lesson;
    db.lessons.push({
      ...row,
      created_at: previous?.created_at ?? row.created_at,
      updated_at: new Date().toISOString(),
    });
    db.class_lessons.push(
      ...classIds.map((class_id) => ({ class_id, lesson_id: lesson.id })),
    );
    vocabulary.forEach(({ expressions, examples, ...concept }, i) => {
      db.vocabulary_concepts.push({ ...concept, order_num: i });
      expressions.forEach(({ pronunciations, ...expression }) => {
        db.chinese_expressions.push(expression);
        db.pronunciations.push(...pronunciations);
      });
      db.example_sentences.push(...examples);
    });
    db.questions.push(...questions.map((q, i) => ({ ...q, order_num: i })));
    localStorage.setItem(key, JSON.stringify(db));
    return hydrate(db, db.lessons.at(-1)!);
  },
  async remove(id) {
    const db = read();
    const row = db.lessons.find((l) => l.id === id);
    if (!row) return;
    const lesson = hydrate(db, row);
    await authorize(lesson);
    if (row.creator_id !== demoTeacher.id)
      throw new Error("You may only delete your own lessons.");
    localStorage.setItem(key, JSON.stringify(withoutLesson(db, id)));
  },
};
