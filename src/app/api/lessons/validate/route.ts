import { NextResponse } from "next/server";
import { validateLesson } from "@/lib/lessons";
import { isLesson } from "@/lib/lesson-schema";
import { demoTeacher } from "@/lib/classes";
export async function POST(request: Request) {
  try {
    const lesson: unknown = await request.json();
    if (!isLesson(lesson))
      return NextResponse.json(
        { error: "Invalid lesson data." },
        { status: 400 },
      );
    // Fixed demo identity, never accepted from the request body. Replace with a verified session.
    const errors = validateLesson(
      lesson,
      lesson.status === "PUBLISHED",
      demoTeacher,
    );
    if (errors.length)
      return NextResponse.json({ error: errors.join(" ") }, { status: 422 });
    return NextResponse.json({ valid: true });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
