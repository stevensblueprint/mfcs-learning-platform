import assert from "node:assert/strict";
import test from "node:test";
import {
  latestCompleted,
  latestPublished,
  lessonCompletion,
  mockLessons,
  mockStudents,
  percentComplete,
} from "../src/lib/mock-teacher-dashboard.ts";

test("overview uses the newest published lesson and its counts add up", () => {
  const lesson = latestPublished(mockLessons);
  assert.equal(lesson.title, "Food Vocabulary");
  assert.deepEqual(lessonCompletion(lesson), {
    assigned: 18,
    completed: 13,
    notCompleted: 5,
  });
});

test("student progress is derived from their lesson results", () => {
  const lily = mockStudents.find((s) => s.name === "Lily");
  assert.equal(percentComplete(lily), 33);
  assert.equal(latestCompleted(lily).title, "Numbers 1 to 10");
  const mia = mockStudents.find((s) => s.name === "Mia");
  assert.equal(percentComplete(mia), 100);
  assert.equal(latestCompleted(mia).title, "Food Vocabulary");
});

test("a draft copy with no results reports nothing completed", () => {
  const copy = { ...latestPublished(mockLessons), id: 99, status: "DRAFT" };
  assert.equal(lessonCompletion(copy).completed, 0);
});
