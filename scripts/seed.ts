import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { Pool } from "pg";

async function seed() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not configured.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  console.log("Seeding database...");

  // 1. Insert or update Demo Teacher
  const teacherRes = await pool.query(`
    INSERT INTO users (auth_provider_id, display_name, username, email, role, account_status)
    VALUES ('demo_teacher_1', 'Tina Teacher', 'tina_teacher', 'teacher@mfcs.test', 'TEACHER', 'ACTIVE')
    ON CONFLICT (email) DO UPDATE SET role = 'TEACHER', account_status = 'ACTIVE'
    RETURNING id;
  `);
  const teacherId = teacherRes.rows[0].id;
  console.log(`Teacher ready with id: ${teacherId}`);

  // 2. Insert Classes for Teacher
  let class1Id: number;
  let class2Id: number;
  const existingClasses = await pool.query(
    `SELECT id, name FROM classes WHERE teacher_id = $1`,
    [teacherId],
  );

  if (existingClasses.rows.length >= 2) {
    class1Id = existingClasses.rows[0].id;
    class2Id = existingClasses.rows[1].id;
  } else {
    const c1 = await pool.query(
      `INSERT INTO classes (name, teacher_id) VALUES ('Beginner A', $1) RETURNING id`,
      [teacherId],
    );
    const c2 = await pool.query(
      `INSERT INTO classes (name, teacher_id) VALUES ('Beginner B', $1) RETURNING id`,
      [teacherId],
    );
    class1Id = c1.rows[0].id;
    class2Id = c2.rows[0].id;
  }
  console.log(`Classes ready: IDs ${class1Id}, ${class2Id}`);

  // 3. Insert Students
  const s1 = await pool.query(
    `
    INSERT INTO users (auth_provider_id, display_name, username, email, role, account_status, student_class_id)
    VALUES ('demo_student_1', 'Alice Wang', 'alice_wang', 'alice@mfcs.test', 'STUDENT', 'ACTIVE', $1)
    ON CONFLICT (email) DO UPDATE SET student_class_id = $1
    RETURNING id;
  `,
    [class1Id],
  );

  const s2 = await pool.query(
    `
    INSERT INTO users (auth_provider_id, display_name, username, email, role, account_status, student_class_id)
    VALUES ('demo_student_2', 'Sam Student', 'sam_student', 'student@mfcs.test', 'STUDENT', 'ACTIVE', $1)
    ON CONFLICT (email) DO UPDATE SET student_class_id = $1
    RETURNING id;
  `,
    [class1Id],
  );

  await pool.query(
    `
    INSERT INTO users (auth_provider_id, display_name, username, email, role, account_status, student_class_id)
    VALUES ('demo_student_3', 'Bob Chen', 'bob_chen', 'bob@mfcs.test', 'STUDENT', 'ACTIVE', $1)
    ON CONFLICT (email) DO UPDATE SET student_class_id = $1
    RETURNING id;
  `,
    [class2Id],
  );

  // 4. Insert Sample Lessons authored by Teacher
  const l1 = await pool.query(
    `
    INSERT INTO lessons (title, week_number, status, student_instructions, creator_id)
    VALUES ('Food Vocabulary', 7, 'PUBLISHED', 'Practice food vocabulary and pronunciations', $1)
    RETURNING id;
  `,
    [teacherId],
  );

  const l2 = await pool.query(
    `
    INSERT INTO lessons (title, week_number, status, student_instructions, creator_id)
    VALUES ('Family Members', 6, 'PUBLISHED', 'Review family terms and relations', $1)
    RETURNING id;
  `,
    [teacherId],
  );

  await pool.query(
    `
    INSERT INTO lessons (title, week_number, status, student_instructions, creator_id)
    VALUES ('Animals and Pets', 8, 'DRAFT', 'Upcoming draft lesson for Week 8', $1)
    RETURNING id;
  `,
    [teacherId],
  );

  // 5. Assign Lessons to Classes
  await pool.query(
    `
    INSERT INTO class_lessons (class_id, lesson_id)
    VALUES 
      ($1, $2),
      ($3, $2),
      ($1, $4)
    ON CONFLICT DO NOTHING;
  `,
    [class1Id, l1.rows[0].id, class2Id, l2.rows[0].id],
  );

  // 6. Insert Completed Attempts
  await pool.query(
    `
    INSERT INTO lesson_attempts (student_id, lesson_id, status, score_percent, questions_correct, total_questions, completed_at)
    VALUES 
      ($1, $2, 'COMPLETED', 95, 19, 20, now() - interval '1 day'),
      ($3, $2, 'COMPLETED', 80, 16, 20, now() - interval '2 days')
    ON CONFLICT DO NOTHING;
  `,
    [s1.rows[0].id, l1.rows[0].id, s2.rows[0].id],
  );

  console.log("Database seeded successfully!");
  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

