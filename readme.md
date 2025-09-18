# Paper Assistant (Next.js + SQLite)

This project replaces the original Flask application with a fully local Next.js app that serves both the React UI and the API routes. All server data is stored in a SQLite database inside the repository (no external MySQL server is required).

## Prerequisites

- Node.js 18 or newer
- npm 9 or newer

## Getting started

```bash
npm install
npm run dev
```

The database file is created automatically the first time the server runs. It is stored at `data/app.db`.

## Available scripts

| Command         | Description                                  |
| --------------- | -------------------------------------------- |
| `npm run dev`   | Start the Next.js development server         |
| `npm run build` | Create a production build                     |
| `npm start`     | Run the production build (`npm run build` first) |
| `npm run lint`  | Run Next.js ESLint checks                    |

## Data storage

- SQLite tables are initialised on demand, mirroring the structure of the previous MySQL schema (users, paper todos, and sessions).
- Session information is stored locally so the application can run entirely offline.
- To reset your data, stop the dev server, delete `data/app.db`, and start the server again.

## API overview

The React frontend talks to the following API routes, which you can also call with tools like `curl` or Postman:

- `POST /api/search` – fetch recent papers from arXiv.
- `POST /api/auth/register` – create a user account.
- `POST /api/auth/login` – log in and receive an HTTP-only session cookie.
- `POST /api/auth/status` – check the current login state.
- `POST /api/auth/logout` – clear the session cookie.
- `POST /api/save-paper` – add a paper to your reading list.
- `POST /api/update-status` – change a paper’s status.
- `POST /api/update-rating` – set the personal rating for a paper.
- `POST /api/remove-one-paper` – delete a saved paper.
- `GET /api/users/:userId/papers` – list all papers for the logged-in user.

All routes rely on the HTTP-only session cookie that is issued after logging in.

## Notes

- The UI uses Tailwind CSS and lucide-react for styling and icons.
- Toast notifications are provided by `react-hot-toast`.
- Because everything runs locally, HTTPS is optional and cookies are set with the appropriate flags for local development.
