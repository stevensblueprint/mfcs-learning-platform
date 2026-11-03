export type Actor = { id: number; role: "TEACHER" | "ADMIN" | "STUDENT" };
export type SchoolClass = { id: number; name: string; teacher_id: number };
export const demoTeacher: Actor = { id: 1, role: "TEACHER" };
export const schoolClasses: SchoolClass[] = [
  { id: 1, name: "Beginner A", teacher_id: 1 },
  { id: 2, name: "Beginner B", teacher_id: 1 },
  { id: 3, name: "Intermediate", teacher_id: 2 },
];
export const classesFor = (actor: Actor) =>
  schoolClasses.filter(
    (c) =>
      actor.role === "ADMIN" ||
      (actor.role === "TEACHER" && c.teacher_id === actor.id),
  );
export const classes = classesFor(demoTeacher);
