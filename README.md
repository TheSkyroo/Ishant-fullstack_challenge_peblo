# Peblo Notes — Collaborative AI Notes Workspace

A full-stack, AI-powered notes workspace built for the PEBLO take-home challenge.

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 16 (App Router) + TypeScript + Tailwind CSS |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| AI | SambaNova Cloud (Llama 3.3-70B) |
| Auth | JWT + bcryptjs |

---

## Architecture

```
PEBLO/
├── backend/          Express REST API
│   ├── src/
│   │   ├── config/   MongoDB connection
│   │   ├── controllers/
│   │   ├── middleware/  JWT auth guard
│   │   ├── models/   User, Note (Mongoose schemas)
│   │   ├── routes/
│   │   └── services/ SambaNova AI service
│   └── server.js
│
└── frontend/         Next.js App Router
    └── src/
        ├── app/
        │   ├── login/       Auth pages
        │   ├── signup/
        │   ├── notes/       Notes workspace
        │   ├── insights/    Dashboard
        │   └── shared/[shareId]/  Public share page
        ├── components/  Sidebar, NoteEditor, NoteList
        ├── contexts/    AuthContext (JWT + localStorage)
        ├── hooks/       useNotes
        └── lib/         api (axios), types
```

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB (local or MongoDB Atlas)
- SambaNova API key — get one free at https://cloud.sambanova.ai

### 1. Backend

```bash
cd backend
cp .env.example .env
# Fill in .env (see below)
npm install
npm run dev
# Runs on http://localhost:5000
```

**`backend/.env`**
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/peblo
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRES_IN=7d
SAMBANOVA_API_KEY=your_sambanova_api_key
SAMBANOVA_MODEL=Meta-Llama-3.3-70B-Instruct
CLIENT_URL=http://localhost:3000
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env.local
# .env.local already points to http://localhost:5000/api
npm install
npm run dev
# Runs on http://localhost:3000
```

---

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | — | Register a new user |
| POST | `/api/auth/login` | — | Login, returns JWT |
| GET | `/api/auth/me` | ✓ | Get current user |
| GET | `/api/notes` | ✓ | List notes (search, tag, archived) |
| POST | `/api/notes` | ✓ | Create note |
| PATCH | `/api/notes/:id` | ✓ | Update note |
| DELETE | `/api/notes/:id` | ✓ | Delete note |
| POST | `/api/notes/:id/generate-summary` | ✓ | Generate AI summary |
| POST | `/api/notes/:id/share` | ✓ | Create public share link |
| DELETE | `/api/notes/:id/share` | ✓ | Make note private |
| GET | `/api/shared/:shareId` | — | Get public shared note |
| GET | `/api/insights` | ✓ | Get productivity dashboard data |

---

## Features

- **Auth** — JWT-based signup/login, persistent sessions, bcrypt password hashing
- **Notes Workspace** — Create, edit, archive; auto-save with 800ms debounce; markdown editor with preview toggle
- **Tags & Categories** — Tag notes inline, filter by tag in sidebar
- **AI Summaries** — SambaNova (Llama 3.3-70B) generates summary, action items, and suggested title per note
- **Search** — Full-text search via MongoDB text index
- **Public Sharing** — Generate a shareable link; public page requires no login and shows AI insights
- **Insights Dashboard** — Weekly activity bar chart, top tags breakdown, AI usage stats, recently edited notes, stat cards

---

## Database Schema

### User
```json
{ "_id", "name", "email", "password" (hashed), "aiUsageCount", "createdAt", "updatedAt" }
```

### Note
```json
{
  "_id", "user" (ref), "title", "content", "tags" [], "category",
  "isArchived", "isPublic", "shareId",
  "aiOutput": { "summary", "actionItems" [], "suggestedTitle", "generatedAt" },
  "createdAt", "updatedAt"
}
```

---

## Optional Enhancements Included

- Markdown editor with live preview toggle (`@uiw/react-md-editor`)
- Dark mode (full app)
- Optimistic UI — note list updates immediately on tag/archive changes

---

## Sample AI Output

```json
{
  "summary": "A planning session for the Q3 sprint covering API redesign, mobile performance targets, and team sync schedule.",
  "actionItems": [
    "Prepare UI mockups for dashboard v2",
    "Review API rate-limiting structure",
    "Schedule sync with mobile team by Friday"
  ],
  "suggestedTitle": "Q3 Sprint Planning — May 2026"
}
```
