# Gradeio - AI Education Platform

## Overview

Gradeio is a full-featured AI-powered education platform where students can upload homework for AI solutions and teachers can review and grade student work. It's a complete SaaS application with authentication, role-based dashboards, and AI-powered tools.

## User Preferences

Preferred communication style: Simple, everyday language.

## Production Notes

### Current Status: Production-Ready
- **Database**: PostgreSQL with Drizzle ORM (DatabaseStorage class)
- **Sessions**: Server-side sessions with express-session + connect-pg-simple (session cookie name: "gid", pruning every hour)
- **Authentication**: Bcrypt password hashing (10 rounds), autocomplete attributes on all form inputs
- **Payments**: Stripe integration available but not configured (user dismissed setup)
- **Security**: Helmet security headers (full CSP in production), rate limiting on all API endpoints
- **Compression**: gzip via `compression` middleware (SSE streams excluded)
- **Health Check**: GET /health returns { status, timestamp, uptime, env }
- **Graceful Shutdown**: SIGTERM/SIGINT handlers close HTTP server then DB pool, 10s forced exit
- **Error Handling**: Global error handler (no re-throw), API 404 handler, uncaughtException/unhandledRejection handlers
- **AI Tutor**: All-subject tutoring (Math, Science, English, History, etc.) — students can ask homework questions and get expert explanations. Subject-aware system prompts guide responses based on the subject. Voice input supported with continuous SpeechRecognition, auto-restart on silence, proper tracking, cleanup on unmount.
- **Lecture Notes Mic**: Audio level analyser for waveform visualisation, auto-restart recognition on silence, download notes as .txt
- **Persistent Chat History**: Tutor sessions saved per-user with collapsible history sidebar, auto-save, session switching, "New chat" button, and per-session delete.
- **Teacher Accounts**: Role-based teacher dashboard. Teacher onboarding modal on first login collects school, grade level, and subjects. Teacher sidebar shows Teacher badge and school name. Teacher home overview shows quick-access tools and class cards.
- **Class Management (Teacher)**: Teachers create classes with auto-generated 6-char class codes. My Classes page shows all classes with student counts, copy-code button, and roster viewer (with join date). Classes can be deleted.
- **Student Class Join**: Students join classes via Settings → My Classes by entering a class code. Joined classes shown in Settings. Duplicate join prevented server-side.

### To Add Stripe Payments Later
1. Use the Replit integrations to set up Stripe connector
2. Or manually add STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY as secrets
3. Create subscription products in Stripe dashboard
4. Implement checkout flow in /pricing page

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **State Management**: TanStack React Query for server state and data fetching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with violet/indigo gradient theme
- **Build Tool**: Vite for development and production builds
- **Routing**: wouter for client-side routing

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful JSON API endpoints under `/api/*`
- **AI Integration**: 
  - OpenAI GPT-5.2 (highest-end model) for ALL AI features: math solving, quiz generation, essay writing, follow-up questions
- **Database**: PostgreSQL with Drizzle ORM (DatabaseStorage)
- **Sessions**: PostgreSQL-backed sessions (connect-pg-simple)
- **Security**: Bcrypt password hashing

### User Roles
- **Student**: Upload homework, get AI solutions, view submission history
- **Teacher**: Review student submissions, provide scores and feedback; access full teacher suite (Assignments, Class Grader, Grade Book, Report Cards)

### Data Models
- **Users**: id, email, displayName, password (hashed), role (student/teacher), createdAt
- **Submissions**: id, studentId, title, subject, content, status, aiSolution, aiSteps, aiExplanation
- **Evaluations**: id, submissionId, teacherId, score, feedback, reviewedAt
- **Sessions**: PostgreSQL table "user_sessions" (auto-created)
- **KnowledgeChunks**: RAG knowledge base with vector embeddings (1536 dimensions)
- **Courses**: id, userId, title, topic, difficulty, audience, description, coverEmoji, chapters (JSONB), totalLessons, createdAt
- **LessonContents**: id, courseId, lessonKey (e.g. "0-2"), content (markdown), quiz (JSONB array), createdAt
- **LessonProgress**: id, userId, courseId, lessonKey, score, completedAt

### Teacher Feature Suite (Examino-inspired)
Teacher accounts see a dedicated "Teacher" section in the sidebar with 5 tools:
- **AI Evaluator** (existing): Quick ad-hoc grading with custom criteria, file upload, instant AI scoring
- **Assignments**: Create/manage rubric-based assignments (name, subject, multi-criteria with point values); stored in `rubrics` + `rubric_criteria` DB tables; `POST /api/rubrics`, `GET /api/rubrics`
- **Class Grader**: Bulk grade an entire class — select assignment, paste each student's work, AI grades all simultaneously; uses `POST /api/rubric-submissions` + `POST /api/rubric-evaluate-batch`; shows per-student score, grade letter (A–F), criteria breakdown, class stats; export to CSV
- **Grade Book**: View all grading history per assignment; table of student | score | % | grade | per-criterion scores; class stats (avg, highest, lowest, distribution); export to CSV; uses `GET /api/rubric-evaluations/:rubricId`
- **Report Cards**: AI generates professional report card comments; inputs: student name, subject, grade (A–F), tone (encouraging/formal/constructive/detailed), optional notes; `POST /api/generate-report-card`

### Research Assessment Feature
- **Research tab** in dashboard sidebar (Globe icon)
- **Three modes**: Topic Research, Essay Review, Fact Check
- **Web search**: Uses OpenAI Responses API with `web_search_preview` tool — searches live web for authoritative sources
- **Essay Review**: Grade (A–F), strengths, weaknesses, missing sources, recommendations
- **Fact Check**: Verifies claims against web sources, returns True/False/Partially True verdicts
- **Topic Research**: Deep-dive with key findings, debates, research gaps, recommended sources
- **Citations**: All web sources returned with title + URL, displayed as clickable source list
- **Endpoint**: `POST /api/research-assess` — non-streaming, returns `{ assessment, sources, type }`

### Key Pages
- `/` - Landing page with hero, features, stats, testimonials
- `/auth` or `/login` - Authentication (login/register with role selection)
- `/student` - Student dashboard (upload work, view submissions)
- `/teacher` - Teacher dashboard (review queue, grade submissions)
- `/solver` - Direct homework solver (ChatGPT-style UI)
- `/quiz` - Quiz generator from text
- `/essay` - Essay writer tool
- `/notes` - AI lecture notes from audio recordings
- `/pricing` - Subscription pricing page
- `/knowledge` - Knowledge base management for RAG (teachers only)

### AI Course Creator (TutorAI-style feature)
- **My Courses tab** in dashboard sidebar (GraduationCap icon)
- **Course generation**: User enters topic + difficulty + audience → Claude generates structured course (4-6 chapters, 3-5 lessons each)
- **Lesson content**: Generated on-demand via two-section format (===CONTENT=== markdown + ===QUIZ=== JSON) — cached in DB after first generation
- **Progress tracking**: Lesson completion + quiz scores tracked per user
- **Course library**: Grid of course cards with emoji, title, difficulty badge, progress bar
- **Inline quiz**: 4 MCQs per lesson with explanations and score feedback

### API Endpoints
- `POST /api/auth/register` - Register new user (bcrypt hashed password)
- `POST /api/auth/login` - Login user (bcrypt compare)
- `POST /api/submissions` - Create new submission
- `GET /api/submissions/:id` - Get submission details
- `POST /api/submissions/:id/evaluate` - Teacher evaluation
- `POST /api/submissions/:id/followup` - Ask follow-up questions
- `GET /api/student/submissions` - Student's submissions
- `GET /api/student/stats` - Student statistics
- `GET /api/teacher/pending` - Pending submissions for review
- `GET /api/teacher/stats` - Teacher statistics
- `POST /api/solve-text` - Solve text problem with AI
- `POST /api/solve-image` - Solve image problem with AI
- `POST /api/generate-quiz` - Generate quiz from text
- `POST /api/youtube-transcript` - Fetch transcript from a YouTube video URL
- `POST /api/generate-essay` - Generate essay
- `POST /api/transcribe` - Transcribe audio to text (multer file upload)
- `POST /api/generate-notes` - Generate AI study notes from transcript (streaming)
- `POST /api/knowledge/upload` - Upload single knowledge chunk (teacher only)
- `POST /api/knowledge/bulk-upload` - Bulk upload and chunk content (teacher only)
- `POST /api/knowledge/search` - Search knowledge base with vector similarity
- `GET /api/knowledge/stats` - Get knowledge base statistics
- `POST /api/solve-with-rag` - Solve problem with RAG-grounded context and citations

### Build Process
- Frontend builds to `dist/public` using Vite
- Backend bundles with esbuild
- Database schema managed with Drizzle ORM
- Run `npm run db:push` to sync schema

## External Dependencies

### AI Services
- **OpenAI API**: Image problem solving via Replit AI Integrations
- **Anthropic Claude**: Text solutions, quiz generation, essay writing

### Key NPM Packages
- drizzle-orm, drizzle-zod: Database ORM and validation
- express-session, connect-pg-simple: Server-side sessions
- bcryptjs: Password hashing
- katex, react-katex: Math rendering
- lucide-react: Icons
- tailwindcss: Styling
- wouter: Routing

## RAG (Retrieval-Augmented Generation) System

### Overview
The RAG system grounds AI answers in educational textbook content, providing cited and verified solutions.

### Architecture
- **Vector Database**: PostgreSQL with pgvector extension (HNSW indexing)
- **Embeddings**: OpenAI text-embedding-3-small (1536 dimensions)
- **Document Chunking**: Intelligent math-aware chunking preserving formulas, theorems, examples

### Knowledge Chunk Schema
- content: The educational text content
- embedding: 1536-dimensional vector for similarity search
- sourceBook: Book title (e.g., "Stewart's Calculus 8th Ed.")
- chapter, section, page: Citation metadata
- topic: Main topic (calculus, algebra, geometry, etc.)
- contentType: definition | theorem | formula | example | exercise | explanation
- difficulty: beginner | intermediate | advanced
- keywords: Extracted topic keywords
- relatedFormulas: Mathematical formulas in the content
- commonMisconceptions: Common student mistakes

### RAG-Enhanced Solving
1. User submits a math problem
2. System generates embedding for the problem
3. Vector similarity search finds relevant knowledge chunks
4. Context is formatted with citations and added to AI prompt
5. AI generates grounded solution with textbook references
6. Response includes source citations and common misconceptions

### Content Types Detected
- Definitions: Math definitions and terminology
- Theorems: Proofs, lemmas, corollaries
- Formulas: Mathematical equations and rules
- Examples: Worked problems with solutions
- Exercises: Practice problems
- Explanations: Conceptual explanations

### Files
- `server/rag/embeddings.ts` - OpenAI embedding generation
- `server/rag/chunker.ts` - Math-aware document chunking
- `server/rag/retrieval.ts` - Vector similarity search and context formatting
