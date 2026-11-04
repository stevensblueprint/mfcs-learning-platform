import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createBasicDemoLessons,
  retiredDemoIds,
} from "../src/lib/demo-lessons.ts";
import { isLesson } from "../src/lib/lesson-schema.ts";
import { validateLesson, lessonRepository } from "../src/lib/lessons.ts";

test("demo fixtures contain one basic draft and one publishable lesson", () => {
  const lessons = createBasicDemoLessons();
  assert.deepEqual(lessons.map((lesson) => lesson.status).sort(), [
    "DRAFT",
    "PUBLISHED",
  ]);
  for (const lesson of lessons) {
    assert.ok(isLesson(lesson));
    assert.deepEqual(validateLesson(lesson, lesson.status === "PUBLISHED"), []);
    assert.equal(lesson.vocabulary.length, 1);
    assert.equal(lesson.questions.length, 1);
  }
});

test("demo migration removes old sample dependencies, preserves authored lessons, and respects later deletions", async (t) => {
  const previousStorage = globalThis.localStorage;
  const previousFetch = globalThis.fetch;
  const previousFlag = process.env.NEXT_PUBLIC_MFCS_DEMO_DATA;
  t.after(() => {
    globalThis.localStorage = previousStorage;
    globalThis.fetch = previousFetch;
    if (previousFlag === undefined)
      delete process.env.NEXT_PUBLIC_MFCS_DEMO_DATA;
    else process.env.NEXT_PUBLIC_MFCS_DEMO_DATA = previousFlag;
  });
  const row = Object.fromEntries(
    Object.entries(createBasicDemoLessons()[0]).filter(
      ([key]) => !["vocabulary", "questions", "classIds"].includes(key),
    ),
  );
  const database = {
    version: 2,
    lessons: [
      { ...row, id: 42, title: "My own lesson", status: "DRAFT" },
      ...retiredDemoIds.map((id) => ({ ...row, id })),
    ],
    class_lessons: retiredDemoIds.map((id) => ({ class_id: 1, lesson_id: id })),
    vocabulary_concepts: retiredDemoIds.map((id) => ({
      id: id + 1,
      lesson_id: id,
      order_num: 0,
      primary_meaning: "Old sample",
      context_notes: null,
    })),
    chinese_expressions: retiredDemoIds.map((id) => ({
      id: id + 2,
      concept_id: id + 1,
      traditional_chinese: "你",
      simplified_chinese: null,
    })),
    pronunciations: retiredDemoIds.map((id) => ({
      id: id + 3,
      expression_id: id + 2,
      language: "MANDARIN",
      romanization_system: "PINYIN",
      reading: "nǐ",
      audio_s3_key: null,
    })),
    example_sentences: retiredDemoIds.map((id) => ({
      id: id + 4,
      concept_id: id + 1,
      traditional_chinese: "你好",
      simplified_chinese: null,
      english_translation: "Hello",
    })),
    questions: retiredDemoIds.map((id) => ({
      id: id + 5,
      lesson_id: id,
      concept_id: id + 1,
      question_type: "WRITING",
      order_num: 0,
      prompt: "Old sample",
      correct_answer: "你",
      options: null,
    })),
  };
  const storage = new Map([["mfcs.database.v2", JSON.stringify(database)]]);
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  };
  globalThis.fetch = async () => ({ ok: true });
  process.env.NEXT_PUBLIC_MFCS_DEMO_DATA = "true";
  const lessons = await lessonRepository.list();
  assert.equal(lessons.length, 3);
  assert.ok(
    lessons.some(
      (lesson) => lesson.id === 42 && lesson.title === "My own lesson",
    ),
  );
  const migrated = JSON.parse(storage.get("mfcs.database.v2"));
  for (const id of retiredDemoIds) {
    assert.ok(!migrated.lessons.some((lesson) => lesson.id === id));
    assert.ok(
      !migrated.class_lessons.some((assignment) => assignment.lesson_id === id),
    );
    assert.ok(
      !migrated.vocabulary_concepts.some((concept) => concept.lesson_id === id),
    );
    assert.ok(
      !migrated.chinese_expressions.some(
        (expression) => expression.concept_id === id + 1,
      ),
    );
    assert.ok(
      !migrated.pronunciations.some(
        (pronunciation) => pronunciation.expression_id === id + 2,
      ),
    );
    assert.ok(
      !migrated.example_sentences.some(
        (example) => example.concept_id === id + 1,
      ),
    );
    assert.ok(
      !migrated.questions.some((question) => question.lesson_id === id),
    );
  }
  assert.equal((await lessonRepository.list()).length, 3);
  await lessonRepository.remove(9_000_000);
  assert.deepEqual(
    (await lessonRepository.list()).map((lesson) => lesson.id).sort(),
    [42, 9_010_000],
  );
});
