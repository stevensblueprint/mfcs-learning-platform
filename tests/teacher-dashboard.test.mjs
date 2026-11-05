import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getTeacherDashboardData,
  getStudentAnalytics,
  AuthorizationError,
} from "../src/lib/server/teacher-dashboard.ts";

test("teacher dashboard rejects unauthorized user roles", async () => {
  const mockDb = {
    async query(sql) {
      if (sql.includes("WHERE id = $1 AND account_status = 'ACTIVE'")) {
        return {
          rows: [
            {
              id: 99,
              display_name: "Sneaky Student",
              email: "student@mfcs.test",
              role: "STUDENT",
              account_status: "ACTIVE",
            },
          ],
        };
      }
      return { rows: [] };
    },
  };

  await assert.rejects(
    getTeacherDashboardData(99, mockDb),
    /User is not authorized as a teacher/,
  );
});

test("teacher dashboard loads scoped classes, lessons, and students with metrics", async () => {
  const teacherId = 1;

  const mockDb = {
    async query(sql, params) {
      // 1. User check
      if (sql.includes("WHERE id = $1 AND account_status = 'ACTIVE'")) {
        assert.equal(params[0], teacherId);
        return {
          rows: [
            {
              id: teacherId,
              display_name: "Tina Teacher",
              email: "teacher@mfcs.test",
              role: "TEACHER",
              account_status: "ACTIVE",
            },
          ],
        };
      }

      // 2. Classes query
      if (sql.includes("FROM classes c")) {
        assert.equal(params[0], teacherId);
        return {
          rows: [
            { id: 10, name: "Beginner A", student_count: 12 },
            { id: 20, name: "Beginner B", student_count: 8 },
          ],
        };
      }

      // 3. Recent lesson overview query
      if (sql.includes("latest_lesson AS")) {
        assert.equal(params[0], teacherId);
        return {
          rows: [
            {
              lesson_id: 101,
              week_number: 7,
              title: "Food Vocabulary",
              assigned_student_count: 18,
              completed_count: 13,
              not_completed_count: 5,
            },
          ],
        };
      }

      // 4. Lessons list query
      if (sql.includes("FROM lessons l")) {
        assert.equal(params[0], teacherId);
        return {
          rows: [
            {
              id: 101,
              title: "Food Vocabulary",
              week_number: 7,
              status: "PUBLISHED",
              assigned_classes: [{ id: 10, name: "Beginner A" }],
              completion_count: 13,
              total_assigned: 18,
              created_at: new Date("2026-10-01T10:00:00Z"),
              updated_at: new Date("2026-10-02T10:00:00Z"),
            },
            {
              id: 100,
              title: "Family Members",
              week_number: 6,
              status: "DRAFT",
              assigned_classes: [],
              completion_count: 0,
              total_assigned: 0,
              created_at: new Date("2026-09-20T10:00:00Z"),
              updated_at: new Date("2026-09-20T10:00:00Z"),
            },
          ],
        };
      }

      // 5. Students list query
      if (sql.includes("teacher_students AS")) {
        assert.equal(params[0], teacherId);
        return {
          rows: [
            {
              id: 501,
              display_name: "Alice Wang",
              email: "alice@mfcs.test",
              class_id: 10,
              class_name: "Beginner A",
              percent_completed: 85,
              latest_lesson_title: "Food Vocabulary",
              latest_completed_at: new Date("2026-10-03T15:30:00Z"),
            },
          ],
        };
      }

      return { rows: [] };
    },
  };

  const data = await getTeacherDashboardData(teacherId, mockDb);

  assert.equal(data.teacher.displayName, "Tina Teacher");
  assert.equal(data.classes.length, 2);
  assert.equal(data.classes[0].name, "Beginner A");
  assert.equal(data.recentLessonOverview?.title, "Food Vocabulary");
  assert.equal(data.recentLessonOverview?.assignedStudentCount, 18);
  assert.equal(data.recentLessonOverview?.completedCount, 13);
  assert.equal(data.recentLessonOverview?.notCompletedCount, 5);

  assert.equal(data.lessons.length, 2);
  assert.equal(data.lessons[0].title, "Food Vocabulary");
  assert.equal(data.lessons[0].completionCount, 13);
  assert.equal(data.lessons[1].status, "DRAFT");

  assert.equal(data.students.length, 1);
  assert.equal(data.students[0].displayName, "Alice Wang");
  assert.equal(data.students[0].percentCompleted, 85);
  assert.equal(data.students[0].latestCompletedLessonTitle, "Food Vocabulary");
});

test("teacher dashboard handles empty data state gracefully", async () => {
  const teacherId = 2;
  const mockDb = {
    async query(sql) {
      if (sql.includes("WHERE id = $1 AND account_status = 'ACTIVE'")) {
        return {
          rows: [
            {
              id: teacherId,
              display_name: "New Teacher",
              email: "new@mfcs.test",
              role: "TEACHER",
              account_status: "ACTIVE",
            },
          ],
        };
      }
      return { rows: [] };
    },
  };

  const data = await getTeacherDashboardData(teacherId, mockDb);
  assert.equal(data.teacher.displayName, "New Teacher");
  assert.deepEqual(data.classes, []);
  assert.equal(data.recentLessonOverview, null);
  assert.deepEqual(data.lessons, []);
  assert.deepEqual(data.students, []);
});

test("student analytics verifies student belongs to teacher's class", async () => {
  const teacherId = 1;
  const unauthorizedStudentId = 999;

  const mockDb = {
    async query() {
      // Verification check returns no rows
      return { rows: [], rowCount: 0 };
    },
  };

  await assert.rejects(
    getStudentAnalytics(teacherId, unauthorizedStudentId, mockDb),
    AuthorizationError,
  );
});

test("student analytics returns lesson progress and attempts for authorized student", async () => {
  const teacherId = 1;
  const studentId = 501;

  const mockDb = {
    async query(sql) {
      if (sql.includes("FROM users u")) {
        return {
          rows: [
            {
              id: studentId,
              display_name: "Alice Wang",
              class_id: 10,
              class_name: "Beginner A",
            },
          ],
          rowCount: 1,
        };
      }

      if (sql.includes("FROM class_lessons cl")) {
        return {
          rows: [
            {
              lesson_id: 101,
              lesson_title: "Food Vocabulary",
              week_number: 7,
              status: "COMPLETED",
              latest_score: 95,
              best_score: 95,
              attempt_count: 2,
            },
            {
              lesson_id: 102,
              lesson_title: "Animals",
              week_number: 8,
              status: "NOT_STARTED",
              latest_score: null,
              best_score: null,
              attempt_count: 0,
            },
          ],
          rowCount: 2,
        };
      }

      return { rows: [] };
    },
  };

  const analytics = await getStudentAnalytics(teacherId, studentId, mockDb);
  assert.equal(analytics.student.displayName, "Alice Wang");
  assert.equal(analytics.student.className, "Beginner A");
  assert.equal(analytics.student.percentCompleted, 50); // 1 of 2 completed
  assert.equal(analytics.lessons.length, 2);
  assert.equal(analytics.lessons[0].status, "COMPLETED");
  assert.equal(analytics.lessons[0].bestScore, 95);
  assert.equal(analytics.lessons[1].status, "NOT_STARTED");
});

import { GET as getTeacherDashboardRoute } from "../src/app/api/teacher/dashboard/route.ts";
import { GET as getStudentAnalyticsRoute } from "../src/app/api/teacher/students/[id]/route.ts";

test("GET /api/teacher/dashboard returns 403 when called by student", async () => {
  const request = new Request("http://localhost/api/teacher/dashboard", {
    headers: {
      "x-user-id": "99",
      "x-user-role": "STUDENT",
    },
  });

  const response = await getTeacherDashboardRoute(request);
  assert.equal(response.status, 403);
  const data = await response.json();
  assert.match(data.error, /Teacher role required/);
});

test("GET /api/teacher/students/[id] rejects invalid student ID with 400", async () => {
  const request = new Request("http://localhost/api/teacher/students/invalid", {
    headers: {
      "x-user-id": "1",
      "x-user-role": "TEACHER",
    },
  });

  const response = await getStudentAnalyticsRoute(request, {
    params: Promise.resolve({ id: "not-a-number" }),
  });
  assert.equal(response.status, 400);
  const data = await response.json();
  assert.match(data.error, /Invalid student ID parameter/);
});
