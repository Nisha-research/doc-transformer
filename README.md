# StudyForge

StudyForge is a TypeScript-based document transformation and learning workspace. It helps users turn PDFs, presentation slides, notes, and other supported documents into organized, reusable learning materials. Instead of manually reading, summarizing, and restructuring every document, users can upload source content, choose an output format, and work with the resulting notes, flashcards, mind maps, infographics, or presentation decks in one place.

The project is designed as a modern, responsive web application with a clear document-to-knowledge workflow. It combines a React and Vite frontend with Supabase-backed authentication and data services, reusable UI components, client-side routing, document rendering, export utilities, and testing support. The application also includes protected routes for the main workspace and administration area, helping keep user-facing and administrative functionality separated.

## Why StudyForge?

Long documents often contain valuable information but can be difficult to review, remember, and present. StudyForge focuses on making that information easier to understand and reuse. A single source document can be transformed into different formats depending on the user's goal: concise notes for review, flashcards for active recall, mind maps for exploring relationships, infographics for visual explanations, or slide decks for presenting the material.

The interface is built around a guided workflow that keeps document upload, output selection, results review, and export in the same application. This makes the project useful for students, researchers, educators, professionals, and anyone who needs to convert reference material into practical knowledge assets.

## Overview

The application provides a focused document-to-knowledge workflow:

1. Sign in or create an account.
2. Upload a supported document.
3. Select the desired output format.
4. Review and interact with the generated content.
5. Export or use the results for studying, planning, or presenting.

The project includes authenticated user routes, an administrative area, responsive layouts, theme support, error handling, lazy-loaded pages, loading states, notifications, and a component-based UI architecture.

## Features

- Document upload workflow with drag-and-drop support.
- Multiple transformation modes, including:
  - Study notes and summaries
  - Flashcards
  - Mind maps
  - Infographics
  - Presentation decks
- Rich document and result rendering.
- Authentication and protected application routes.
- Admin dashboard route for administrative workflows.
- Responsive design for desktop and mobile layouts.
- Light and dark theme support.
- Toast notifications, error boundaries, and loading states.
- Client-side routing with a not-found page.
- Lazy loading for application pages.
- Export capabilities powered by DOCX, PDF, and PowerPoint libraries.
- Type-safe forms and validation with React Hook Form and Zod.
- Visualization support with React Flow, Dagre, Recharts, and related utilities.
- Automated testing support with Vitest, Testing Library, JSDOM, and Playwright.

## Tech Stack

- **Language:** TypeScript
- **Frontend:** React 18
- **Build tool:** Vite
- **Styling:** Tailwind CSS, PostCSS, and CSS
- **UI components:** Radix UI and custom components
- **Routing:** React Router
- **Data and state utilities:** TanStack Query
- **Authentication and backend services:** Supabase
- **Document and presentation generation:** `docx`, `jsPDF`, and `PptxGenJS`
- **Visualization:** React Flow, Dagre, Recharts, and HTML Canvas utilities
- **Forms and validation:** React Hook Form and Zod
- **Testing:** Vitest, Playwright, JSDOM, and Testing Library

## Project Structure

```text
.
├── public/                 # Static assets
├── src/
│   ├── components/         # Shared UI and application components
│   ├── hooks/              # Reusable React hooks
│   ├── integrations/       # External service integrations
│   ├── lib/                # Shared utilities
│   ├── pages/              # Auth, workspace, admin, and fallback pages
│   ├── test/               # Test setup and test files
│   ├── App.tsx             # Application shell and route configuration
│   └── main.tsx            # Application entry point
├── supabase/               # Supabase configuration, migrations, and functions
├── package.json            # Scripts and dependencies
└── vite.config.ts          # Vite configuration
```

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm, Bun, or another compatible package manager
- Supabase credentials for features that depend on the backend integration

### Installation

Using npm:

```bash
npm install
```

Using Bun:

```bash
bun install
```

### Environment configuration

Create a local `.env` file using the variables required by the Supabase integration. Use the existing environment template or project configuration as a reference where available. Do not commit credentials, API keys, or other secrets to the repository.

### Run the development server

```bash
npm run dev
```

Vite will print the local development URL in the terminal.

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server. |
| `npm run build` | Create a production build. |
| `npm run build:dev` | Create a development-mode build. |
| `npm run preview` | Preview the production build locally. |
| `npm run lint` | Run ESLint checks. |
| `npm run test` | Run the test suite once with Vitest. |
| `npm run test:watch` | Run Vitest in watch mode. |

## Application Routes

- `/auth` — Sign-in and account access.
- `/` — Protected document transformation workspace.
- `/admin` — Protected administrative area.
- `*` — Not-found page.

## Development Notes

- Keep secrets in environment variables and out of source control.
- Run linting, tests, and a production build before opening a pull request.
- Keep reusable UI behavior in `src/components` and shared logic in `src/hooks` or `src/lib`.
- Prefer small, focused components that are easy to test and reuse.
- Update Supabase migrations when changing persistent data structures.
- Verify protected routes and authentication behavior when changing application navigation.
- Keep exported documents readable and verify generated files after modifying export logic.

## Contributing

Contributions are welcome. Before submitting a change:

1. Create a focused branch for your work.
2. Install dependencies and run the application locally.
3. Run `npm run lint`, `npm run test`, and `npm run build`.
4. Describe the problem, implementation, and testing steps in the pull request.
5. Avoid including secrets, generated credentials, or unrelated formatting changes.

## License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for the full license text.
