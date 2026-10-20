# StudyForge

StudyForge is a TypeScript-based web application that turns documents into useful learning materials. Upload PDFs, slides, or notes and transform them into structured study guides, flashcards, mind maps, infographics, and presentation decks from a single workspace.

## Overview

The application provides a focused document-to-knowledge workflow:

1. Sign in or create an account.
2. Upload a supported document.
3. Select the desired output format.
4. Review and interact with the generated content.
5. Export or use the results for studying, planning, or presenting.

The project includes authenticated user routes, an administrative area, responsive layouts, theme support, error handling, and a component-based UI.

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
- Toast notifications and loading states.
- Client-side routing with a not-found page.
- Export capabilities powered by DOCX, PDF, and PowerPoint libraries.
- Type-safe forms and validation with React Hook Form and Zod.
- Automated testing support with Vitest, Testing Library, and Playwright.

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

```bash
npm install
```

### Environment configuration

Create a local `.env` file using the variables required by the Supabase integration. Do not commit credentials or other secrets to the repository.

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
- Run linting and tests before opening a pull request.
- Keep reusable UI behavior in `src/components` and shared logic in `src/hooks` or `src/lib`.
- Update Supabase migrations when changing persistent data structures.

## License

No license has been specified for this repository yet.
