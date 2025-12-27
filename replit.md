# AI Homework Solver (Solvely Competitor Demo)

## Overview

This is a Solvely-style AI homework solver that allows students to upload homework problems (via file upload or camera) and receive step-by-step solutions instantly. The app includes follow-up question capability so students can ask clarifying questions about the solution.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **State Management**: TanStack React Query for server state and data fetching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming (light/dark mode support)
- **Build Tool**: Vite for development and production builds

The frontend is a single-page app with a clean, polished interface:
- Upload file or take photo buttons
- Step-by-step solution display
- Follow-up question chat interface

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful JSON API endpoints under `/api/*`
- **AI Integration**: OpenAI API (via Replit AI Integrations) for solving problems step-by-step
- **Storage**: In-memory storage implementation (demo mode - data resets on restart)

### Data Models
- **Submissions**: User problems with AI solutions
  - `content`: The problem text/file content
  - `aiSolution`: The final answer
  - `aiSteps`: Array of step-by-step solution steps
  - `aiExplanation`: Key concepts explanation
  - `messages`: Follow-up conversation history

### Build Process
- Frontend builds to `dist/public` using Vite
- Backend bundles with esbuild
- Single unified build script at `script/build.ts`

## External Dependencies

### AI Services
- **OpenAI API**: Used for AI-powered problem solving via Replit AI Integrations
  - Environment variables: `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`
  - Model: gpt-4.1-mini for text solutions

### Key NPM Packages
- **zod / drizzle-zod**: Schema validation
- **lucide-react**: Icons
- **tailwindcss**: Styling