# MFCS

Next.js application built with React, TypeScript, and Tailwind CSS.

## Local development

1. Install the dependencies in the lockfile:

   ```sh
   npm ci
   ```

2. Create `.env.local` from `.env.example` if it does not already exist.

3. Start PostgreSQL:

   ```sh
   npm run db:up
   ```

4. Apply committed migrations:

   ```sh
   npm run db:migrate
   ```

5. Start the development server:

   ```sh
   npm run dev
   ```

6. Open http://localhost:3000 or the address in the terminal.

## Database Changes

1. Create a migration:

   ```sh
   npm run db:migration:create -- describe-the-change
   ```

2. Write the SQL in the generated migration, then apply it:

   ```sh
   npm run db:migrate
   ```

3. Stop PostgreSQL:

   ```sh
   npm run db:down
   ```

## Checks

Run each command individually and resolve any failures:

```sh
npm run typecheck
npm run lint
npm run build
```

## Production build

```sh
npm run build
npm start
```

## Lesson workspace demo

The public home page is `/`. Sign in at `/login` with username `admin` and password
`admin`, then continue to `/lessons` to create lessons, edit metadata and instructions,
assign classes, reorder vocabulary and questions, and preview the student view.
The lessons route uses the browser-local mock session and redirects logged-out visitors to login. Changes autosave after
1.2 seconds; Save draft saves immediately. Publish validates required content.

`src/lib/lessons.ts` exposes the `LessonRepository` interface. The demo implementation
stores records in browser localStorage and calls `/api/lessons/validate` before writing.
Storage is specific to the browser and origin, and clearing browser data removes lessons.
The endpoint validates the lesson structure and checks class IDs against a mock teacher's
two permitted classes (a third belongs to another teacher). This is not real authentication or production authorization.
Replace the adapter with authenticated API persistence and derive permitted classes from
the server session before production use.

The Figma file contains home, login, and support concepts, so the lesson interface extends
those concepts rather than reproducing a supplied lesson editor. Original logo, dragon,
and cloud assets are downloaded into `public/figma`. The design's Cherry Bomb One and
Inclusive Sans fonts are loaded via Next.js font optimization.

Run the persistence and validation tests with Node 22+:

```sh
npm test
```

## Mock schema and document precedence

`docs/database.md` is authoritative over `docs/design_doc.pdf`. Lesson records use
integer IDs, `week_number`, creator and creation/update timestamps, `DRAFT`/`PUBLISHED`,
and student instructions. Description and level fields from the initial prototype are
not persisted because the database schema does not define them.

`src/lib/classes.ts` defines teacher ownership and role-based class selection.
`src/lib/lessons.ts` defines authoring types and validation.
`src/lib/mock-database.ts` implements the repository with normalized localStorage tables
for lessons, class assignments, concepts, expressions, pronunciations, example sentences,
and questions. Nested authoring objects are hydrated from those tables. Deleting a lesson
removes its dependent rows; removing a concept clears question references in the editor.
Mandarin uses Pinyin, Cantonese uses Jyutping, and traditional Chinese is required.
Questions use RECOGNITION, PRONUNCIATION, or WRITING with an optional concept link.

The demo stores data under `mfcs.database.v2`. The earlier prototype's
`mfcs.lessons.v1` key is left untouched and is not imported into this schema.
No real user records, student attempts, S3 uploads, audio recording, stroke capture, or
scoring are implemented. The authoring preview shows content without recording progress.

The lesson library defaults to creation time (newest first). Sort & filter also supports
oldest first, title A–Z, class A–Z, week number, and assigned/unassigned class filters.
These run against browser data and combine with search and Draft/Published tabs.

Run `npm run format` to normalize the codebase, and `npm run format:check` to verify it.

## Reviewing the home and login branch

Run `npm ci` and `npm run dev`, then open `http://localhost:3000`.
The home page uses the Amaro Figma artwork, and login accepts only `admin` / `admin`.
After login, the success dialog continues to the lessons dashboard. The Lessons navigation
link appears while signed in, and Log out clears the mock session. `/dashboard` redirects
to `/lessons`. Password recovery accepts `admin` or `admin@mfcs.test`; its confirmation
is a UI mock and does not send email or change passwords.

To show the two basic lesson samples, set `NEXT_PUBLIC_MFCS_DEMO_DATA=true` in your
`.env.local` and restart the development server. This flag is included in `.env.example`.
The samples are **Hello 你好** (published) and **Number One 一** (draft), each with
one vocabulary concept and one question. `src/lib/demo-lessons.ts` contains the fixtures.

Seeding runs once per browser. It replaces the five earlier large demo lessons and removes
their dependent mock rows, while preserving lessons you created yourself. Edits and deletions
to the new samples persist. Set the flag to `false` to disable future seeding; existing browser
data remains. The sample data does not require PostgreSQL.
