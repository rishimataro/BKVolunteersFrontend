# Testing Strategy

This project uses Vitest and React Testing Library for testing.

## Tools

- **Test Runner:** [Vitest](https://vitest.dev/)
- **Component Testing:** [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- **Utilities:** `jest-dom` for DOM assertions.

## Test Structure & Colocation

Tests are colocated with the code they test. For components, tests are located in a `__tests__` directory within the component folder.

Example:

```
src/components/ui/notifications/
├── notifications-store.ts
├── notifications.tsx
└── __tests__/
    └── notifications.test.ts
```

## Running Tests

- **Run All Tests:** `npm run test`
- **Run Tests in UI Mode:** `npm run test:ui` (opens a browser interface for running and debugging tests)
- **Watch Mode:** `npm run test` (Vitest runs in watch mode by default)

## Best Practices

- **Test Behavior, Not Implementation:** Focus on what the component _does_ from the user's perspective rather than how it's implemented internally.
- **Use Mocking Sparingly:** Use mocks for external dependencies like API calls and complex global state.
- **Write Clean & Concise Tests:** Ensure each test is easy to understand and focuses on a single aspect of the code's behavior.
