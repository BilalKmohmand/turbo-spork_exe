# BrainBoost - AI Education Platform

## Overview

BrainBoost is a full-featured AI-powered education platform where students can upload homework for AI solutions and teachers can review and grade student work. It's a complete SaaS application with authentication, role-based dashboards, and AI-powered tools.

## User Preferences

Preferred communication style: Simple, everyday language.

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
  - OpenAI API for image problem solving (gpt-4o)
  - Anthropic Claude for text solutions and content generation
- **Database**: PostgreSQL with Drizzle ORM
- **Storage**: In-memory storage (development mode)

### User Roles
- **Student**: Upload homework, get AI solutions, view submission history
- **Teacher**: Review student submissions, provide scores and feedback

### Data Models
- **Users**: id, email, displayName, password, role (student/teacher), createdAt
- **Submissions**: id, studentId, title, subject, content, status, aiSolution, aiSteps, aiExplanation
- **Evaluations**: id, submissionId, teacherId, score, feedback, reviewedAt

### Key Pages
- `/` - Landing page with hero, features, stats, testimonials
- `/auth` or `/login` - Authentication (login/register with role selection)
- `/student` - Student dashboard (upload work, view submissions)
- `/teacher` - Teacher dashboard (review queue, grade submissions)
- `/solver` - Direct homework solver (ChatGPT-style UI)
- `/quiz` - Quiz generator from text
- `/essay` - Essay writer tool
- `/pricing` - Subscription pricing page

### API Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/submissions` - Create new submission
- `GET /api/submissions/:id` - Get submission details
- `POST /api/submissions/:id/evaluate` - Teacher evaluation
- `GET /api/student/submissions` - Student's submissions
- `GET /api/student/stats` - Student statistics
- `GET /api/teacher/pending` - Pending submissions for review
- `GET /api/teacher/stats` - Teacher statistics
- `POST /api/solve-text` - Solve text problem with AI
- `POST /api/solve-image` - Solve image problem with AI
- `POST /api/generate-quiz` - Generate quiz from text
- `POST /api/generate-essay` - Generate essay

### Build Process
- Frontend builds to `dist/public` using Vite
- Backend bundles with esbuild
- Database schema managed with Drizzle ORM

## External Dependencies

### AI Services
- **OpenAI API**: Image problem solving via Replit AI Integrations
- **Anthropic Claude**: Text solutions, quiz generation, essay writing

### Key NPM Packages
- drizzle-orm, drizzle-zod: Database ORM and validation
- katex, react-katex: Math rendering
- lucide-react: Icons
- tailwindcss: Styling
- wouter: Routing
