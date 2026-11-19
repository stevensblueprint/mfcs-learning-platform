import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import {
  getTeacherDashboardData,
  AuthorizationError,
} from "@/lib/server/teacher-dashboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
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

    const data = await getTeacherDashboardData(user.id);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Teacher dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 },
    );
  }
}
