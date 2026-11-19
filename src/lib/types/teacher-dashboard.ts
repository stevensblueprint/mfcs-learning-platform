import type { LessonStatus, LessonAttemptStatus } from "./database";

export * from "./database";

export interface TeacherClassSummary {
  id: number;
  name: string;
  studentCount: number;
}

export interface TeacherRecentLessonOverview {
  lessonId: number;
  weekNumber: number;
  title: string;
  assignedStudentCount: number;
  completedCount: number;
  notCompletedCount: number;
}

export interface TeacherDashboardLesson {
  id: number;
  title: string;
  weekNumber: number;
  status: LessonStatus;
  assignedClasses: { id: number; name: string }[];
  completionCount: number;
  totalAssigned: number;
  createdAt: string;
  updatedAt: string;
}

export interface TeacherDashboardStudent {
  id: number;
  displayName: string;
  email: string;
  classId: number;
  className: string;
  percentCompleted: number; // 0 to 100
  latestCompletedLessonTitle: string | null;
  latestCompletedAt: string | null;
}

export interface TeacherDashboardData {
  teacher: {
    id: number;
    displayName: string;
    email: string;
  };
  classes: TeacherClassSummary[];
  recentLessonOverview: TeacherRecentLessonOverview | null;
  lessons: TeacherDashboardLesson[];
  students: TeacherDashboardStudent[];
}

export interface StudentAnalyticsLessonItem {
  lessonId: number;
  lessonTitle: string;
  weekNumber: number;
  status: LessonAttemptStatus | "NOT_STARTED";
  latestScore: number | null;
  bestScore: number | null;
  attemptCount: number;
}

export interface StudentAnalyticsDetail {
  student: {
    id: number;
    displayName: string;
    classId: number;
    className: string;
    percentCompleted: number;
  };
  lessons: StudentAnalyticsLessonItem[];
}
