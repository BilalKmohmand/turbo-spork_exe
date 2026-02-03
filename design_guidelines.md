# Design Guidelines: Professional AI Homework Solver

## Design Approach

**Reference-Based:** Inspired by Photomath, and Notion's clarity
**Rationale:** Educational solver apps need immediate clarity on core function (input problem → get solution) while maintaining professional credibility. Minimalist approach keeps focus on the AI interaction, gradient accents add modern polish without distraction.

## Typography System

**Font Stack:**
- Primary: Inter (Google Fonts) - All UI and content
- Math/Code: KaTeX/JetBrains Mono for equations and code snippets

**Hierarchy:**
- Hero Headline: text-5xl lg:text-6xl font-bold
- Page Headers: text-3xl font-bold
- Section Titles: text-xl font-semibold
- Solution Steps: text-lg font-medium
- Body/Input: text-base
- Labels/Metadata: text-sm font-medium

## Layout & Spacing

**Tailwind Units:** 4, 6, 8, 12, 16, 20, 24
**Container:** max-w-4xl mx-auto px-6 (narrow focus on content)
**Section Padding:** py-16 lg:py-24

## Core Application Structure

### Landing Page

**Hero Section (70vh):**
- Centered layout with gradient background overlay
- Headline: "Solve Any Problem in Seconds" + supporting tagline
- Prominent search-style input box (min-h-24, rounded-2xl, shadow-2xl)
- Placeholder: "Type or paste your math, science, or homework question..."
- Primary CTA button with backdrop-blur background: "Get Solution →"
- Trust indicators below: "Trusted by 2M+ students | 95% accuracy rate"

**Features Grid:**
- 3-column layout (grid-cols-1 md:grid-cols-3 gap-8)
- Cards with gradient top borders, icons, title, description
- Features: "Step-by-Step Solutions", "Multiple Subject Support", "Instant Answers"

**How It Works:**
- 3-step visual walkthrough with large numbered badges
- Step cards with illustrations: 1) Enter Problem 2) AI Analyzes 3) Get Detailed Solution

**Social Proof:**
- 2-column testimonial cards with student photos, quotes, subjects solved
- Trust badges: Subjects supported, accuracy metrics

**Final CTA:**
- Centered section with gradient background
- Large input replica + "Start Solving Now" button
- Secondary text: "No signup required for first 3 problems"

### Solver Interface (Main App)

**Header:**
- Logo left, "New Problem" button, History dropdown, Profile right
- Sticky positioning (sticky top-0), subtle shadow on scroll

**Problem Input Area:**
- Full-width card (rounded-2xl p-8 shadow-lg)
- Large textarea (min-h-48) with auto-expand
- Image upload zone (dashed border): "Upload problem photo"
- Subject selector pills: Math, Physics, Chemistry, Biology, etc.
- Submit button: Gradient background, large (px-8 py-4)

**Solution Display:**
- White card with generous padding (p-12)
- Problem restatement at top (bg-gray-50 rounded-xl p-6)
- Step-by-step breakdown with numbered sections
- Each step: Bold title + detailed explanation + visual aids
- Math rendering with proper formatting
- Final answer highlighted in gradient-bordered box
- Action buttons: "New Problem", "Save Solution", "Share"

**History Sidebar (Collapsible):**
- Right-side panel (w-80) with recent problems
- Mini cards showing problem preview + timestamp
- Quick access to past solutions

## UI Components

**Input Fields:**
- Large, rounded borders (rounded-xl border-2)
- Focus state: gradient ring effect
- Generous padding (p-4)

**Cards:**
- White background, rounded-2xl, shadow-md
- Hover: shadow-xl transition

**Buttons:**
- Primary: Gradient background (purple-to-blue), rounded-xl, font-semibold
- Secondary: Outlined with gradient border
- All buttons: px-6 py-3 minimum

**Badges:**
- Subject tags: rounded-full px-4 py-1.5, gradient backgrounds
- Status indicators: Small pills with icons

**Solution Steps:**
- Numbered circles (gradient background, white text)
- Connected with vertical gradient lines
- Each step in expandable card

**Gradient Accents:**
- Hero backgrounds: purple → blue
- Button backgrounds: indigo → purple
- Border accents: cyan → blue
- Use sparingly for emphasis only

## Icons

**Library:** Heroicons (outline style for cleaner look)
**Sizes:** 24x24 for primary actions, 20x20 for navigation, 16x16 inline

## Images

**Hero Section:**
- Large, high-quality image showing students studying with laptops/tablets
- Image should convey: focused learning, modern technology, diversity
- Treatment: Gradient overlay (purple/blue with 60% opacity) for text legibility
- Position: Full-width background, centered student in focus
- Alt: "Students using AI homework solver on laptops"

**Feature Section:**
- Small illustrations (not photos): Icons representing math symbols, lightbulbs, checkmarks
- Max 200x200, centered above feature descriptions

**How It Works:**
- 3 simple line-art illustrations showing: 1) Typing/uploading 2) AI processing 3) Solution appearing
- Consistent style, 2-color scheme matching gradients

**Testimonials:**
- Circular profile photos (96x96), authentic student portraits
- Diverse representation

**No decorative images** - all imagery serves functional purpose

## Animations

**Strategic Use Only:**
- Solution reveal: Fade-in each step sequentially (stagger delay)
- Input focus: Subtle scale + gradient ring glow
- Button loading: Spinning gradient border during AI processing
- Success state: Checkmark animation when solution ready
- Page transitions: Smooth fade (300ms)

## Accessibility

- High contrast maintained (WCAG AA)
- All interactive elements keyboard navigable
- Focus rings on all inputs/buttons (gradient-styled ring-2)
- Alt text for all images
- Proper heading hierarchy
- Screen reader labels for icon buttons