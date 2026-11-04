"use client";

import Image from "next/image";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import styles from "@/app/dashboard/dashboard.module.css";
import {
  assignedLessons,
  classNames,
  latestCompleted,
  latestPublished,
  lessonCompletion,
  mockLessons,
  mockStudents,
  percentComplete,
  teacherName,
  type MockLesson,
  type MockLessonStatus,
  type MockStudent,
} from "@/lib/mock-teacher-dashboard";

const tabs = ["Lessons", "Students"] as const;
type Tab = (typeof tabs)[number];
type StatusFilter = "ALL" | MockLessonStatus;
type SortKey = "name" | "className" | "percent" | "latest";

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "All lessons" },
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
];

const sortColumns: { key: SortKey; label: string }[] = [
  { key: "name", label: "Student name" },
  { key: "className", label: "Class" },
  { key: "percent", label: "% of lessons completed" },
  { key: "latest", label: "Latest lesson completed" },
];

function sortValue(student: MockStudent, key: SortKey): string | number {
  if (key === "name") return student.name;
  if (key === "className") return student.className;
  if (key === "percent") return percentComplete(student);
  return latestCompleted(student)?.week ?? 0;
}

function StatusPill({ status }: { status: MockLessonStatus }) {
  return (
    <span
      className={`${styles.pill} ${status === "DRAFT" ? styles.pillDraft : styles.pillPublished}`}
    >
      {status === "DRAFT" ? "Draft" : "Published"}
    </span>
  );
}

function Modal({
  labelId,
  onClose,
  children,
}: {
  labelId: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!dialog.current?.open) dialog.current?.showModal();
  }, []);

  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby={labelId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialog.current) dialog.current?.close();
      }}
    >
      <div className={styles.dialogBody}>
        <button
          type="button"
          className={styles.closeButton}
          aria-label="Close"
          onClick={() => dialog.current?.close()}
        >
          ×
        </button>
        {children}
      </div>
    </dialog>
  );
}

function LessonCard({
  lesson,
  onClose,
  onDuplicate,
}: {
  lesson: MockLesson;
  onClose: () => void;
  onDuplicate: (lesson: MockLesson) => void;
}) {
  const [notice, setNotice] = useState("");
  const { assigned, completed } = lessonCompletion(lesson);
  const published = lesson.status === "PUBLISHED";

  return (
    <Modal labelId="lesson-card-title" onClose={onClose}>
      <h2 id="lesson-card-title" className={styles.dialogTitle}>
        {lesson.title} <span lang="zh-Hant">{lesson.chinese}</span>
      </h2>
      <dl className={styles.details}>
        <div>
          <dt>Status</dt>
          <dd>
            <StatusPill status={lesson.status} />
          </dd>
        </div>
        <div>
          <dt>Week</dt>
          <dd>{lesson.week}</dd>
        </div>
        <div>
          <dt>Assigned classes</dt>
          <dd>
            {lesson.classes.length ? lesson.classes.join(", ") : "None yet"}
          </dd>
        </div>
        <div>
          <dt>Completed</dt>
          <dd>
            {published
              ? `${completed} of ${assigned} students`
              : "Not published yet"}
          </dd>
        </div>
      </dl>
      <div className={styles.dialogActions}>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() => setNotice("Editing isn’t connected in this mockup.")}
        >
          Edit
        </button>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() => setNotice("Preview isn’t connected in this mockup.")}
        >
          Preview
        </button>
        <button
          type="button"
          className={styles.goldButton}
          onClick={() => onDuplicate(lesson)}
        >
          Duplicate
        </button>
      </div>
      <p className={styles.notice} role="status">
        {notice}
      </p>
    </Modal>
  );
}

function StudentProgress({
  student,
  onClose,
}: {
  student: MockStudent;
  onClose: () => void;
}) {
  return (
    <Modal labelId="student-progress-title" onClose={onClose}>
      <h2 id="student-progress-title" className={styles.dialogTitle}>
        {student.name}
      </h2>
      <p className={styles.dialogSubtitle}>
        {student.className} · {percentComplete(student)}% of lessons completed
      </p>
      <div
        className={styles.tableScroll}
        role="region"
        aria-label={`Lesson progress for ${student.name}`}
        tabIndex={0}
      >
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Lesson</th>
              <th scope="col">Status</th>
              <th scope="col">Latest score</th>
              <th scope="col">Best score</th>
              <th scope="col">Attempts</th>
            </tr>
          </thead>
          <tbody>
            {assignedLessons(student).map((lesson) => {
              const result = student.results[lesson.id];
              return (
                <tr key={lesson.id}>
                  <td>
                    Week {lesson.week}: {lesson.title}
                  </td>
                  <td>{result.status}</td>
                  <td>
                    {result.latest === null ? "N/A" : `${result.latest}%`}
                  </td>
                  <td>{result.best === null ? "N/A" : `${result.best}%`}</td>
                  <td>{result.attempts}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}

export default function TeacherDashboard() {
  const [tab, setTab] = useState<Tab>("Lessons");
  const [lessons, setLessons] = useState(mockLessons);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [selectedLesson, setSelectedLesson] = useState<MockLesson | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<MockStudent | null>(
    null,
  );
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("ALL");
  const [sort, setSort] = useState<{ key: SortKey; ascending: boolean }>({
    key: "name",
    ascending: true,
  });
  const [announcement, setAnnouncement] = useState("");
  const tabButtons = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({});

  const visibleLessons = useMemo(
    () =>
      lessons
        .filter((l) => statusFilter === "ALL" || l.status === statusFilter)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [lessons, statusFilter],
  );

  const visibleStudents = useMemo(() => {
    const term = search.trim().toLowerCase();
    return mockStudents
      .filter(
        (s) =>
          (classFilter === "ALL" || s.className === classFilter) &&
          s.name.toLowerCase().includes(term),
      )
      .sort((a, b) => {
        const left = sortValue(a, sort.key);
        const right = sortValue(b, sort.key);
        const order =
          typeof left === "number" && typeof right === "number"
            ? left - right
            : String(left).localeCompare(String(right));
        return sort.ascending ? order : -order;
      });
  }, [search, classFilter, sort]);

  const overviewLesson = latestPublished(lessons);
  const overview = overviewLesson && lessonCompletion(overviewLesson);

  function handleTabKey(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const next = tab === "Lessons" ? "Students" : "Lessons";
    setTab(next);
    tabButtons.current[next]?.focus();
  }

  function duplicateLesson(lesson: MockLesson) {
    const title = `${lesson.title} (copy)`;
    setLessons((current) => [
      {
        ...lesson,
        id: Math.max(...current.map((l) => l.id)) + 1,
        title,
        status: "DRAFT",
        createdAt: new Date().toISOString(),
      },
      ...current,
    ]);
    setStatusFilter("ALL");
    setSelectedLesson(null);
    setAnnouncement(`Added “${title}” as a draft. It won’t be saved.`);
  }

  function changeSort(key: SortKey) {
    setSort((current) => ({
      key,
      ascending: current.key === key ? !current.ascending : true,
    }));
  }

  return (
    <main className={styles.page}>
      <div className={styles.scene}>
        <div
          className={`${styles.cloud} ${styles.cloudLeft}`}
          aria-hidden="true"
        />
        <div
          className={`${styles.cloud} ${styles.cloudRight}`}
          aria-hidden="true"
        />
        <div
          className={`${styles.cloud} ${styles.cloudBottom}`}
          aria-hidden="true"
        />
        <div className={styles.content}>
          <h1 className={styles.title}>Teacher Dashboard</h1>
          <p className={styles.subtitle}>
            Welcome back, {teacherName}! Here’s how your classes are doing.
          </p>
          <p className={styles.mockNote}>
            Mockup: all students and scores are made up, and nothing is saved.
          </p>

          {overviewLesson && overview && (
            <section
              className={styles.overview}
              aria-labelledby="overview-title"
            >
              <div className={styles.overviewCopy}>
                <h2 id="overview-title" className={styles.overviewLabel}>
                  Most recent published lesson
                </h2>
                <p className={styles.overviewLesson}>
                  Week {overviewLesson.week}: {overviewLesson.title}{" "}
                  <span lang="zh-Hant">{overviewLesson.chinese}</span>
                </p>
                <ul className={styles.stats}>
                  <li>
                    <strong>{overview.assigned}</strong> students assigned
                  </li>
                  <li>
                    <strong>{overview.completed}</strong> completed
                  </li>
                  <li>
                    <strong>{overview.notCompleted}</strong> not completed
                  </li>
                </ul>
                <div className={styles.progressTrack} aria-hidden="true">
                  <div
                    className={styles.progressFill}
                    style={{
                      width: `${(overview.completed / overview.assigned) * 100}%`,
                    }}
                  />
                </div>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => setSelectedLesson(overviewLesson)}
                >
                  View lesson
                </button>
              </div>
              <Image
                src="/figma/dragon.png"
                alt=""
                aria-hidden="true"
                width={263}
                height={309}
                loading="eager"
                className={styles.dragon}
              />
            </section>
          )}

          <div className={styles.tabs} role="tablist" aria-label="Dashboard">
            {tabs.map((name) => (
              <button
                key={name}
                ref={(element) => {
                  tabButtons.current[name] = element;
                }}
                type="button"
                role="tab"
                id={`tab-${name}`}
                aria-selected={tab === name}
                aria-controls={`panel-${name}`}
                tabIndex={tab === name ? 0 : -1}
                className={styles.tab}
                onClick={() => setTab(name)}
                onKeyDown={handleTabKey}
              >
                {name}
              </button>
            ))}
          </div>

          {tab === "Lessons" ? (
            <section
              id="panel-Lessons"
              role="tabpanel"
              aria-labelledby="tab-Lessons"
              className={styles.panel}
            >
              <div className={styles.toolbar}>
                <div
                  className={styles.chips}
                  role="group"
                  aria-label="Filter lessons by status"
                >
                  {statusFilters.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      className={styles.chip}
                      aria-pressed={statusFilter === value}
                      onClick={() => setStatusFilter(value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className={styles.goldButton}
                  onClick={() =>
                    setAnnouncement(
                      "Creating lessons isn’t connected in this mockup.",
                    )
                  }
                >
                  Create lesson
                </button>
              </div>
              <p className={styles.announcement} role="status">
                {announcement}
              </p>
              <ul className={styles.lessonGrid}>
                {visibleLessons.map((lesson) => {
                  const { assigned, completed } = lessonCompletion(lesson);
                  return (
                    <li key={lesson.id}>
                      <button
                        type="button"
                        className={styles.lessonCard}
                        onClick={() => setSelectedLesson(lesson)}
                      >
                        <span className={styles.lessonTop}>
                          <span className={styles.lessonWeek}>
                            Week {lesson.week}
                          </span>
                          <StatusPill status={lesson.status} />
                        </span>
                        <span className={styles.lessonTitle}>
                          {lesson.title}{" "}
                          <span lang="zh-Hant">{lesson.chinese}</span>
                        </span>
                        <span className={styles.lessonMeta}>
                          {lesson.classes.length
                            ? lesson.classes.join(", ")
                            : "No classes assigned"}
                        </span>
                        <span className={styles.lessonMeta}>
                          {lesson.status === "PUBLISHED"
                            ? `${completed} of ${assigned} completed`
                            : "Not published yet"}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : (
            <section
              id="panel-Students"
              role="tabpanel"
              aria-labelledby="tab-Students"
              className={styles.panel}
            >
              <div className={styles.toolbar}>
                <div className={styles.field}>
                  <label htmlFor="student-search">Search students</label>
                  <input
                    id="student-search"
                    type="search"
                    value={search}
                    placeholder="Enter a student’s name"
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="class-filter">Class</label>
                  <select
                    id="class-filter"
                    value={classFilter}
                    onChange={(event) => setClassFilter(event.target.value)}
                  >
                    <option value="ALL">All classes</option>
                    {classNames.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div
                className={styles.tableScroll}
                role="region"
                aria-label="Students"
                tabIndex={0}
              >
                <table className={styles.table}>
                  <thead>
                    <tr>
                      {sortColumns.map(({ key, label }) => (
                        <th
                          key={key}
                          scope="col"
                          aria-sort={
                            sort.key === key
                              ? sort.ascending
                                ? "ascending"
                                : "descending"
                              : "none"
                          }
                        >
                          <button
                            type="button"
                            className={styles.sortButton}
                            onClick={() => changeSort(key)}
                          >
                            {label}
                            <span aria-hidden="true">
                              {sort.key === key
                                ? sort.ascending
                                  ? " ↑"
                                  : " ↓"
                                : " ↕"}
                            </span>
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visibleStudents.map((student) => {
                      const latest = latestCompleted(student);
                      return (
                        <tr key={student.id}>
                          <td>
                            <button
                              type="button"
                              className={styles.studentButton}
                              onClick={() => setSelectedStudent(student)}
                            >
                              {student.name}
                            </button>
                          </td>
                          <td>{student.className}</td>
                          <td>{percentComplete(student)}%</td>
                          <td>
                            {latest
                              ? `Week ${latest.week}: ${latest.title}`
                              : "None yet"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {visibleStudents.length === 0 && (
                <p className={styles.empty} role="status">
                  No students match your search.
                </p>
              )}
            </section>
          )}
        </div>
      </div>

      {selectedLesson && (
        <LessonCard
          key={selectedLesson.id}
          lesson={selectedLesson}
          onClose={() => setSelectedLesson(null)}
          onDuplicate={duplicateLesson}
        />
      )}
      {selectedStudent && (
        <StudentProgress
          key={selectedStudent.id}
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </main>
  );
}
