"use client";
import {
  blankQuestion,
  blankVocabulary,
  nextId,
  type Expression,
  type Lesson,
  type Question,
  type Vocabulary,
} from "@/lib/lessons";
function move<T>(items: T[], index: number, direction: number) {
  const next = [...items];
  [next[index], next[index + direction]] = [
    next[index + direction],
    next[index],
  ];
  return next;
}
function Controls({
  index,
  count,
  onMove,
  onRemove,
}: {
  index: number;
  count: number;
  onMove: (direction: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="row-actions">
      <button aria-label="Move up" disabled={!index} onClick={() => onMove(-1)}>
        ↑
      </button>
      <button
        aria-label="Move down"
        disabled={index === count - 1}
        onClick={() => onMove(1)}
      >
        ↓
      </button>
      <button
        className="text-danger"
        onClick={() => {
          if (
            confirm(
              "Are you sure you want to delete this item? This action cannot be undone.",
            )
          )
            onRemove();
        }}
      >
        Remove
      </button>
    </div>
  );
}
export function VocabularyEditor({
  lesson,
  onChange,
}: {
  lesson: Lesson;
  onChange: (items: Vocabulary[]) => void;
}) {
  const edit = (id: number, patch: Partial<Vocabulary>) =>
    onChange(
      lesson.vocabulary.map((v) => (v.id === id ? { ...v, ...patch } : v)),
    );
  return (
    <div className="form-stack">
      {!lesson.vocabulary.length && (
        <div className="inline-empty">
          Add a meaning, then the Chinese expressions that share it.
        </div>
      )}
      {lesson.vocabulary.map((v, i) => {
        const editExpression = (id: number, patch: Partial<Expression>) =>
          edit(v.id, {
            expressions: v.expressions.map((e) =>
              e.id === id ? { ...e, ...patch } : e,
            ),
          });
        return (
          <fieldset key={v.id} className="item-card">
            <legend>Vocabulary concept {i + 1}</legend>
            <Controls
              index={i}
              count={lesson.vocabulary.length}
              onMove={(d) => onChange(move(lesson.vocabulary, i, d))}
              onRemove={() =>
                onChange(lesson.vocabulary.filter((item) => item.id !== v.id))
              }
            />
            <div className="form-stack">
              <label>
                Primary meaning *
                <input
                  value={v.primary_meaning}
                  onChange={(e) =>
                    edit(v.id, { primary_meaning: e.target.value })
                  }
                  placeholder="Hello / greeting"
                />
              </label>
              <label>
                Context notes
                <textarea
                  rows={2}
                  value={v.context_notes ?? ""}
                  onChange={(e) =>
                    edit(v.id, { context_notes: e.target.value || null })
                  }
                />
              </label>
              {v.expressions.map((expression, index) => (
                <fieldset className="expression-card" key={expression.id}>
                  <legend>Chinese expression {index + 1}</legend>
                  <div className="option-grid">
                    <label>
                      Traditional Chinese *
                      <input
                        value={expression.traditional_chinese}
                        onChange={(e) =>
                          editExpression(expression.id, {
                            traditional_chinese: e.target.value,
                          })
                        }
                        placeholder="你好"
                      />
                    </label>
                    <label>
                      Simplified Chinese (optional)
                      <input
                        value={expression.simplified_chinese ?? ""}
                        onChange={(e) =>
                          editExpression(expression.id, {
                            simplified_chinese: e.target.value || null,
                          })
                        }
                      />
                    </label>
                  </div>
                  <div className="option-grid">
                    {(["MANDARIN", "CANTONESE"] as const).map((language) => {
                      const pronunciation = expression.pronunciations.find(
                        (p) => p.language === language,
                      );
                      return (
                        <label key={language}>
                          {language === "MANDARIN"
                            ? "Mandarin (Pinyin)"
                            : "Cantonese (Jyutping)"}
                          <input
                            value={pronunciation?.reading ?? ""}
                            placeholder={
                              language === "MANDARIN" ? "nǐ hǎo" : "nei5 hou2"
                            }
                            onChange={(e) => {
                              const others = expression.pronunciations.filter(
                                (p) => p.language !== language,
                              );
                              editExpression(expression.id, {
                                pronunciations: e.target.value
                                  ? [
                                      ...others,
                                      {
                                        id: pronunciation?.id ?? nextId(),
                                        expression_id: expression.id,
                                        language,
                                        romanization_system:
                                          language === "MANDARIN"
                                            ? "PINYIN"
                                            : "JYUTPING",
                                        reading: e.target.value,
                                        audio_s3_key:
                                          pronunciation?.audio_s3_key ?? null,
                                      },
                                    ]
                                  : others,
                              });
                            }}
                          />
                        </label>
                      );
                    })}
                  </div>
                  {v.expressions.length > 1 && (
                    <button
                      className="text-danger"
                      onClick={() => {
                        if (confirm("Delete this Chinese expression?"))
                          edit(v.id, {
                            expressions: v.expressions.filter(
                              (e) => e.id !== expression.id,
                            ),
                          });
                      }}
                    >
                      Remove expression
                    </button>
                  )}
                </fieldset>
              ))}
              <button
                onClick={() =>
                  edit(v.id, {
                    expressions: [
                      ...v.expressions,
                      {
                        id: nextId(),
                        concept_id: v.id,
                        traditional_chinese: "",
                        simplified_chinese: null,
                        pronunciations: [],
                      },
                    ],
                  })
                }
              >
                ＋ Add alternative expression
              </button>
              {v.examples.map((example, n) => (
                <fieldset className="expression-card" key={example.id}>
                  <legend>Example sentence {n + 1}</legend>
                  <div className="form-stack">
                    {(
                      [
                        "traditional_chinese",
                        "simplified_chinese",
                        "english_translation",
                      ] as const
                    ).map((field) => (
                      <label key={field}>
                        {field === "traditional_chinese"
                          ? "Traditional Chinese *"
                          : field === "simplified_chinese"
                            ? "Simplified Chinese (optional)"
                            : "English translation *"}
                        <input
                          value={example[field] ?? ""}
                          onChange={(e) =>
                            edit(v.id, {
                              examples: v.examples.map((item) =>
                                item.id === example.id
                                  ? {
                                      ...item,
                                      [field]:
                                        field === "simplified_chinese"
                                          ? e.target.value || null
                                          : e.target.value,
                                    }
                                  : item,
                              ),
                            })
                          }
                        />
                      </label>
                    ))}
                    <button
                      className="text-danger"
                      onClick={() => {
                        if (confirm("Delete this example sentence?"))
                          edit(v.id, {
                            examples: v.examples.filter(
                              (item) => item.id !== example.id,
                            ),
                          });
                      }}
                    >
                      Remove example
                    </button>
                  </div>
                </fieldset>
              ))}
              <button
                onClick={() =>
                  edit(v.id, {
                    examples: [
                      ...v.examples,
                      {
                        id: nextId(),
                        concept_id: v.id,
                        traditional_chinese: "",
                        simplified_chinese: null,
                        english_translation: "",
                      },
                    ],
                  })
                }
              >
                ＋ Add example sentence
              </button>
            </div>
          </fieldset>
        );
      })}
      <button
        className="add-button"
        onClick={() =>
          onChange([...lesson.vocabulary, blankVocabulary(lesson.id)])
        }
      >
        ＋ Add vocabulary concept
      </button>
    </div>
  );
}
export function QuestionEditor({
  lesson,
  onChange,
}: {
  lesson: Lesson;
  onChange: (items: Question[]) => void;
}) {
  return (
    <div className="form-stack">
      {!lesson.questions.length && (
        <div className="inline-empty">
          Add recognition, pronunciation, or writing practice.
        </div>
      )}
      {lesson.questions.map((q, i) => {
        const edit = (patch: Partial<Question>) =>
          onChange(
            lesson.questions.map((item) =>
              item.id === q.id ? { ...item, ...patch } : item,
            ),
          );
        return (
          <fieldset key={q.id} className="item-card">
            <legend>Question {i + 1}</legend>
            <Controls
              index={i}
              count={lesson.questions.length}
              onMove={(d) => onChange(move(lesson.questions, i, d))}
              onRemove={() =>
                onChange(lesson.questions.filter((item) => item.id !== q.id))
              }
            />
            <div className="form-stack">
              <div className="option-grid">
                <label>
                  Vocabulary concept
                  <select
                    value={q.concept_id ?? ""}
                    onChange={(e) =>
                      edit({
                        concept_id: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                  >
                    <option value="">No linked concept</option>
                    {lesson.vocabulary.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.expressions
                          .map((e) => e.traditional_chinese)
                          .join(" / ") || "Untitled"}{" "}
                        — {v.primary_meaning}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Question type
                  <select
                    value={q.question_type}
                    onChange={(e) =>
                      edit({
                        question_type: e.target
                          .value as Question["question_type"],
                        correct_answer: "",
                        options:
                          e.target.value === "RECOGNITION"
                            ? ["", "", "", ""]
                            : null,
                      })
                    }
                  >
                    <option value="RECOGNITION">
                      Character recognition / understanding
                    </option>
                    <option value="PRONUNCIATION">
                      Pronunciation practice
                    </option>
                    <option value="WRITING">Writing practice</option>
                  </select>
                </label>
              </div>
              <label>
                Question / prompt *
                <textarea
                  rows={2}
                  value={q.prompt}
                  onChange={(e) => edit({ prompt: e.target.value })}
                />
              </label>
              {q.question_type === "RECOGNITION" && (
                <div className="option-grid">
                  {(q.options ?? []).map((option, n) => (
                    <label key={n}>
                      Option {n + 1}
                      <input
                        value={option}
                        onChange={(e) =>
                          edit({
                            options: q.options!.map((o, index) =>
                              n === index ? e.target.value : o,
                            ),
                            correct_answer:
                              q.correct_answer === option
                                ? e.target.value
                                : q.correct_answer,
                          })
                        }
                      />
                    </label>
                  ))}
                </div>
              )}
              <label>
                {q.question_type === "RECOGNITION"
                  ? "Correct answer *"
                  : q.question_type === "PRONUNCIATION"
                    ? "Expected pronunciation *"
                    : "Expected characters *"}
                {q.question_type === "RECOGNITION" ? (
                  <select
                    value={q.correct_answer}
                    onChange={(e) => edit({ correct_answer: e.target.value })}
                  >
                    <option value="">Choose the correct answer</option>
                    {(q.options ?? []).filter(Boolean).map((o, n) => (
                      <option key={n}>{o}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={q.correct_answer}
                    onChange={(e) => edit({ correct_answer: e.target.value })}
                  />
                )}
              </label>
            </div>
          </fieldset>
        );
      })}
      <button
        className="add-button"
        onClick={() =>
          onChange([...lesson.questions, blankQuestion(lesson.id)])
        }
      >
        ＋ Add question
      </button>
    </div>
  );
}
