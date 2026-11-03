import type { Lesson } from "./lessons";
import { classes } from "./classes";
export type LessonSort =
  "newest" | "oldest" | "alphabetical" | "class" | "week";
export function selectLessons(
  lessons: Lesson[],
  options: {
    search: string;
    status: string;
    classId: string;
    sort: LessonSort;
  },
): Lesson[] {
  const className = (lesson: Lesson) =>
    lesson.classIds
      .map((id) => classes.find((c) => c.id === id)?.name ?? "")
      .sort()
      .join(", ") || "\uffff";
  return lessons
    .filter(
      (l) =>
        (options.status === "All lessons" || l.status === options.status) &&
        l.title.toLowerCase().includes(options.search.trim().toLowerCase()) &&
        (options.classId === "all" ||
          (options.classId === "unassigned"
            ? !l.classIds.length
            : l.classIds.includes(Number(options.classId)))),
    )
    .sort((a, b) => {
      const chronological = Date.parse(b.created_at) - Date.parse(a.created_at);
      switch (options.sort) {
        case "newest":
          return chronological || b.id - a.id;
        case "oldest":
          return -chronological || a.id - b.id;
        case "alphabetical":
          return a.title.localeCompare(b.title) || chronological;
        case "class":
          return className(a).localeCompare(className(b)) || chronological;
        case "week":
          return a.week_number - b.week_number || chronological;
      }
    });
}
