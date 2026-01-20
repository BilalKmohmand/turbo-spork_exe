# Gradeio - AI Education Platform

## Overview

Gradeio is a full-featured AI-powered education platform where students can upload homework for AI solutions and teachers can review and grade student work. It's a complete SaaS application with authentication, role-based dashboards, and AI-powered tools.

## User Preferences

Preferred communication style: Simple, everyday language.

## Production Notes

### Current Status: Production-Ready
- **Database**: PostgreSQL with Drizzle ORM (DatabaseStorage class)
- **Sessions**: Server-side sessions with express-session + connect-pg-simple
- **Authentication**: Bcrypt password hashing (10 rounds)
- **Payments**: Stripe integration available but not configured (user dismissed setup)

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
- **Teacher**: Review student submissions, provide scores and feedback

### Data Models
- **Users**: id, email, displayName, password (hashed), role (student/teacher), createdAt
- **Submissions**: id, studentId, title, subject, content, status, aiSolution, aiSteps, aiExplanation
- **Evaluations**: id, submissionId, teacherId, score, feedback, reviewedAt
- **Sessions**: PostgreSQL table "user_sessions" (auto-created)
- **KnowledgeChunks**: RAG knowledge base with vector embeddings (1536 dimensions)

### Key Pages
- `/` - Landing page with hero, features, stats, testimonials
- `/auth` or `/login` - Authentication (login/register with role selection)
- `/student` - Student dashboard (upload work, view submissions)
- `/teacher` - Teacher dashboard (review queue, grade submissions)
- `/solver` - Direct homework solver (ChatGPT-style UI)
- `/quiz` - Quiz generator from text
- `/essay` - Essay writer tool
- `/pricing` - Subscription pricing page
- `/knowledge` - Knowledge base management for RAG (teachers only)

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
- `POST /api/generate-essay` - Generate essay
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
