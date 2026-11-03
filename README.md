# MFCS

Next.js application built with React, TypeScript, and Tailwind CSS.

## Local development

1. Install the dependencies  in the lockfile:

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

5. Open http://localhost:3000 or the address in the terminal.

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