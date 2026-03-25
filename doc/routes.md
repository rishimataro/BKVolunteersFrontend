# Application Routes

This document outlines the routing structure and accessible paths within the application.

## Route Configuration

Routes are defined in `src/app/router.tsx` and utilize path definitions from `src/config/paths.ts`.

## Public Routes

These routes are accessible without authentication:

- **Home:** `/` (Renders the Landing Page)
- **Login:** `/auth/login`
- **Register:** `/auth/register`
- **Forgot Password:** `/auth/forgot-password`
- **Reset Password:** `/auth/reset-password`
- **Verify Email:** `/auth/verify-email`

## Protected Routes

These routes require authentication and are located under the `/app` prefix. If a user is not logged in, they will be redirected to the login page.

- **Dashboard:** `/app` (Main overview page)
- **Users:** `/app/users` (Admin only)
- **Profile:** `/app/profile` (User profile and settings)

## Layouts

- **Auth Layout:** Used for authentication-related pages (Login, Register, etc.).
- **Dashboard Layout:** Used for all routes under `/app`. It includes a sidebar navigation and a top header.

## Redirection Logic

- **Unauthorized Access:** If a guest tries to access any route under `/app`, they are redirected to `/auth/login?redirectTo=[current_path]`.
- **After Login:** Upon successful login, the user is redirected back to the `redirectTo` path if it exists; otherwise, they are sent to the Dashboard (`/app`).
- **Invalid Routes:** Any undefined path (`*`) will automatically redirect to the home page (`/`).
