# AI Education Platform

## Overview

This is an AI-powered student-teacher education platform that enables students to submit assignments and receive AI-generated feedback, while teachers can review, grade, and manage submissions. The platform features role-based dashboards, real-time AI evaluation using OpenAI, and a comprehensive submission tracking system.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state and data fetching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming (light/dark mode support)
- **Build Tool**: Vite for development and production builds

The frontend follows a role-based structure with separate route groups for students (`/student/*`) and teachers (`/teacher/*`). The app uses a persistent sidebar layout with context-aware navigation based on user role.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful JSON API endpoints under `/api/*`
- **AI Integration**: OpenAI API (via Replit AI Integrations) for evaluating student submissions
- **Storage**: In-memory storage implementation (`MemStorage` class) with interface abstraction (`IStorage`) allowing easy database migration

The backend includes pre-built Replit integration modules for:
- Chat functionality with conversation persistence
- Image generation capabilities
- Batch processing utilities with rate limiting and retries

### Data Models
- **Users**: Basic authentication structure with username/password
- **Assignments**: Educational tasks with title, subject, description, due date, and max score
- **Submissions**: Student work with multi-stage status tracking (pending → ai_graded → teacher_reviewed)
- **Evaluation Scores**: AI-generated metrics including accuracy, completeness, creativity, and overall score

### Build Process
- Frontend builds to `dist/public` using Vite
- Backend bundles with esbuild, selectively bundling common dependencies for faster cold starts
- Single unified build script at `script/build.ts`

## External Dependencies

### AI Services
- **OpenAI API**: Used for AI-powered assignment evaluation via Replit AI Integrations
  - Environment variables: `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`
  - Model: gpt-4.1-mini for text evaluation, gpt-image-1 for image generation

### Database
- **PostgreSQL**: Configured via Drizzle ORM with schema in `shared/schema.ts`
  - Connection string: `DATABASE_URL` environment variable
  - Session storage: connect-pg-simple for Express sessions
  - Currently using in-memory storage; Postgres integration ready when provisioned

### Key NPM Packages
- **drizzle-orm / drizzle-kit**: Database ORM and migrations
- **zod / drizzle-zod**: Schema validation
- **react-hook-form / @hookform/resolvers**: Form handling
- **date-fns**: Date formatting utilities
- **p-limit / p-retry**: Rate limiting and retry logic for batch AI operations