# Contributing to SRE AIOps Platform

We welcome CSE contributions to the AI-Powered Self-Healing AIOps Platform! Please follow these guidelines:

## 1. Development Process

1.  **Fork** the repository and create your branch from `main`.
2.  **Verify Java changes** by running `mvn clean compile` locally.
3.  **Verify React changes** by running `npm run build` and `npm run lint` inside the `frontend/` directory.
4.  Commit clean, incremental changes with clear SRE-focused titles (e.g. `fix: add liveness checks in gateway deployment`).

## 2. Coding Standards

*   **Java**: Follow standard Spring Boot naming conventions. Inject dependencies via constructor injection. Add JavaDoc header blocks to all new controllers and services.
*   **React**: Use TypeScript types for all custom components. Keep components presentational-only; perform SRE calculations inside the service class layers.

## 3. Pull Requests

*   Fill out the Pull Request template completely.
*   Confirm that zero mock or synthetic telemetry logs are introduced.
