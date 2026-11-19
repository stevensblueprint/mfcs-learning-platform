import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import {
  getStudentAnalytics,
  AuthorizationError,
} from "@/lib/server/teacher-dashboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUser(request);

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    if (user.role !== "TEACHER" && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Access forbidden: Teacher role required" },
        { status: 403 },
      );
    }

    const { id } = await params;
    const studentId = parseInt(id, 10);
    if (isNaN(studentId)) {
      return NextResponse.json(
        { error: "Invalid student ID parameter" },
        { status: 400 },
      );
    }

    const analytics = await getStudentAnalytics(user.id, studentId);
    return NextResponse.json(analytics);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Student analytics API error:", error);
    return NextResponse.json(
      { error: "Failed to load student analytics" },
      { status: 500 },
    );
  }
}
