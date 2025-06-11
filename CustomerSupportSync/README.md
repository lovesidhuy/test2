# CustomerSupportSync

This application includes an Express-based API with a React front-end.

## Development

```bash
npm install
npm run dev
```


This starts the API and React client on port 5000.

## Production Build

```bash
npm run build
npm start
```

The build output is placed in `dist/` and served by the server.

## Environment Variables

Set a `DATABASE_URL` for database-backed features and define a `JWT_SECRET` for authentication.
Run `npm run db:push` to create the schema in a fresh database.

## Database Schema

For reference, `docs/schema.sql` includes a full MySQL schema covering
subjects, chapters, quiz sets, questions and gameplay statistics. This file can



be used to initialize a compatible MySQL 8 database.
