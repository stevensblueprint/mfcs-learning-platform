"use client";
import { lessonRepository } from "@/lib/mock-database";
import Image from "next/image";
import Alert from "./ui/Alert";
import Dialog from "./ui/Dialog";
import ConfirmButton from "./ui/ConfirmButton";
import EmptyState from "./ui/EmptyState";
import styles from "./LessonWorkspace.module.css";
import { VocabularyEditor, QuestionEditor } from "./LessonContentEditors";
import { selectLessons, type LessonSort } from "@/lib/lesson-display";
import { useEffect, useRef, useState } from "react";
import {
  blankLesson,
  classes,
  validateLesson,
  orderedLesson,
  type Lesson,
} from "@/lib/lessons";
const tabs = ["Lesson details", "Vocabulary", "Questions"];
export default function LessonWorkspace() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [tab, setTab] = useState(0);
  const [filter, setFilter] = useState("All lessons");
  const [sort, setSort] = useState<LessonSort>("newest");
  const [classFilter, setClassFilter] = useState("all");
  const [displayOptions, setDisplayOptions] = useState(false);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [preview, setPreview] = useState(false);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const latest = useRef<Lesson | null>(null);
  const saved = useRef("");
  const queue = useRef(Promise.resolve());
  const pendingSaves = useRef(0);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    lessonRepository
      .list()
      .then(setLessons)
      .catch(() =>
        setErrors([
          "Saved lessons could not be read. Check browser storage access.",
        ]),
      )
      .finally(() => setReady(true));
  }, []);
  function update(patch: Partial<Lesson>) {
    setLesson((current) => {
      if (!current) return current;
      const next = { ...current, ...patch, status: current.status };
      latest.current = next;
      return next;
    });
    setMessage("Unsaved changes");
    setErrors([]);
  }
  function save(value: Lesson) {
    const normalized = orderedLesson(value);
    pendingSaves.current += 1;
    setSaving(true);
    queue.current = queue.current
      .catch(() => {})
      .then(async () => {
        try {
          const result = await lessonRepository.save(normalized);
          saved.current = JSON.stringify(value);
          setLessons((all) => [
            result,
            ...all.filter((l) => l.id !== result.id),
          ]);
          setMessage(
            JSON.stringify(latest.current) !== JSON.stringify(value)
              ? "Unsaved changes"
              : value.status === "PUBLISHED"
                ? "Lesson published"
                : "All changes saved",
          );
        } catch (e) {
          setErrors([
            e instanceof Error ? e.message : "Save failed. Try again.",
          ]);
          setMessage("Unable to save");
        } finally {
          pendingSaves.current -= 1;
          setSaving(pendingSaves.current > 0);
        }
      });
    return queue.current;
  }
  useEffect(() => {
    if (!lesson || JSON.stringify(lesson) === saved.current) return;
    const timer = setTimeout(() => {
      void save(lesson);
    }, 1200);
    autosaveTimer.current = timer;
    return () => clearTimeout(timer);
  }, [lesson]);
  useEffect(() => {
    const handle = (event: BeforeUnloadEvent) => {
      if (latest.current && JSON.stringify(latest.current) !== saved.current)
        event.preventDefault();
    };
    window.addEventListener("beforeunload", handle);
    return () => window.removeEventListener("beforeunload", handle);
  }, []);
  function open(value: Lesson) {
    saved.current = JSON.stringify(value);
    latest.current = value;
    setLesson(value);
    setTab(0);
    setErrors([]);
    setMessage("All changes saved");
  }
  function create() {
    const value = blankLesson();
    open(value);
    saved.current = "";
    void save(value);
  }
  async function close() {
    if (lesson) {
      await save(lesson);
      if (
        saved.current !== JSON.stringify(lesson) ||
        JSON.stringify(latest.current) !== JSON.stringify(lesson)
      )
        return;
    }
    setLesson(null);
    latest.current = null;
  }
  async function publish() {
    if (!lesson) return;
    const issues = validateLesson(lesson, true);
    setErrors(issues);
    if (issues.length) return;
    const value: Lesson = { ...lesson, status: "PUBLISHED" };
    latest.current = value;
    setLesson(value);
    await save(value);
    if (
      saved.current === JSON.stringify(value) &&
      JSON.stringify(latest.current) === JSON.stringify(value)
    ) {
      setLesson(null);
      latest.current = null;
    }
  }
  const visibleLessons = selectLessons(lessons, {
    search,
    status: filter,
    classId: classFilter,
    sort,
  });
  return (
    <main className={styles.workspace}>
      <section className="page-heading">
        <div>
          <p className="eyebrow">A LITTLE PREPARATION. A WORLD OF DISCOVERY.</p>
          <h1>{lesson ? "Let’s build a lesson!" : "My lessons"}</h1>
          <p>
            {lesson
              ? "Bring language to life, one lesson at a time."
              : "Create meaningful lessons. Inspire your next little adventure."}
          </p>
        </div>
        <Image
          className="heading-dragon"
          loading="eager"
          src="/illustrations/dragons/mascot.png"
          alt="Friendly Chinese dragon mascot"
          width={116}
          height={136}
        />
      </section>
      {errors.length > 0 && <Alert messages={errors} />}
      {!lesson ? (
        <>
          <div className="library-toolbar">
            <div className="filters">
              {["All lessons", "DRAFT", "PUBLISHED"].map((item) => (
                <button
                  key={item}
                  className={filter === item ? "selected" : ""}
                  onClick={() => setFilter(item)}
                >
                  {item === "All lessons"
                    ? item
                    : item === "DRAFT"
                      ? "Draft"
                      : "Published"}
                </button>
              ))}
            </div>
            <div className="display-actions">
              <button
                aria-expanded={displayOptions}
                aria-controls="display-options"
                onClick={() => setDisplayOptions(!displayOptions)}
              >
                ☷ Sort & filter
              </button>
              <button className="primary" onClick={create}>
                ＋ Create lesson
              </button>
            </div>
          </div>
          {displayOptions && (
            <div id="display-options" className="display-options">
              <label>
                Sort lessons
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as LessonSort)}
                >
                  <option value="newest">Created: newest first</option>
                  <option value="oldest">Created: oldest first</option>
                  <option value="alphabetical">Title: A–Z</option>
                  <option value="class">Class: A–Z</option>
                  <option value="week">Week number</option>
                </select>
              </label>
              <label>
                Assigned class
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                >
                  <option value="all">All classes</option>
                  <option value="unassigned">Unassigned</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                onClick={() => {
                  setSort("newest");
                  setClassFilter("all");
                }}
              >
                Reset display
              </button>
            </div>
          )}
          <label className="search">
            Search lessons
            <input
              placeholder="Find a lesson by title…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          {!ready ? (
            <p role="status">Loading your lessons…</p>
          ) : (
            <div className="lesson-grid">
              {visibleLessons.map((l) => (
                <article className="lesson-card" key={l.id}>
                  <div className="card-top">
                    <span className="lesson-symbol">文</span>
                    <span className={"badge " + l.status.toLowerCase()}>
                      {l.status === "DRAFT" ? "Draft" : "Published"}
                    </span>
                  </div>
                  <h2>{l.title || "Untitled lesson"}</h2>
                  <p>
                    {l.student_instructions ||
                      "Your next learning adventure starts here."}
                  </p>
                  <small>
                    Week {l.week_number} · {l.vocabulary.length} words ·{" "}
                    {l.questions.length} questions
                  </small>
                  <p className="class-summary">
                    {l.classIds
                      .map((id) => classes.find((c) => c.id === id)?.name)
                      .join(", ") || "No classes assigned"}
                  </p>
                  <footer>
                    <button onClick={() => open(l)}>Edit lesson →</button>
                    <ConfirmButton
                      className="text-danger"
                      description={`Delete “${l.title || "Untitled lesson"}”?`}
                      onConfirm={async () => {
                        try {
                          await lessonRepository.remove(l.id);
                          setLessons((all) =>
                            all.filter((item) => item.id !== l.id),
                          );
                        } catch {
                          setErrors([
                            "Could not delete lesson. Please try again.",
                          ]);
                        }
                      }}
                    >
                      Delete
                    </ConfirmButton>
                  </footer>
                </article>
              ))}
              {!visibleLessons.length && (
                <EmptyState
                  title={
                    search ? "No lessons found" : "Room for a new adventure"
                  }
                  illustration={
                    <Image
                      src="/illustrations/clouds/left.svg"
                      loading="eager"
                      width={180}
                      height={119}
                      style={{ height: "auto" }}
                      alt=""
                    />
                  }
                  action={
                    <button className="primary" onClick={create}>
                      ＋ Create a lesson
                    </button>
                  }
                >
                  {search
                    ? "Try another title or filter."
                    : "Your lessons will live here. Let’s make the first one together."}
                </EmptyState>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="editor-toolbar">
            <button onClick={() => void close()}>← My lessons</button>
            <span role="status" aria-live="polite">
              {saving ? "Saving…" : message}
            </span>
            <button onClick={() => setPreview(true)}>Preview lesson</button>
            <ConfirmButton
              className="text-danger"
              description={`Delete “${lesson.title || "Untitled lesson"}”? This action cannot be undone.`}
              onConfirm={async () => {
                if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
                await queue.current;
                try {
                  await lessonRepository.remove(lesson.id);
                  setLessons((all) => all.filter((l) => l.id !== lesson.id));
                  setLesson(null);
                  latest.current = null;
                } catch {
                  setErrors(["Could not delete lesson. Please try again."]);
                }
              }}
            >
              Delete lesson
            </ConfirmButton>
            <button disabled={saving} onClick={() => void close()}>
              {lesson.status === "PUBLISHED" ? "Save changes" : "Save draft"}
            </button>
            <button
              className="primary"
              disabled={saving}
              onClick={() => void publish()}
            >
              Publish lesson
            </button>
          </div>
          <div className="editor-layout">
            <aside className="lesson-outline">
              <p className="eyebrow">YOUR LESSON</p>
              {tabs.map((label, index) => (
                <button
                  key={label}
                  className={tab === index ? "active" : ""}
                  onClick={() => setTab(index)}
                >
                  <span>{index + 1}</span>
                  {label}
                  {index > 0 && (
                    <small>
                      {index === 1
                        ? lesson.vocabulary.length
                        : lesson.questions.length}
                    </small>
                  )}
                </button>
              ))}
              <div className="teacher-tip">
                <strong>A little teaching tip</strong>
                <p>
                  Start with a few new words, then give your students a chance
                  to practice.
                </p>
                <span>一起学习 · Learn together</span>
              </div>
            </aside>
            <section className="editor-panel">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">STEP {tab + 1} OF 3</p>
                  <h2>{tabs[tab]}</h2>
                  <p>
                    {
                      [
                        "Set the stage for a great learning experience.",
                        "Give your students the words to explore.",
                        "Turn new knowledge into a little confidence.",
                      ][tab]
                    }
                  </p>
                </div>
                <span className="badge">
                  {lesson.status === "DRAFT" ? "Draft" : "Published"}
                </span>
              </div>
              {tab === 0 && (
                <div className="form-stack">
                  <label>
                    Lesson title <span>*</span>
                    <input
                      maxLength={150}
                      placeholder="e.g. Hello, new friends! 你好，新朋友！"
                      value={lesson.title}
                      onChange={(e) => update({ title: e.target.value })}
                    />
                  </label>
                  <label>
                    Week number <span>*</span>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={lesson.week_number}
                      onChange={(e) =>
                        update({ week_number: Number(e.target.value) })
                      }
                    />
                  </label>
                  <fieldset>
                    <legend>
                      Assigned classes <span>*</span>
                    </legend>
                    <p className="hint">
                      Choose the classes that will receive this lesson.
                    </p>
                    <div className="class-options">
                      {classes.map((c) => (
                        <label
                          className={
                            "class-option " +
                            (lesson.classIds.includes(c.id) ? "checked" : "")
                          }
                          key={c.id}
                        >
                          <input
                            type="checkbox"
                            checked={lesson.classIds.includes(c.id)}
                            onChange={(e) =>
                              update({
                                classIds: e.target.checked
                                  ? [...lesson.classIds, c.id]
                                  : lesson.classIds.filter((id) => id !== c.id),
                              })
                            }
                          />
                          <span>
                            <strong>{c.name}</strong>
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <label>
                    Student instructions <span>*</span>
                    <textarea
                      rows={5}
                      placeholder="Tell your students what to do, step by step…"
                      value={lesson.student_instructions}
                      onChange={(e) =>
                        update({ student_instructions: e.target.value })
                      }
                    />
                  </label>
                </div>
              )}
              {tab === 1 && (
                <VocabularyEditor
                  lesson={lesson}
                  onChange={(vocabulary) =>
                    update({
                      vocabulary,
                      questions: lesson.questions.map((q) =>
                        q.concept_id !== null &&
                        !vocabulary.some((v) => v.id === q.concept_id)
                          ? { ...q, concept_id: null }
                          : q,
                      ),
                    })
                  }
                />
              )}
              {tab === 2 && (
                <QuestionEditor
                  lesson={lesson}
                  onChange={(questions) => update({ questions })}
                />
              )}
              <footer className="step-footer">
                <p>* Required to publish · Drafts save automatically</p>
                <button
                  className="primary"
                  onClick={() => (tab < 2 ? setTab(tab + 1) : setPreview(true))}
                >
                  {tab < 2
                    ? "Next: " + tabs[tab + 1] + " →"
                    : "Preview lesson →"}
                </button>
              </footer>
            </section>
          </div>
        </>
      )}
      {preview && lesson && (
        <Dialog
          open={preview}
          onClose={() => setPreview(false)}
          variant="content"
          labelledBy="preview-title"
        >
          <div className="preview-content">
            <button
              className="close-preview"
              onClick={() => setPreview(false)}
              aria-label="Close preview"
            >
              ✕
            </button>
            <p className="eyebrow">STUDENT PREVIEW</p>
            <h2 id="preview-title">{lesson.title || "Untitled lesson"}</h2>
            <p>
              Week {lesson.week_number} · Preview Mode — Student progress will
              not be recorded
            </p>
            <h3>Your adventure</h3>
            <p className="preserve-lines">
              {lesson.student_instructions || "Instructions will appear here."}
            </p>
            <h3>New words</h3>
            <div className="preview-words">
              {lesson.vocabulary.map((v) => (
                <div key={v.id}>
                  <strong>
                    {v.expressions
                      .map((e) => e.traditional_chinese)
                      .join(" / ")}
                  </strong>
                  <span>
                    {v.expressions
                      .flatMap((e) => e.pronunciations)
                      .map(
                        (p) =>
                          `${p.language === "MANDARIN" ? "Mandarin (Pinyin)" : "Cantonese (Jyutping)"}: ${p.reading}`,
                      )
                      .join(" · ")}
                  </span>
                  <p>{v.primary_meaning}</p>
                  {v.expressions
                    .filter((e) => e.simplified_chinese)
                    .map((e) => (
                      <p key={e.id}>Simplified: {e.simplified_chinese}</p>
                    ))}
                  {v.context_notes && <p>{v.context_notes}</p>}
                  {v.examples.map((example) => (
                    <blockquote key={example.id}>
                      <p>{example.traditional_chinese}</p>
                      {example.simplified_chinese && (
                        <p>{example.simplified_chinese}</p>
                      )}
                      <p>{example.english_translation}</p>
                    </blockquote>
                  ))}
                </div>
              ))}
            </div>
            <h3>Let’s practice</h3>
            {lesson.questions.map((q, i) => (
              <div className="preview-question" key={q.id}>
                <p className="eyebrow">
                  {q.question_type === "RECOGNITION"
                    ? "Recognition"
                    : q.question_type === "PRONUNCIATION"
                      ? "Pronunciation practice"
                      : "Writing practice"}
                </p>
                <p>
                  {i + 1}. {q.prompt}
                </p>
                {q.question_type === "RECOGNITION" ? (
                  (q.options ?? []).filter(Boolean).map((o, n) => (
                    <label className="preview-option" key={n}>
                      <input type="radio" name={String(q.id)} />
                      {o}
                    </label>
                  ))
                ) : (
                  <input
                    aria-label={`Answer question ${i + 1}`}
                    placeholder="Your answer…"
                  />
                )}
              </div>
            ))}
            <button className="primary" onClick={() => setPreview(false)}>
              Back to editing
            </button>
          </div>
        </Dialog>
      )}
    </main>
  );
}
