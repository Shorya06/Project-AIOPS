# Changelog

All notable changes to the AI-Powered Self-Healing AIOps Platform will be documented in this file.

## [1.0.0-RC1] - 2026-07-13

### Added
*   **Kubernetes Telemetry**: Configured `GET /api/v1/observer/kubernetes` in observer service using the configured Kubernetes client to query active workloads.
*   **Gemini History Registry**: Configured `GET /api/v1/healing/analysis` exposing database history records of diagnoses, prompts, and reasoning logs.
*   **Alerts Cache**: Implemented a thread-safe alarm cache inside `AlertController` returning firing alertmanager webhook payloads via `GET /api/v1/alerts`.
*   **Audit ledger client-side join**: Consolidated operations logs and analysis records on `correlationId` keys.
*   **Lens workloads tabs**: Enabled workloads tab arrays in the frontend Kubernetes view displaying live pods, deployments, and namespaces.
*   **Kubernetes Tuning**: Added requests/limits and liveness/readiness probes targeting `/actuator/health` in all deployment configurations.
*   **Theme stability**: Dark/Light theme switching persisted in `localStorage`.
*   **SRE Widgets**: Built custom components (`JsonViewer`, `StatusTimeline`, `ConfidenceBadge`, `ExecutionBadge`).
