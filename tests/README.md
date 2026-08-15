# Test structure

- `unit/` contains focused tests for isolated domain and utility behavior.
- `integration/` contains API and service tests across module boundaries.
- `components/` contains DOM and interaction tests for React components.

Test imports use the `@/` project alias so the suite remains independent from
the production source directory layout.
