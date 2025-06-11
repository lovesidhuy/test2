# CustomerSupportSync

This application includes an Express-based API with a React front-end.

## Development

```bash
npm install
npm run dev
```
If `DATABASE_URL` is set the full MySQL-backed API will start. Otherwise a
simpler in-memory server runs using the questions JSON file. In either case the
client is served on port 5000.

## Production Build

```bash
npm run build
npm start
```

The build output is placed in `dist/` and served by the server.

## Environment Variables

Set a `DATABASE_URL` pointing to a MySQL instance and define a `JWT_SECRET` for authentication.
After installing dependencies you can run `npm run db:push` to create the tables using Drizzle ORM.

## Database Schema

For reference, `docs/schema.sql` includes a full MySQL schema covering
subjects, chapters, quiz sets, questions and gameplay statistics. This file can
be used to initialize a compatible MySQL 8 database.

## API Overview

- `GET /api/subjects` – list all subjects
- `POST /api/subjects` – create a subject
- `GET /api/chapters?subjectId=1` – list chapters within a subject
- `POST /api/chapters` – create a chapter
- `GET /api/quiz-sets?chapterId=1` – list quiz sets for a chapter
- `POST /api/quiz-sets` – create a quiz set
- `POST /api/quiz-sets/:id/questions` – add questions to a set
- `POST /api/quiz/start` – begin a quiz attempt (pass 
  `questionIds` and optional `quizSetId`)

