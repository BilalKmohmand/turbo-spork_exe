# Design Guidelines: AI-Powered Student-Teacher Platform

## Design Approach

**System Selected:** Material Design-inspired with Notion-like information density
**Rationale:** Educational platforms require clear hierarchy, efficient workflows, and data-heavy interfaces. Material Design provides structured patterns for dashboards, forms, and data display while maintaining approachability.

## Typography System

**Font Stack:**
- Primary: Inter (Google Fonts) - UI elements, body text
- Secondary: JetBrains Mono - Code/assignment snippets

**Hierarchy:**
- Page Titles: text-4xl font-bold
- Section Headers: text-2xl font-semibold
- Card Titles: text-lg font-medium
- Body Text: text-base font-normal
- Metadata/Labels: text-sm font-medium
- Captions: text-xs

## Layout & Spacing System

**Tailwind Units:** Consistently use 4, 6, 8, 12, 16, 20 for spacing (p-4, gap-6, my-8, etc.)

**Grid System:**
- Container: max-w-7xl mx-auto px-6
- Two-column layouts: grid grid-cols-1 lg:grid-cols-3 (sidebar + main content split)
- Card grids: grid-cols-1 md:grid-cols-2 lg:grid-cols-3

## Core Application Structure

### Dashboard Layout (Both Roles)
- **Persistent Sidebar:** Fixed left navigation (w-64), icons + labels, role-specific menu items
- **Top Bar:** User profile, notifications, search, breadcrumbs
- **Main Content Area:** Scrollable, dynamic based on view (ml-64 to account for sidebar)

### Student Dashboard Components

**Hero Section (Dashboard Home):**
- Welcome banner with student name and quick stats (assignments pending, completed, grades)
- No full-screen hero - functional dashboard layout
- Quick action cards: "Upload Assignment", "View Feedback", "Check Grades"

**Assignment Upload Component:**
- Large dropzone (min-h-64): "Drag & drop or click to upload" with file type icons
- File list with progress bars after selection
- Assignment details form: Title, Subject, Due Date, Description
- Prominent "Submit to AI" button

**Assignment List View:**
- Card-based layout with: Assignment title, subject tag, status badge, submission date, AI score
- Filter tabs: All | Pending | Graded | Overdue
- Search bar for quick access

**AI Results Display:**
- Split view: Original submission (left) + AI evaluation (right)
- Syntax highlighting for code submissions
- Score breakdown cards: Accuracy, Completeness, Creativity
- Expandable feedback sections

### Teacher Dashboard Components

**Evaluation Queue:**
- Table view with sortable columns: Student Name, Assignment, Subject, Submitted Date, AI Score, Status
- Batch selection checkboxes
- Status filters: Needs Review | AI-Graded | Manually Graded

**Assignment Review Interface:**
- Three-panel layout:
  - Left (w-1/4): Student info sidebar with past performance
  - Center (w-1/2): Assignment content with annotation tools
  - Right (w-1/4): AI analysis + grading form
- Inline commenting system with line-by-line feedback
- Override AI grade option with justification field

**Class Analytics:**
- Grid of metric cards: Average Score, Completion Rate, Common Mistakes
- Bar chart: Assignment difficulty distribution
- Student performance table with trend indicators

## UI Component Library

**Navigation:**
- Sidebar: Stacked links with icons (from Heroicons), active state with left border indicator
- Breadcrumbs: text-sm with slash separators

**Forms:**
- Input fields: Bordered (border-2), rounded-lg, p-3, focus:ring-2 ring offset
- Labels: text-sm font-medium mb-2
- File upload: Dashed border (border-dashed), hover state transition
- Textareas: min-h-32 for descriptions

**Data Display:**
- Cards: rounded-xl, shadow-sm, p-6, hover:shadow-md transition
- Tables: Striped rows, sticky header, hover row highlight
- Badges: rounded-full px-3 py-1 text-xs for status (Success/Warning/Info styles)
- Progress bars: rounded-full h-2 with animated fill

**Buttons:**
- Primary: Large click targets (px-6 py-3), rounded-lg, font-medium
- Secondary: Outlined variant
- Icon buttons: Circular (rounded-full) for actions
- Upload button: Dashed border matching dropzone aesthetic

**Overlays:**
- Modal dialogs: max-w-2xl, centered, backdrop blur
- Dropdowns: shadow-lg, rounded-lg, py-2
- Tooltips: text-xs, rounded-md, absolute positioning

## Icons

**Library:** Heroicons (via CDN)
**Usage:**
- Navigation: 20x20 icons beside labels
- Action buttons: 16x16 inline icons
- Status indicators: 12x12 colored dots
- File types: 24x24 document icons in upload zones

## Images

**Image Usage:**
- **No large hero image** - This is a functional dashboard application
- **Profile avatars:** Circular, 40x40 in headers, 96x96 in profile views
- **Empty states:** Illustration placeholders for "No assignments yet" (centered, max-w-sm)
- **Assignment thumbnails:** Preview of uploaded files (aspect-square, 120x120)

**Placeholder Descriptions:**
- Student empty state: Friendly illustration of student with books, centered with "Upload your first assignment to get started"
- Teacher empty state: Desk with papers illustration, "No submissions to review"

## Animations

**Minimal, purposeful only:**
- Loading spinners for AI processing
- Success checkmark animation on submission
- Smooth transitions on card hovers (duration-200)
- Page transitions: Fade-in content on route change

## Accessibility

- All form inputs with visible labels and aria-labels
- Keyboard navigation support throughout
- Focus indicators on all interactive elements (ring-2)
- Alt text for all images and icons
- WCAG AA contrast ratios maintained