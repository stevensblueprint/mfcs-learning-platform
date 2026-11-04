// Made-up presentation data for the teacher dashboard mockup.
// Nothing here reads or writes real records. Replace when MFCS-18 connects to the backend.
export type MockLessonStatus = "DRAFT" | "PUBLISHED";

export type MockLesson = {
  id: number;
  title: string;
  chinese: string;
  week: number;
  status: MockLessonStatus;
  classes: string[];
  createdAt: string;
};

export type MockResult = {
  status: "Completed" | "In progress" | "Not started";
  latest: number | null;
  best: number | null;
  attempts: number;
};

export type MockStudent = {
  id: number;
  name: string;
  className: string;
  results: Record<number, MockResult>;
};

export const teacherName = "Ms. Zhou";
export const classNames = ["Beginner A", "Beginner B"];

const NUMBERS = 1;
const FAMILY = 2;
const FOOD = 3;

export const mockLessons: MockLesson[] = [
  {
    id: 4,
    title: "Colors",
    chinese: "顏色",
    week: 8,
    status: "DRAFT",
    classes: [],
    createdAt: "2026-10-31T15:00:00.000Z",
  },
  {
    id: FOOD,
    title: "Food Vocabulary",
    chinese: "食物",
    week: 7,
    status: "PUBLISHED",
    classes: classNames,
    createdAt: "2026-10-24T15:00:00.000Z",
  },
  {
    id: FAMILY,
    title: "My Family",
    chinese: "家人",
    week: 6,
    status: "PUBLISHED",
    classes: classNames,
    createdAt: "2026-10-17T15:00:00.000Z",
  },
  {
    id: NUMBERS,
    title: "Numbers 1 to 10",
    chinese: "數字",
    week: 5,
    status: "PUBLISHED",
    classes: classNames,
    createdAt: "2026-10-10T15:00:00.000Z",
  },
];

const done = (latest: number, best = latest, attempts = 1): MockResult => ({
  status: "Completed",
  latest,
  best,
  attempts,
});
const started: MockResult = {
  status: "In progress",
  latest: null,
  best: null,
  attempts: 1,
};
const none: MockResult = {
  status: "Not started",
  latest: null,
  best: null,
  attempts: 0,
};

function student(
  id: number,
  name: string,
  className: string,
  numbers: MockResult,
  family: MockResult,
  food: MockResult,
): MockStudent {
  return {
    id,
    name,
    className,
    results: { [NUMBERS]: numbers, [FAMILY]: family, [FOOD]: food },
  };
}

const [A, B] = classNames;

export const mockStudents: MockStudent[] = [
  student(1, "Mia Chen", A, done(95), done(90), done(100)),
  student(2, "Ethan Wong", A, done(80, 85, 2), done(75), done(85)),
  student(3, "Chloe Lin", A, done(100), done(95), done(90)),
  student(4, "Lucas Huang", A, done(70), done(85, 85, 2), done(75)),
  student(5, "Emma Lau", A, done(90), done(100), done(95)),
  student(6, "Ryan Zhang", A, done(65, 70, 3), done(70), started),
  student(7, "Sophie Ho", A, done(85), done(80), done(90, 90, 2)),
  student(8, "Nathan Liu", A, done(90), done(70, 75, 2), done(80)),
  student(9, "Olivia Tam", A, done(75), done(80), none),
  student(10, "Jason Wu", A, done(60), started, none),
  student(11, "Ava Cheung", B, done(100), done(100), done(95)),
  student(12, "Leo Yip", B, done(85), done(90), done(70, 80, 2)),
  student(13, "Grace Fung", B, done(95), done(85), done(90)),
  student(14, "Kevin Ma", B, done(70), done(65, 70, 2), started),
  student(15, "Hannah Li", B, done(90), done(95), done(100)),
  student(16, "Aiden Kwok", B, done(75), done(80), done(85)),
  student(17, "Zoe Tsai", B, done(85), done(90), done(80)),
  student(18, "Lily Zhao", B, done(55), none, none),
];

export function lessonCompletion(
  lesson: MockLesson,
  students: MockStudent[] = mockStudents,
) {
  const assigned = students.filter((s) => lesson.classes.includes(s.className));
  const completed = assigned.filter(
    (s) => s.results[lesson.id]?.status === "Completed",
  ).length;
  return {
    assigned: assigned.length,
    completed,
    notCompleted: assigned.length - completed,
  };
}

export function latestPublished(lessons: MockLesson[]): MockLesson | undefined {
  return [...lessons]
    .filter((lesson) => lesson.status === "PUBLISHED")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}

const publishedLessons = mockLessons.filter((l) => l.status === "PUBLISHED");

export function percentComplete(student: MockStudent): number {
  const completed = publishedLessons.filter(
    (lesson) => student.results[lesson.id]?.status === "Completed",
  ).length;
  return Math.round((completed / publishedLessons.length) * 100);
}

export function latestCompleted(student: MockStudent): MockLesson | undefined {
  return publishedLessons
    .filter((lesson) => student.results[lesson.id]?.status === "Completed")
    .sort((a, b) => b.week - a.week)[0];
}

export function assignedLessons(student: MockStudent): MockLesson[] {
  return publishedLessons
    .filter((lesson) => lesson.classes.includes(student.className))
    .sort((a, b) => b.week - a.week);
}
