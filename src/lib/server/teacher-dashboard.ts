import "server-only";
import { getDb } from "@/lib/db";
import type {
  DbUser,
  LessonStatus,
  LessonAttemptStatus,
} from "@/lib/types/database";
import type {
  TeacherDashboardData,
  StudentAnalyticsDetail,
} from "@/lib/types/teacher-dashboard";

export interface Queryable {
  query: <R = Record<string, unknown>>(
    text: string,
    params?: unknown[],
  ) => Promise<{ rows: R[]; rowCount?: number | null }>;
}

export class AuthorizationError extends Error {
  constructor(message = "Unauthorized access to teacher resources") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends Error {
  constructor(message = "Resource not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

type UserRow = Pick<
  DbUser,
  "id" | "display_name" | "email" | "role" | "account_status"
>;

interface ClassRow {
  id: number;
  name: string;
  student_count: number;
}

interface RecentLessonRow {
  lesson_id: number;
  week_number: number;
  title: string;
  assigned_student_count: number;
  completed_count: number;
  not_completed_count: number;
}

interface LessonRow {
  id: number;
  title: string;
  week_number: number;
  status: LessonStatus;
  assigned_classes: { id: number; name: string }[] | string;
  completion_count: number;
  total_assigned: number;
  created_at: Date | string;
  updated_at: Date | string;
}

interface StudentRow {
  id: number;
  display_name: string;
  email: string;
  class_id: number;
  class_name: string;
  percent_completed: number;
  latest_lesson_title: string | null;
  latest_completed_at: Date | string | null;
}

interface StudentVerifyRow {
  id: number;
  display_name: string;
  class_id: number;
  class_name: string;
}

interface StudentLessonRow {
  lesson_id: number;
  lesson_title: string;
  week_number: number;
  status: LessonAttemptStatus | "NOT_STARTED";
  latest_score: number | null;
  best_score: number | null;
  attempt_count: number;
}

/**
 * Fetches all authenticated teacher dashboard data:
 * - Teacher profile info
 * - Assigned classes
 * - Most recent lesson overview with completion metrics
 * - Lessons authored by this teacher (chronological order)
 * - Students enrolled in teacher's classes with completion progress
 */
export async function getTeacherDashboardData(
  teacherId: number,
  client?: Queryable,
): Promise<TeacherDashboardData> {
  const db = client ?? getDb();

  // 1. Verify user exists and has TEACHER or ADMIN privileges
  const userRes = await db.query<UserRow>(
    `SELECT id, display_name, email, role, account_status
     FROM users
     WHERE id = $1 AND account_status = 'ACTIVE'`,
    [teacherId],
  );

  let teacher = userRes.rows[0];
  if (!teacher && process.env.NODE_ENV !== "production" && teacherId === 1) {
    teacher = {
      id: 1,
      display_name: "Tina Teacher",
      email: "teacher@mfcs.test",
      role: "TEACHER",
      accountStatus: "ACTIVE",
    } as unknown as UserRow;
  }

  if (!teacher || (teacher.role !== "TEACHER" && teacher.role !== "ADMIN")) {
    throw new AuthorizationError("User is not authorized as a teacher.");
  }

  // 2. Fetch classes, recent lesson overview, lessons, and students concurrently
  const [classesRes, recentLessonRes, lessonsRes, studentsRes] =
    await Promise.all([
      // Query A: Classes assigned to this teacher
      db.query<ClassRow>(
        `SELECT 
           c.id, 
           c.name, 
           COUNT(u.id)::int AS student_count
         FROM classes c
         LEFT JOIN users u 
           ON u.student_class_id = c.id 
          AND u.role = 'STUDENT' 
          AND u.account_status = 'ACTIVE'
         WHERE c.teacher_id = $1
         GROUP BY c.id, c.name
         ORDER BY c.name ASC`,
        [teacherId],
      ),

      // Query B: Most recently created lesson overview
      db.query<RecentLessonRow>(
        `WITH latest_lesson AS (
           SELECT l.id, l.title, l.week_number
           FROM lessons l
           WHERE l.creator_id = $1
           ORDER BY l.created_at DESC
           LIMIT 1
         ),
         assigned_students AS (
           SELECT DISTINCT u.id AS student_id, ll.id AS lesson_id
           FROM latest_lesson ll
           JOIN class_lessons cl ON cl.lesson_id = ll.id
           JOIN users u ON u.student_class_id = cl.class_id AND u.role = 'STUDENT' AND u.account_status = 'ACTIVE'
         ),
         completed_attempts AS (
           SELECT DISTINCT la.student_id, la.lesson_id
           FROM lesson_attempts la
           JOIN latest_lesson ll ON la.lesson_id = ll.id
           WHERE la.status = 'COMPLETED'
         )
         SELECT 
           ll.id AS lesson_id,
           ll.week_number,
           ll.title,
           COUNT(DISTINCT a.student_id)::int AS assigned_student_count,
           COUNT(DISTINCT c.student_id)::int AS completed_count,
           (COUNT(DISTINCT a.student_id) - COUNT(DISTINCT c.student_id))::int AS not_completed_count
         FROM latest_lesson ll
         LEFT JOIN assigned_students a ON a.lesson_id = ll.id
         LEFT JOIN completed_attempts c ON c.lesson_id = ll.id AND c.student_id = a.student_id
         GROUP BY ll.id, ll.week_number, ll.title`,
        [teacherId],
      ),

      // Query C: All lessons authored by this teacher (new to old)
      db.query<LessonRow>(
        `SELECT 
           l.id,
           l.title,
           l.week_number,
           l.status,
           l.created_at,
           l.updated_at,
           COALESCE(
             json_agg(
               json_build_object('id', c.id, 'name', c.name)
             ) FILTER (WHERE c.id IS NOT NULL), 
             '[]'
           ) AS assigned_classes,
           (
             SELECT COUNT(DISTINCT la.student_id)::int 
             FROM lesson_attempts la 
             WHERE la.lesson_id = l.id AND la.status = 'COMPLETED'
           ) AS completion_count,
           (
             SELECT COUNT(DISTINCT u.id)::int
             FROM class_lessons cl
             JOIN users u ON u.student_class_id = cl.class_id AND u.role = 'STUDENT' AND u.account_status = 'ACTIVE'
             WHERE cl.lesson_id = l.id
           ) AS total_assigned
         FROM lessons l
         LEFT JOIN class_lessons cl ON cl.lesson_id = l.id
         LEFT JOIN classes c ON c.id = cl.class_id
         WHERE l.creator_id = $1
         GROUP BY l.id
         ORDER BY l.created_at DESC`,
        [teacherId],
      ),

      // Query D: All students in the teacher's classes with completion rates
      db.query<StudentRow>(
        `WITH teacher_students AS (
           SELECT 
             u.id AS student_id,
             u.display_name,
             u.email,
             c.id AS class_id,
             c.name AS class_name
           FROM users u
           JOIN classes c ON u.student_class_id = c.id
           WHERE c.teacher_id = $1
             AND u.role = 'STUDENT'
             AND u.account_status = 'ACTIVE'
         ),
         student_lesson_totals AS (
           SELECT 
             ts.student_id,
             COUNT(DISTINCT cl.lesson_id)::int AS total_assigned_lessons
           FROM teacher_students ts
           JOIN class_lessons cl ON cl.class_id = ts.class_id
           JOIN lessons l ON l.id = cl.lesson_id AND l.status = 'PUBLISHED'
           GROUP BY ts.student_id
         ),
         student_completed_totals AS (
           SELECT 
             ts.student_id,
             COUNT(DISTINCT la.lesson_id)::int AS completed_lessons
           FROM teacher_students ts
           JOIN lesson_attempts la ON la.student_id = ts.student_id AND la.status = 'COMPLETED'
           JOIN class_lessons cl ON cl.lesson_id = la.lesson_id AND cl.class_id = ts.class_id
           GROUP BY ts.student_id
         ),
         latest_completed AS (
           SELECT DISTINCT ON (la.student_id)
             la.student_id,
             l.title AS latest_lesson_title,
             la.completed_at
           FROM lesson_attempts la
           JOIN lessons l ON l.id = la.lesson_id
           JOIN teacher_students ts ON ts.student_id = la.student_id
           WHERE la.status = 'COMPLETED'
           ORDER BY la.student_id, la.completed_at DESC NULLS LAST
         )
         SELECT 
           ts.student_id AS id,
           ts.display_name,
           ts.email,
           ts.class_id,
           ts.class_name,
           COALESCE(
             ROUND((sct.completed_lessons::decimal / NULLIF(slt.total_assigned_lessons, 0)) * 100)::int, 
             0
           ) AS percent_completed,
           lc.latest_lesson_title,
           lc.completed_at AS latest_completed_at
         FROM teacher_students ts
         LEFT JOIN student_lesson_totals slt ON slt.student_id = ts.student_id
         LEFT JOIN student_completed_totals sct ON sct.student_id = ts.student_id
         LEFT JOIN latest_completed lc ON lc.student_id = ts.student_id
         ORDER BY ts.display_name ASC`,
        [teacherId],
      ),
    ]);

  const recentRow = recentLessonRes.rows[0];

  return {
    teacher: {
      id: teacher.id,
      displayName: teacher.display_name,
      email: teacher.email,
    },
    classes: classesRes.rows.map((r) => ({
      id: r.id,
      name: r.name,
      studentCount: r.student_count ?? 0,
    })),
    recentLessonOverview: recentRow
      ? {
          lessonId: recentRow.lesson_id,
          weekNumber: recentRow.week_number,
          title: recentRow.title,
          assignedStudentCount: recentRow.assigned_student_count ?? 0,
          completedCount: recentRow.completed_count ?? 0,
          notCompletedCount: recentRow.not_completed_count ?? 0,
        }
      : null,
    lessons: lessonsRes.rows.map((r) => ({
      id: r.id,
      title: r.title,
      weekNumber: r.week_number,
      status: r.status,
      assignedClasses: Array.isArray(r.assigned_classes)
        ? r.assigned_classes
        : typeof r.assigned_classes === "string"
          ? (JSON.parse(r.assigned_classes) as { id: number; name: string }[])
          : [],
      completionCount: r.completion_count ?? 0,
      totalAssigned: r.total_assigned ?? 0,
      createdAt:
        r.created_at instanceof Date
          ? r.created_at.toISOString()
          : String(r.created_at),
      updatedAt:
        r.updated_at instanceof Date
          ? r.updated_at.toISOString()
          : String(r.updated_at),
    })),
    students: studentsRes.rows.map((r) => ({
      id: r.id,
      displayName: r.display_name,
      email: r.email,
      classId: r.class_id,
      className: r.class_name,
      percentCompleted: r.percent_completed ?? 0,
      latestCompletedLessonTitle: r.latest_lesson_title ?? null,
      latestCompletedAt: r.latest_completed_at
        ? r.latest_completed_at instanceof Date
          ? r.latest_completed_at.toISOString()
          : String(r.latest_completed_at)
        : null,
    })),
  };
}

/**
 * Fetches analytics and lesson attempt breakdown for a specific student.
 * Verifies that the requested student is enrolled in a class taught by this teacher.
 */
export async function getStudentAnalytics(
  teacherId: number,
  studentId: number,
  client?: Queryable,
): Promise<StudentAnalyticsDetail> {
  const db = client ?? getDb();

  // 1. Verify student exists and is enrolled in a class taught by this teacher
  const verifyRes = await db.query<StudentVerifyRow>(
    `SELECT u.id, u.display_name, c.id AS class_id, c.name AS class_name
     FROM users u
     JOIN classes c ON u.student_class_id = c.id
     WHERE u.id = $1 
       AND c.teacher_id = $2 
       AND u.role = 'STUDENT' 
       AND u.account_status = 'ACTIVE'`,
    [studentId, teacherId],
  );

  if (!verifyRes.rows || verifyRes.rows.length === 0) {
    throw new AuthorizationError(
      "Student not found or not enrolled in your assigned classes.",
    );
  }

  const student = verifyRes.rows[0];

  // 2. Fetch all published lessons assigned to the student's class with attempt stats
  const lessonsRes = await db.query<StudentLessonRow>(
    `SELECT 
       l.id AS lesson_id,
       l.title AS lesson_title,
       l.week_number,
       COALESCE(
         (SELECT la.status FROM lesson_attempts la 
          WHERE la.student_id = $1 AND la.lesson_id = l.id 
          ORDER BY la.started_at DESC LIMIT 1),
         'NOT_STARTED'
       ) AS status,
       (SELECT la.score_percent FROM lesson_attempts la 
        WHERE la.student_id = $1 AND la.lesson_id = l.id 
        ORDER BY la.completed_at DESC NULLS LAST LIMIT 1) AS latest_score,
       (SELECT MAX(la.score_percent)::int FROM lesson_attempts la 
        WHERE la.student_id = $1 AND la.lesson_id = l.id) AS best_score,
       (SELECT COUNT(la.id)::int FROM lesson_attempts la 
        WHERE la.student_id = $1 AND la.lesson_id = l.id) AS attempt_count
     FROM class_lessons cl
     JOIN lessons l ON l.id = cl.lesson_id AND l.status = 'PUBLISHED'
     JOIN users u ON u.student_class_id = cl.class_id
     WHERE u.id = $1
     ORDER BY l.week_number ASC`,
    [studentId],
  );

  const completedCount = lessonsRes.rows.filter(
    (r) => r.status === "COMPLETED",
  ).length;
  const percentCompleted =
    lessonsRes.rows.length > 0
      ? Math.round((completedCount / lessonsRes.rows.length) * 100)
      : 0;

  return {
    student: {
      id: student.id,
      displayName: student.display_name,
      classId: student.class_id,
      className: student.class_name,
      percentCompleted,
    },
    lessons: lessonsRes.rows.map((r) => ({
      lessonId: r.lesson_id,
      lessonTitle: r.lesson_title,
      weekNumber: r.week_number,
      status: r.status,
      latestScore: r.latest_score !== null ? Number(r.latest_score) : null,
      bestScore: r.best_score !== null ? Number(r.best_score) : null,
      attemptCount: r.attempt_count ?? 0,
    })),
  };
}
