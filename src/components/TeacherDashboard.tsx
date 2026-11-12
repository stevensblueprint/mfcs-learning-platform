"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getSessionSnapshot, parseSession } from "@/lib/mockAuth";
import type {
  TeacherDashboardData,
  TeacherDashboardLesson,
  TeacherDashboardStudent,
  StudentAnalyticsDetail,
} from "@/lib/types/teacher-dashboard";
import styles from "./TeacherDashboard.module.css";

type Tab = "lessons" | "students";
type StudentSortField = "name" | "class" | "progress" | "latest";
type SortDirection = "asc" | "desc";

export default function TeacherDashboard() {
  const [data, setData] = useState<TeacherDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("lessons");
  const [reloadKey, setReloadKey] = useState(0);

  // Filter & Sort state for Lessons
  const [lessonStatusFilter, setLessonStatusFilter] = useState<
    "ALL" | "PUBLISHED" | "DRAFT"
  >("ALL");
  const [lessonSearch, setLessonSearch] = useState("");

  // Filter & Sort state for Students
  const [studentSearch, setStudentSearch] = useState("");
  const [classFilter, setClassFilter] = useState<string>("ALL");
  const [studentSortField, setStudentSortField] =
    useState<StudentSortField>("name");
  const [studentSortDir, setStudentSortDir] = useState<SortDirection>("asc");

  // Pop-up modals
  const [selectedLesson, setSelectedLesson] =
    useState<TeacherDashboardLesson | null>(null);
  const [selectedStudent, setSelectedStudent] =
    useState<TeacherDashboardStudent | null>(null);
  const [analyticsDetail, setAnalyticsDetail] =
    useState<StudentAnalyticsDetail | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  // Fetch dashboard data
  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const session = parseSession(getSessionSnapshot());
        const headers: Record<string, string> = {};
        if (session?.email) {
          headers["x-user-email"] = session.email;
        }

        const res = await fetch("/api/teacher/dashboard", { headers });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            body.error || `Failed to load dashboard (${res.status})`,
          );
        }
        const json: TeacherDashboardData = await res.json();
        if (!ignore) {
          setData(json);
          setError(null);
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          setError(
            err instanceof Error ? err.message : "Failed to load dashboard",
          );
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  // Fetch detailed student analytics when a student is clicked
  const handleOpenStudentAnalytics = async (
    student: TeacherDashboardStudent,
  ) => {
    setSelectedStudent(student);
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    setAnalyticsDetail(null);

    try {
      const session = parseSession(getSessionSnapshot());
      const headers: Record<string, string> = {};
      if (session?.email) {
        headers["x-user-email"] = session.email;
      }

      const res = await fetch(`/api/teacher/students/${student.id}`, {
        headers,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          body.error || `Failed to load analytics (${res.status})`,
        );
      }
      const json: StudentAnalyticsDetail = await res.json();
      setAnalyticsDetail(json);
    } catch (err) {
      setAnalyticsError(
        err instanceof Error ? err.message : "Could not load student progress.",
      );
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Filtered lessons
  const allLessons = data?.lessons ?? [];
  const filteredLessons = allLessons.filter((l) => {
    const matchesStatus =
      lessonStatusFilter === "ALL" || l.status === lessonStatusFilter;
    const matchesSearch =
      l.title.toLowerCase().includes(lessonSearch.toLowerCase()) ||
      l.weekNumber.toString().includes(lessonSearch);
    return matchesStatus && matchesSearch;
  });

  // Filtered & sorted students
  const allStudents = data?.students ?? [];
  const filteredStudents = allStudents
    .filter((s) => {
      const matchesClass =
        classFilter === "ALL" || s.classId.toString() === classFilter;
      const matchesSearch =
        s.displayName.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.className.toLowerCase().includes(studentSearch.toLowerCase());
      return matchesClass && matchesSearch;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (studentSortField === "name") {
        comparison = a.displayName.localeCompare(b.displayName);
      } else if (studentSortField === "class") {
        comparison = a.className.localeCompare(b.className);
      } else if (studentSortField === "progress") {
        comparison = a.percentCompleted - b.percentCompleted;
      } else if (studentSortField === "latest") {
        const aTitle = a.latestCompletedLessonTitle || "";
        const bTitle = b.latestCompletedLessonTitle || "";
        comparison = aTitle.localeCompare(bTitle);
      }
      return studentSortDir === "asc" ? comparison : -comparison;
    });

  const toggleStudentSort = (field: StudentSortField) => {
    if (studentSortField === field) {
      setStudentSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setStudentSortField(field);
      setStudentSortDir("asc");
    }
  };

  if (loading) {
    return (
      <main className={styles.container}>
        <div
          style={{ padding: "48px 0", textAlign: "center", color: "#6b7280" }}
        >
          Loading your teacher dashboard...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className={styles.container}>
        <div className={styles.errorBox}>
          <h2 style={{ margin: "0 0 8px 0" }}>Error Loading Dashboard</h2>
          <p style={{ margin: "0 0 16px 0", fontSize: "14px" }}>{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              setReloadKey((k) => k + 1);
            }}
            className={styles.retryButton}
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  const overview = data?.recentLessonOverview;

  return (
    <main className={styles.container}>
      {/* Top Header */}
      <div className={styles.topBar}>
        <div>
          <h1 className={styles.pageTitle}>Teacher Dashboard</h1>
          <p className={styles.welcomeSubtitle}>
            Welcome, {data?.teacher.displayName}! View your assigned classes,
            lessons, and student progress.
          </p>
        </div>
        <Link href="/lessons" className={styles.createLessonButton}>
          + Create Lesson
        </Link>
      </div>

      {/* 7. Overview Section */}
      <section
        aria-labelledby="overview-heading"
        className={styles.overviewCard}
      >
        <h2 id="overview-heading" className={styles.overviewHeader}>
          <span className={styles.overviewDot}></span>
          Recent Lesson Overview
        </h2>

        {overview ? (
          <div>
            <div className={styles.overviewTitleRow}>
              <span className={styles.weekBadge}>
                Week {overview.weekNumber}
              </span>
              <h3 className={styles.lessonOverviewTitle}>{overview.title}</h3>
            </div>

            <div className={styles.metricsGrid}>
              <div className={`${styles.metricCard} ${styles.metricAssigned}`}>
                <div className={styles.metricLabel}>Assigned Students</div>
                <div className={styles.metricValue}>
                  {overview.assignedStudentCount}
                </div>
              </div>

              <div className={`${styles.metricCard} ${styles.metricCompleted}`}>
                <div className={styles.metricLabel}>Completed</div>
                <div className={styles.metricValue}>
                  {overview.completedCount}
                </div>
              </div>

              <div className={`${styles.metricCard} ${styles.metricPending}`}>
                <div className={styles.metricLabel}>Not Completed</div>
                <div className={styles.metricValue}>
                  {overview.notCompletedCount}
                </div>
              </div>
            </div>

            {overview.assignedStudentCount > 0 && (
              <div className={styles.progressContainer}>
                <div className={styles.progressBarBg}>
                  <div
                    className={styles.progressBarFill}
                    style={{
                      width: `${Math.round(
                        (overview.completedCount /
                          overview.assignedStudentCount) *
                          100,
                      )}%`,
                    }}
                  ></div>
                </div>
                <div className={styles.progressLabel}>
                  {Math.round(
                    (overview.completedCount / overview.assignedStudentCount) *
                      100,
                  )}
                  % complete
                </div>
              </div>
            )}
          </div>
        ) : (
          <div
            style={{ textAlign: "center", padding: "24px 0", color: "#6b7280" }}
          >
            <p style={{ margin: 0, fontWeight: 600 }}>
              No lessons created yet.
            </p>
            <p style={{ margin: "4px 0 0 0", fontSize: "13px" }}>
              Click &quot;+ Create Lesson&quot; to build your first lesson.
            </p>
          </div>
        )}
      </section>

      {/* Switchable Tabs */}
      <div className={styles.tabsBar}>
        <button
          onClick={() => setActiveTab("lessons")}
          className={`${styles.tabButton} ${
            activeTab === "lessons" ? styles.activeTabButton : ""
          }`}
        >
          Lessons ({data?.lessons.length ?? 0})
        </button>
        <button
          onClick={() => setActiveTab("students")}
          className={`${styles.tabButton} ${
            activeTab === "students" ? styles.activeTabButton : ""
          }`}
        >
          Students ({data?.students.length ?? 0})
        </button>
      </div>

      {/* Tab 1: Lessons Section */}
      {activeTab === "lessons" && (
        <section aria-label="Lessons list">
          <div className={styles.controlsRow}>
            <div className={styles.filterGroup}>
              <span>Status:</span>
              <div className={styles.statusButtonGroup}>
                {(["ALL", "PUBLISHED", "DRAFT"] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setLessonStatusFilter(status)}
                    className={`${styles.statusButton} ${
                      lessonStatusFilter === status
                        ? styles.activeStatusButton
                        : ""
                    }`}
                  >
                    {status === "ALL"
                      ? "All"
                      : status.charAt(0) + status.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            <input
              type="text"
              placeholder="Search lessons..."
              value={lessonSearch}
              onChange={(e) => setLessonSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          {filteredLessons.length > 0 ? (
            <div className={styles.lessonsGrid}>
              {filteredLessons.map((lesson) => (
                <div
                  key={lesson.id}
                  onClick={() => setSelectedLesson(lesson)}
                  className={styles.lessonCard}
                >
                  <div>
                    <div className={styles.cardTopRow}>
                      <span className={styles.cardWeek}>
                        Week {lesson.weekNumber}
                      </span>
                      <span
                        className={
                          lesson.status === "PUBLISHED"
                            ? styles.badgePublished
                            : styles.badgeDraft
                        }
                      >
                        {lesson.status}
                      </span>
                    </div>

                    <h3 className={styles.cardTitle}>
                      {lesson.title || "Untitled Lesson"}
                    </h3>

                    <div className={styles.classTagsContainer}>
                      {lesson.assignedClasses.length > 0 ? (
                        lesson.assignedClasses.map((c) => (
                          <span key={c.id} className={styles.classTag}>
                            {c.name}
                          </span>
                        ))
                      ) : (
                        <span className={styles.noClassesText}>
                          No classes assigned
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={styles.cardFooter}>
                    <span>Completions:</span>
                    <span className={styles.cardFooterBold}>
                      {lesson.completionCount} / {lesson.totalAssigned} students
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyStateCard}>
              <p style={{ margin: 0, fontWeight: 600 }}>
                No lessons match your criteria.
              </p>
              <Link
                href="/lessons"
                style={{
                  display: "inline-block",
                  marginTop: "12px",
                  fontSize: "14px",
                  color: "var(--red)",
                  fontWeight: 600,
                }}
              >
                + Create a new lesson now
              </Link>
            </div>
          )}
        </section>
      )}

      {/* Tab 2: Students Section */}
      {activeTab === "students" && (
        <section aria-label="Students table">
          <div className={styles.controlsRow}>
            <div className={styles.filterGroup}>
              <label htmlFor="class-select">Class:</label>
              <select
                id="class-select"
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className={styles.selectInput}
              >
                <option value="ALL">All Classes</option>
                {data?.classes.map((c) => (
                  <option key={c.id} value={c.id.toString()}>
                    {c.name} ({c.studentCount} students)
                  </option>
                ))}
              </select>
            </div>

            <input
              type="text"
              placeholder="Search students..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          {filteredStudents.length > 0 ? (
            <div className={styles.tableWrapper}>
              <table className={styles.studentsTable}>
                <thead>
                  <tr className={styles.tableHeadRow}>
                    <th
                      scope="col"
                      onClick={() => toggleStudentSort("name")}
                      className={styles.tableHeaderCell}
                    >
                      Student Name{" "}
                      {studentSortField === "name"
                        ? studentSortDir === "asc"
                          ? "▲"
                          : "▼"
                        : ""}
                    </th>
                    <th
                      scope="col"
                      onClick={() => toggleStudentSort("class")}
                      className={styles.tableHeaderCell}
                    >
                      Class{" "}
                      {studentSortField === "class"
                        ? studentSortDir === "asc"
                          ? "▲"
                          : "▼"
                        : ""}
                    </th>
                    <th
                      scope="col"
                      onClick={() => toggleStudentSort("progress")}
                      className={styles.tableHeaderCell}
                    >
                      % Lessons Completed{" "}
                      {studentSortField === "progress"
                        ? studentSortDir === "asc"
                          ? "▲"
                          : "▼"
                        : ""}
                    </th>
                    <th
                      scope="col"
                      onClick={() => toggleStudentSort("latest")}
                      className={styles.tableHeaderCell}
                    >
                      Latest Lesson Completed{" "}
                      {studentSortField === "latest"
                        ? studentSortDir === "asc"
                          ? "▲"
                          : "▼"
                        : ""}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr
                      key={student.id}
                      onClick={() => handleOpenStudentAnalytics(student)}
                      className={styles.tableBodyRow}
                    >
                      <td className={styles.tableCell}>
                        <div className={styles.studentNameText}>
                          {student.displayName}
                        </div>
                        <div className={styles.studentEmailText}>
                          {student.email}
                        </div>
                      </td>
                      <td className={styles.tableCell}>
                        <span className={styles.classTag}>
                          {student.className}
                        </span>
                      </td>
                      <td className={styles.tableCell}>
                        <div className={styles.progressCell}>
                          <div className={styles.miniProgressBarBg}>
                            <div
                              className={styles.miniProgressBarFill}
                              style={{ width: `${student.percentCompleted}%` }}
                            ></div>
                          </div>
                          <span style={{ fontWeight: 700, fontSize: "12px" }}>
                            {student.percentCompleted}%
                          </span>
                        </div>
                      </td>
                      <td className={styles.tableCell}>
                        {student.latestCompletedLessonTitle ? (
                          <div>
                            <div style={{ fontWeight: 600, color: "#1f2937" }}>
                              {student.latestCompletedLessonTitle}
                            </div>
                            {student.latestCompletedAt && (
                              <div
                                style={{
                                  fontSize: "12px",
                                  color: "var(--muted)",
                                }}
                              >
                                {new Date(
                                  student.latestCompletedAt,
                                ).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span
                            style={{
                              color: "var(--muted)",
                              fontStyle: "italic",
                            }}
                          >
                            None yet
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.emptyStateCard}>
              No students found in your assigned classes.
            </div>
          )}
        </section>
      )}

      {/* 7.1 Teacher/Admin Lesson Card Pop-up */}
      {selectedLesson && (
        <div role="dialog" aria-modal="true" className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <div>
                <span className={styles.cardWeek}>
                  Week {selectedLesson.weekNumber}
                </span>
                <h3 className={styles.modalTitle}>
                  {selectedLesson.title || "Untitled Lesson"}
                </h3>
              </div>
              <span
                className={
                  selectedLesson.status === "PUBLISHED"
                    ? styles.badgePublished
                    : styles.badgeDraft
                }
              >
                {selectedLesson.status}
              </span>
            </div>

            <div className={styles.modalBodyRows}>
              <div>
                <span style={{ fontWeight: 600, color: "#374151" }}>
                  Assigned Classes:{" "}
                </span>
                {selectedLesson.assignedClasses.length > 0 ? (
                  <div className={styles.classTagsContainer}>
                    {selectedLesson.assignedClasses.map((c) => (
                      <span key={c.id} className={styles.classTag}>
                        {c.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className={styles.noClassesText}>None assigned</span>
                )}
              </div>

              <div>
                <span style={{ fontWeight: 600, color: "#374151" }}>
                  Completion Count:{" "}
                </span>
                <span style={{ fontWeight: 700, color: "var(--navy)" }}>
                  {selectedLesson.completionCount} of{" "}
                  {selectedLesson.totalAssigned} students completed
                </span>
              </div>
            </div>

            {/* Primary Navigation Actions */}
            <div className={styles.modalActionsRow}>
              <div className={styles.modalButtonsLeft}>
                <Link href="/lessons" className={styles.primaryActionBtn}>
                  Edit
                </Link>
                <Link href="/lessons" className={styles.secondaryActionBtn}>
                  Preview
                </Link>
                <Link href="/lessons" className={styles.secondaryActionBtn}>
                  Duplicate
                </Link>
              </div>

              <button
                onClick={() => setSelectedLesson(null)}
                className={styles.closeBtn}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7.2 Teacher/Admin Analytics Pop-up */}
      {selectedStudent && (
        <div role="dialog" aria-modal="true" className={styles.modalOverlay}>
          <div className={`${styles.modalCard} ${styles.modalCardLarge}`}>
            {/* Header */}
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>
                  {selectedStudent.displayName}
                </h3>
                <div
                  style={{
                    fontSize: "14px",
                    color: "var(--muted)",
                    display: "flex",
                    gap: "8px",
                    marginTop: "4px",
                  }}
                >
                  <span>Class:</span>
                  <span style={{ fontWeight: 600, color: "#1f2937" }}>
                    {selectedStudent.className}
                  </span>
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: "var(--muted)",
                  }}
                >
                  Total Completed
                </div>
                <div
                  style={{
                    fontSize: "22px",
                    fontWeight: 800,
                    color: "#059669",
                  }}
                >
                  {selectedStudent.percentCompleted}%
                </div>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className={styles.modalScrollArea}>
              <h4
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "#4b5563",
                  letterSpacing: "0.5px",
                  margin: "0 0 12px 0",
                }}
              >
                Assigned Lessons Progress
              </h4>

              {analyticsLoading && (
                <div
                  style={{
                    padding: "32px 0",
                    textAlign: "center",
                    color: "var(--muted)",
                  }}
                >
                  Loading lesson attempts...
                </div>
              )}

              {analyticsError && (
                <div
                  style={{
                    padding: "12px 16px",
                    background: "#fef2f2",
                    color: "#991b1b",
                    borderRadius: "10px",
                    fontSize: "14px",
                    marginBottom: "16px",
                  }}
                >
                  {analyticsError}
                </div>
              )}

              {analyticsDetail && analyticsDetail.lessons.length > 0 ? (
                <div className={styles.tableWrapper}>
                  <table className={styles.studentsTable}>
                    <thead>
                      <tr className={styles.tableHeadRow}>
                        <th className={styles.tableHeaderCell}>Lesson</th>
                        <th className={styles.tableHeaderCell}>Status</th>
                        <th className={styles.tableHeaderCell}>Latest Score</th>
                        <th className={styles.tableHeaderCell}>Best Score</th>
                        <th
                          className={styles.tableHeaderCell}
                          style={{ textAlign: "center" }}
                        >
                          Attempts
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsDetail.lessons.map((item) => (
                        <tr key={item.lessonId} className={styles.tableBodyRow}>
                          <td className={styles.tableCell}>
                            <div style={{ fontWeight: 600, color: "#111827" }}>
                              {item.lessonTitle}
                            </div>
                            <div
                              style={{
                                fontSize: "11px",
                                color: "var(--muted)",
                              }}
                            >
                              Week {item.weekNumber}
                            </div>
                          </td>
                          <td className={styles.tableCell}>
                            <span
                              className={
                                item.status === "COMPLETED"
                                  ? styles.badgePublished
                                  : item.status === "IN_PROGRESS"
                                    ? styles.badgeDraft
                                    : styles.badgeDraft
                              }
                            >
                              {item.status === "COMPLETED"
                                ? "Completed"
                                : item.status === "IN_PROGRESS"
                                  ? "In Progress"
                                  : "Not Started"}
                            </span>
                          </td>
                          <td className={styles.tableCell}>
                            {item.latestScore !== null
                              ? `${item.latestScore}%`
                              : "—"}
                          </td>
                          <td
                            className={styles.tableCell}
                            style={{ fontWeight: 700, color: "#059669" }}
                          >
                            {item.bestScore !== null
                              ? `${item.bestScore}%`
                              : "—"}
                          </td>
                          <td
                            className={styles.tableCell}
                            style={{ textAlign: "center", fontWeight: 600 }}
                          >
                            {item.attemptCount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                !analyticsLoading && (
                  <p
                    style={{
                      fontSize: "14px",
                      color: "var(--muted)",
                      fontStyle: "italic",
                      margin: "16px 0",
                    }}
                  >
                    No assigned published lessons found for this class.
                  </p>
                )
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                marginTop: "20px",
                paddingTop: "12px",
                borderTop: "1px solid #f3f4f6",
                textAlign: "right",
              }}
            >
              <button
                onClick={() => setSelectedStudent(null)}
                className={styles.secondaryActionBtn}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
