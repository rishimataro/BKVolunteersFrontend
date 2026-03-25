# React TS Starter Kit

A production-ready React starter kit built with React 19, TypeScript, and Vite. Designed for scalability, maintainability, and a great developer experience.

## Features

- **React 19 & TypeScript**: Latest stable versions with React Compiler enabled.
- **Vite**: Ultra-fast dev server and optimized builds.
- **Feature-First Architecture**: Organized by domain (Auth, Users, etc.) for scalability.
- **State Management**:
    - **Server State**: [TanStack Query v5](https://tanstack.com/query/latest) for robust data fetching and caching.
    - **Client State**: [Zustand](https://github.com/pmndrs/zustand) for simple, global state.
- **Routing**: [React Router 7](https://reactrouter.com/en/main) with lazy loading and protected routes.
- **Authentication**: Pre-configured auth flow with JWT, refresh tokens, and persistence via `react-query-auth`.
- **UI Components**: Built with [Tailwind CSS](https://tailwindcss.com/) and [Shadcn UI](https://ui.shadcn.com/) (using Radix UI).
- **Form Management**: [React Hook Form](https://react-hook-form.com/) with [Zod](https://zod.dev/) validation.
- **Testing**:
    - **Unit/Integration**: [Vitest](https://vitest.dev/) with React Testing Library.
    - **E2E**: [Playwright](https://playwright.dev/).
    - **Mocking**: [MSW (Mock Service Worker)](https://mswjs.io/) for API mocking.
- **DX Optimized**:
    - [Plop](https://plopjs.com/) for code generation.
    - [Husky](https://typicode.github.io/husky/) & [Lint-staged](https://github.com/okonet/lint-staged) for pre-commit hooks.
    - Custom VS Code settings and extensions.

## Directory Structure

```text
src/
├── app/                 # App entry, providers, global router
│   ├── routes/          # Route definitions (importing features)
│   ├── provider.tsx     # Global context providers (Query, Theme, Auth)
│   └── index.tsx        # Root component
├── components/          # Truly global, reusable UI (Shadcn)
│   ├── ui/              # Base atoms (Button, Input)
│   └── layouts/         # Shared layouts (DashboardLayout, AuthLayout)
├── features/            # Business logic grouped by domain
│   └── [feature]/
│       ├── api/         # React Query hooks + Axios calls
│       ├── components/  # Feature-specific UI
│       ├── hooks/       # Feature-specific logic
│       ├── types/       # Feature types/schemas
│       └── index.ts     # Public API (what other features can see)
├── lib/                 # Core utilities (api-client, utils)
├── config/              # Environment vars, constants, paths
├── testing/             # Test setup, MSW handlers, mocks
└── types/               # Global/Shared TypeScript types
```

## Getting Started

### Prerequisites

- Node.js (v20+)
- pnpm (recommended)

### Installation

1. Clone the repository.
2. Install dependencies:
    ```bash
    pnpm install
    ```
3. Set up environment variables:
    ```bash
    cp .env.example .env
    ```

### Development

Start the development server:

```bash
pnpm dev
```

### Build

Build for production:

```bash
pnpm build
```

### Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Vitest UI
pnpm test:ui
```

### Code Generation

Generate new components or features:

```bash
pnpm generate
```

## 🛡️ Security

- **Environment Validation**: Zod-validated environment variables at runtime.
- **API Client**: Axios interceptors for automatic JWT handling and refresh logic.
- **Protected Routes**: Easy-to-use `<ProtectedRoute />` component.
