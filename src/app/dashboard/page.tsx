import TeacherDashboard from "@/components/TeacherDashboard";

export const metadata = {
  title: "Teacher Dashboard",
};

export default function DashboardPage() {
  // TODO: If student is logging in, show the student dashboard.

  // Else show the teacher dashboard.
  return <TeacherDashboard />;
}
