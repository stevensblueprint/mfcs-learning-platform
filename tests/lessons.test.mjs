import { test } from "node:test";
import assert from "node:assert/strict";
import {
  blankLesson,
  blankVocabulary,
  blankQuestion,
  validateLesson,
  lessonRepository,
} from "../src/lib/lessons.ts";
import { classesFor } from "../src/lib/classes.ts";
import { isLesson } from "../src/lib/lesson-schema.ts";
import { selectLessons } from "../src/lib/lesson-display.ts";
const publishedLesson = () => {
  const lesson = blankLesson();
  const v = blankVocabulary(lesson.id);
  v.primary_meaning = "Hello";
  v.expressions[0].traditional_chinese = "你好";
  const q = blankQuestion(lesson.id);
  Object.assign(q, {
    concept_id: v.id,
    prompt: "Choose hello",
    correct_answer: "你好",
    options: ["你好", "再見"],
  });
  return {
    ...lesson,
    title: "Greetings",
    student_instructions: "Practice greetings",
    classIds: [1],
    vocabulary: [v],
    questions: [q],
  };
};
test("incomplete drafts can save but publishing needs title, classes, instructions, and questions", () => {
  const draft = blankLesson();
  assert.deepEqual(validateLesson(draft, false), []);
  assert.equal(validateLesson(draft, true).length, 4);
  assert.equal(isLesson(draft), true);
});
test("teacher class ownership and lesson ownership are enforced; admins have school-wide access", () => {
  const lesson = publishedLesson();
  lesson.classIds = [3];
  assert.match(validateLesson(lesson, false)[0], /own classes/);
  assert.deepEqual(validateLesson(lesson, false, { id: 9, role: "ADMIN" }), []);
  lesson.creator_id = 2;
  assert.match(validateLesson(lesson, false)[0], /own lessons/);
  assert.equal(classesFor({ id: 1, role: "TEACHER" }).length, 2);
  assert.equal(classesFor({ id: 9, role: "ADMIN" }).length, 3);
  assert.ok(validateLesson(lesson, false, { id: 3, role: "STUDENT" }).length);
});
test("schema rejects malformed nested data, noninteger weeks, and invalid question types", () => {
  const lesson = publishedLesson();
  assert.ok(isLesson(lesson));
  assert.equal(isLesson({ ...lesson, week_number: 1.5 }), false);
  assert.equal(
    isLesson({
      ...lesson,
      questions: [{ ...lesson.questions[0], question_type: "Multiple choice" }],
    }),
    false,
  );
  lesson.vocabulary[0].expressions[0].pronunciations = [null];
  assert.equal(isLesson(lesson), false);
});
test("validates references, required traditional Chinese, and language/romanization pairs", () => {
  const lesson = publishedLesson();
  assert.deepEqual(validateLesson(lesson, true), []);
  lesson.questions[0].concept_id = 99;
  assert.match(validateLesson(lesson, true)[0], /references/);
  lesson.questions[0].concept_id = null;
  const expression = lesson.vocabulary[0].expressions[0];
  expression.pronunciations = [
    {
      id: 900,
      expression_id: expression.id,
      language: "CANTONESE",
      romanization_system: "PINYIN",
      reading: "nei5 hou2",
      audio_s3_key: null,
    },
  ];
  assert.match(validateLesson(lesson, true)[0], /pronunciation systems/);
  expression.pronunciations[0].romanization_system = "JYUTPING";
  expression.traditional_chinese = "";
  assert.match(validateLesson(lesson, true)[0], /traditional Chinese/);
});
test("recognition requires a matching answer; writing and pronunciation use expected answers", () => {
  const lesson = publishedLesson();
  lesson.questions[0].correct_answer = "wrong";
  assert.ok(validateLesson(lesson, true).length);
  lesson.questions[0].question_type = "WRITING";
  lesson.questions[0].options = null;
  assert.deepEqual(validateLesson(lesson, true), []);
  lesson.questions[0].question_type = "PRONUNCIATION";
  assert.deepEqual(validateLesson(lesson, true), []);
});
test("normalized storage roundtrips relationships and ordering, rejects failed saves, and cascades deletion", async () => {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => store.set(k, v),
  };
  globalThis.fetch = async () => ({ ok: true });
  const lesson = publishedLesson();
  const second = blankVocabulary(lesson.id);
  second.primary_meaning = "Goodbye";
  second.expressions[0].traditional_chinese = "再見";
  lesson.vocabulary.unshift(second);
  await lessonRepository.save(lesson);
  await lessonRepository.save({ ...lesson, title: "Updated greetings" });
  const db = JSON.parse(store.get("mfcs.database.v2"));
  assert.equal(db.lessons.length, 1);
  assert.equal(db.lessons[0].vocabulary, undefined);
  assert.deepEqual(db.class_lessons, [{ class_id: 1, lesson_id: lesson.id }]);
  assert.equal(db.chinese_expressions[0].concept_id, second.id);
  const reopened = (await lessonRepository.list())[0];
  assert.equal(reopened.title, "Updated greetings");
  assert.deepEqual(
    reopened.vocabulary.map((v) => v.order_num),
    [0, 1],
  );
  assert.equal(reopened.questions[0].concept_id, lesson.vocabulary[1].id);
  globalThis.fetch = async () => ({
    ok: false,
    json: async () => ({ error: "Unauthorized class" }),
  });
  await assert.rejects(
    lessonRepository.save({ ...lesson, title: "Rejected" }),
    /Unauthorized/,
  );
  assert.equal((await lessonRepository.list())[0].title, "Updated greetings");
  globalThis.fetch = async () => ({ ok: true });
  await lessonRepository.remove(lesson.id);
  assert.deepEqual(await lessonRepository.list(), []);
  for (const [table, rows] of Object.entries(
    JSON.parse(store.get("mfcs.database.v2")),
  ))
    if (table !== "version") assert.equal(rows.length, 0, table);
});
test("sorts by creation rather than edits, by title, week, or class, and combines filters", () => {
  const a = {
    ...blankLesson(),
    title: "Zebra",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-11-01T00:00:00Z",
    classIds: [1],
    week_number: 2,
  };
  const b = {
    ...blankLesson(),
    title: "Apple",
    created_at: "2026-02-01T00:00:00Z",
    classIds: [2],
    week_number: 1,
    status: "PUBLISHED",
  };
  const options = {
    search: "",
    status: "All lessons",
    classId: "all",
    sort: "newest",
  };
  const list = [a, b];
  assert.deepEqual(
    selectLessons(list, options).map((l) => l.title),
    ["Apple", "Zebra"],
  );
  assert.equal(selectLessons(list, { ...options, sort: "oldest" })[0], a);
  assert.equal(selectLessons(list, { ...options, sort: "alphabetical" })[0], b);
  assert.equal(selectLessons(list, { ...options, sort: "week" })[0], b);
  assert.equal(selectLessons(list, { ...options, sort: "class" })[0], a);
  assert.deepEqual(
    selectLessons(list, {
      ...options,
      classId: "2",
      status: "PUBLISHED",
      search: "APP",
    }),
    [b],
  );
  assert.equal(
    selectLessons(list, { ...options, classId: "unassigned" }).length,
    0,
  );
  assert.equal(list[0], a);
});
