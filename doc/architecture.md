# Architecture & Project Structure

This project follows a feature-based architecture, similar to the "Bulletproof React" pattern, which promotes scalability and maintainability.

## Folder Structure

- `src/app`: Application entry point, global providers, and routing.
- `src/assets`: Static assets like images and global styles.
- `src/components`: Shared components used across multiple features (UI components, layouts, etc.).
- `src/config`: Global configuration, environment variables, and route paths.
- `src/features`: Feature-specific code. Each feature is self-contained with its own components, hooks, types, and API logic.
- `src/hooks`: Global React hooks.
- `src/lib`: Reusable library configurations (e.g., API clients, authentication, React Query setup).
- `src/testing`: Test setup and mock data.
- `src/types`: Global TypeScript types and API schemas.
- `src/utils`: Global utility functions.

## Key Patterns

### Feature-Based Organization

Code is organized by feature rather than by type (e.g., all authentication-related code is in `src/features/auth`). This makes it easier to find and modify code related to a specific piece of functionality.

### Centralized Routing

All application routes are defined in `src/app/router.tsx`, using the paths defined in `src/config/paths.ts`. This ensures consistency and makes it easy to update URLs across the app.

### Authentication & Authorization

Authentication is handled globally via `AuthProvider` and `useUser` hook. Access to specific routes or components is controlled using `ProtectedRoute` and `Authorization` components.
