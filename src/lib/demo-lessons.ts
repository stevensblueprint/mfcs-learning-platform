// Small presentation fixtures; opt in with NEXT_PUBLIC_MFCS_DEMO_DATA=true.
import type { Lesson } from "./lessons";
import type { MockDatabase } from "./mock-database";
export const basicDemoMarker = "mfcs.basic-lessons.v1";
export const retiredDemoIds = [
  8_000_000, 8_010_000, 8_020_000, 8_030_000, 8_040_000,
];

export function createBasicDemoLessons(): Lesson[] {
  return [
    {
      id: 9_000_000,
      title: "Hello 你好",
      week_number: 1,
      creator_id: 1,
      classIds: [1],
      status: "PUBLISHED",
      student_instructions:
        "Read 你好 and its meaning. Say it aloud, then choose the correct English translation.",
      created_at: "2026-11-03T09:00:00.000Z",
      updated_at: "2026-11-03T09:00:00.000Z",
      vocabulary: [
        {
          id: 9_000_001,
          lesson_id: 9_000_000,
          order_num: 0,
          primary_meaning: "Hello",
          context_notes: null,
          expressions: [
            {
              id: 9_000_002,
              concept_id: 9_000_001,
              traditional_chinese: "你好",
              simplified_chinese: null,
              pronunciations: [
                {
                  id: 9_000_003,
                  expression_id: 9_000_002,
                  language: "MANDARIN",
                  romanization_system: "PINYIN",
                  reading: "nǐ hǎo",
                  audio_s3_key: null,
                },
              ],
            },
          ],
          examples: [],
        },
      ],
      questions: [
        {
          id: 9_000_004,
          lesson_id: 9_000_000,
          concept_id: 9_000_001,
          question_type: "RECOGNITION",
          order_num: 0,
          prompt: "What does 你好 mean?",
          correct_answer: "Hello",
          options: ["Hello", "Goodbye"],
        },
      ],
    },
    {
      id: 9_010_000,
      title: "Number One 一",
      week_number: 2,
      creator_id: 1,
      classIds: [],
      status: "DRAFT",
      student_instructions:
        "Practice reading and writing the character for one.",
      created_at: "2026-11-04T09:00:00.000Z",
      updated_at: "2026-11-04T09:00:00.000Z",
      vocabulary: [
        {
          id: 9_010_001,
          lesson_id: 9_010_000,
          order_num: 0,
          primary_meaning: "One",
          context_notes: null,
          expressions: [
            {
              id: 9_010_002,
              concept_id: 9_010_001,
              traditional_chinese: "一",
              simplified_chinese: null,
              pronunciations: [
                {
                  id: 9_010_003,
                  expression_id: 9_010_002,
                  language: "MANDARIN",
                  romanization_system: "PINYIN",
                  reading: "yī",
                  audio_s3_key: null,
                },
              ],
            },
          ],
          examples: [],
        },
      ],
      questions: [
        {
          id: 9_010_004,
          lesson_id: 9_010_000,
          concept_id: 9_010_001,
          question_type: "WRITING",
          order_num: 0,
          prompt: "Write the character for one.",
          correct_answer: "一",
          options: null,
        },
      ],
    },
  ];
}

export function addBasicDemoLessons(db: MockDatabase): void {
  for (const lesson of createBasicDemoLessons()) {
    if (db.lessons.some((row) => row.id === lesson.id)) continue;
    const { vocabulary, questions, classIds, ...row } = lesson;
    db.lessons.push(row);
    db.class_lessons.push(
      ...classIds.map((class_id) => ({ class_id, lesson_id: lesson.id })),
    );
    for (const { expressions, examples, ...concept } of vocabulary) {
      db.vocabulary_concepts.push(concept);
      db.example_sentences.push(...examples);
      for (const { pronunciations, ...expression } of expressions) {
        db.chinese_expressions.push(expression);
        db.pronunciations.push(...pronunciations);
      }
    }
    db.questions.push(...questions);
  }
}
