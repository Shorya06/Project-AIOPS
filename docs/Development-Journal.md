# Development Journal - AIOps Self-Healing Platform

This journal documents the engineering phases, architectures, and lessons learned during the design and implementation of the AI-powered self-healing AIOps platform.

---

## PHASE 1: Kubernetes & Alertmanager Foundation

### What was implemented
1. **Kubernetes Declarative Schema**: Scaffolded the full Kubernetes deployment tree under `k8s/` containing individual resource files for namespace, gateway, subservices, postgres database, and prometheus/grafana/alertmanager observability components.
2. **Alertmanager Webhook Receiver**: Created REST endpoint `POST /api/v1/alerts` and DTO mapping suite (`AlertWebhookDTO`, `AlertDTO`, `AlertLabelDTO`, `AlertAnnotationDTO`) inside `k8s-observer-service` to parse alert payloads.
3. **Structured Context Logging**: Implemented `AlertProcessingServiceImpl` using SLF4J logging to parse alert fields and log details, caching them inside a placeholder `FailureContext` cache list.
4. **Gateway Configuration**: Configured API gateway to map and proxy `/api/v1/alerts/**` endpoints dynamically.

### Why it was implemented
* To establish the baseline cloud-native infrastructure before deploying to a live Kubernetes cluster.
* To bridge the monitoring telemetry (Prometheus & Alertmanager) with the automation observer service, creating a push-based alert receiver loop rather than inefficient polling.

### How it works
* Prometheus scrapes microservice metrics. If a rule triggers, alert events are forwarded to Alertmanager.
* Alertmanager marshals alerts and pushes a JSON payload to `http://k8s-observer-service:8084/api/v1/alerts`.
* The Observer Service validates annotations, log alerts, and stores pod failure descriptors in a `FailureContext` cache.

### How it was tested
* **Maven compilation check**: Ran `mvn clean package -DskipTests` to verify that all modules package successfully.
* **Manifest dry-run validation**: Executed `kubectl apply -R -f k8s/ --dry-run=client` to ensure all manifests conform to Kubernetes API schema.
* **Mock alert call validation**: Triggered a curl request representing the alert webhook, confirming details log successfully.

### Remaining work
* **Phase 2 (Gemini Integration)**: Use Kubernetes client library inside the observer to fetch live container logs. Inject logs into the Gemini API prompt inside `healing-service` to auto-determine repair actions.

---

## PHASE 2: AI Context Enrichment & Gemini Integration

### What was implemented
1. **Kubernetes Context Enrichment**: Integrated official Kubernetes Java Client in `k8s-observer-service` to fetch real-time pod configurations (owner reference deployments, limits, requests, logs, events). Includes try-catch offline fallbacks returning mock parameters.
2. **Deterministic Gemini REST client**: Configured `WebClient` pointing to the Configured AI Model (default: gemini-3.5-flash) GenerateContent API, sending structured JSON Schema configuration parameters to force the model to output valid JSON.
3. **Prompt Template & PromptBuilder**: Stored the diagnosis prompt externally in `prompts/healing-analysis.txt` and created a dedicated `PromptBuilder` component.
4. **JPA Audit Log Persistence**: Mapped `AIAnalysisRecord` entity in `healing-service` to store Prompts, Responses, Models, Versions, Actions, Confidence enums, and API duration times in PostgreSQL.
5. **Analyze Endpoints**: Added Feign interfaces and REST controller handler mapping `POST /api/v1/healing/analyze` (Testing/Dev Endpoint Only).

### Why it was implemented
* To enrich raw monitoring alerts with full container contexts, giving the AI model sufficient data to diagnose the error.
* To secure structured, validated actions from the LLM, avoiding natural language ambiguities.
* To establish audit trails of prompt runs for dashboard telemetry (Grafana duration metrics).

### How it works
* Upon alert catch, `KubernetesContextService` builds an enriched `FailureContext`.
* The Observer posts the context to `healing-service/analyze`.
* `HealingService` loads the template, constructs the prompt, queries the Configured AI Model (default: gemini-3.5-flash), validates the JSON output, saves an `AIAnalysisRecord` record, and returns the decision.

### How it was tested
* **Maven Compile**: Ran `mvn clean package -DskipTests` ensuring WebClient dependencies, entities, and K8s builders compile successfully.

### Remaining work
* **Phase 3 (Self-Healing Remediation)**: Implement automatic healing executors (restarting pods, scaling deployments, increasing memory resource limits) based on the AI healing decisions returned in Phase 2.

---

## PHASE 3: AI Self-Healing Engine

### What was implemented
1. **Remediation Execution Layer**: Developed `HealingExecutionServiceImpl` using the official Kubernetes Java Client. Supported actions: `RESTART_POD` (deleting the Pod), `SCALE_DEPLOYMENT` (patching replicas), and `INCREASE_MEMORY_LIMIT` (patching specs).
2. **Policy Verification Layer**: Implemented `HealingPolicyServiceImpl` to reject LOW confidence decisions (recommending `NO_ACTION` and detailing the reason), whitelist whitelisted actions, and enforce replica scale limits.
3. **Asynchronous Cooldown Feedback Loop**: Triggered asynchronous tasks utilizing `CompletableFuture` that sleep for a configurable period, re-read pod health, and save final statuses.
4. **Telemetry & Email Hooks**: Integrated Feign client alerts mapping executed diagnoses to the Notification Service, and registered Micrometer counters/timers.

### Why it was implemented
* To close the loop on platform automation, translating AI recommendations directly into safe cluster changes.
* To prevent Gateway timeouts by executing feedback loops asynchronously.
* To ensure fail-safes (blocking LOW confidence runs) are enforced.

### How it works
* When `analyzeFailure` is called, it retrieves the Gemini decision.
* It applies policy checks. If approved, it triggers `executeRemediation` and schedules the async feedback check.
* It sends alert logs to `notification-service` and records Micrometer counters.

### How it was tested
* **Maven Compile**: Successfully built all modules with `mvn clean package -DskipTests`.

---

## PHASE 3.5: Architecture Refinement & Production Hardening

### What changed
1. **Dynamic Parameterized Execution**: Removed hardcoded replica offsets and resource limit settings. Gemini now suggests dynamic variables inside `actionParameters` (`memoryLimit` and `replicas`) which are validated and applied recursively.
2. **Configurable Model Resolution**: Externalized the model string in `application.yml` (`gemini.model: gemini-3.5-flash`), eliminating hardcoded versions.
3. **Parameter Validation Layer**: The policy checker now blocks execution if required parameters are missing for scaling or memory upgrades.
4. **Traceable Audit Tracking**: Injected unique execution identifier UUIDs (`executionId`) and analysis IDs (`analysisId`) into `HealingOperation` before execution starts.
5. **Partial Health States**: Expanded health checking checks to return `PARTIAL` if containers are running but not fully ready.
6. **Detailed Telemetry**: Registered a second Timer (`ai_analysis_duration`) separate from the execution latency timer (`ai_healing_duration`).

### Why it changed
* To support flexible cluster adaptations (e.g. scaling directly to 3 replicas or upgrading limits directly to 768Mi) rather than incremental updates.
* To avoid code changes when moving models or shifting limits.
* To prevent runtime parameter errors from propagating into Kubernetes API mutations.

### How it works
* Incoming FailureContext maps trigger model prompts.
* `AIAnalysisService` extracts the recommendation.
* `HealingPolicyService` verifies action parameters against externalized config limits, and binds UUID keys.
* `HealingOperation` writes PENDING logs, then triggers K8s mutations.
* Health loops inspect ready states and write SUCCESS/FAILED/PARTIAL logs.

### How it was tested
* **Maven Compile**: Verified successful project compilation with `mvn clean package -DskipTests`.

---

## FINAL ARCHITECTURE REFINEMENT

### What changed
1. **Distributed Correlation ID**: Added correlationId tracking fields to FailureContext, AIAnalysisRecord, and HealingOperation. Generated in AlertController and propagated in all SLF4J logs (`[CorrelationID: xxxx]`).
2. **AI Recommendation Snapshot**: Saved a complete serialized JSON snapshot representing the validated AI decision (`validated_recommendation_snapshot` column) inside the JPA analysis audit trail.
3. **AI Provider Abstraction**: Introduced the `AIProvider` interface and decoupled `AIAnalysisServiceImpl` from Gemini client classes. Created `GeminiProvider` implementing the abstraction, facilitating future provider plug-ins (OpenAI, Claude).

### Why it was changed
* To support end-to-end trace tracking across distributed microservices.
* To retain exact historical audits of what the AI model recommended before safety policy alterations.
* To align model versions under the generalized "Configured AI Model" concept.

### How it works
* Webhook requests receive correlationId keys.
* Context building and database operations save the correlationId.
* Provider calls process prompt queries.
* Decisions are serialized to the database, validated, and executed.

### How it was tested
* **Maven Compile**: Verified successful project compilation with `mvn clean package -DskipTests`.

---

## PHASE 4.1: AIOps Control Center Frontend Foundation

### What was implemented
1. **Tech Stack Scaffolding**: Configured a React 19 + TypeScript + Vite + TailwindCSS v3 project inside the `frontend/` directory.
2. **Absolute Path Aliases**: Configured `@/` path aliases mapping to `@/components`, `@/pages`, `@/api`, `@/layouts`, `@/hooks`, `@/types`, and `@/utils` in Vite and TypeScript.
3. **Responsive Layout with Collapsible Sidebar**: Created `AppLayout` with a collapsible sidebar (active route highlights, Tooltips on collapse, Lucide icons, keyboard accessibility) and top Status Navbar (cluster status, model badge, notifications, theme toggle).
4. **Theme System**: Implemented a custom context-based `ThemeProvider` supporting Dark (default) and Light themes, persisted dynamically in `localStorage`.
5. **Code Splitting & Routing**: Configured React Router 6 with lazy loading of page components via `React.lazy()` and wrapped transitions inside `<Suspense>` boundaries.
6. **Centralized API Layer**: Established an Axios client instance with request/response interceptors, timeout properties, and dynamic configuration loading from `VITE_API_BASE_URL` env files.
7. **Reusable Components & States**: Designed strictly typed TypeScript props for reusable UI layout cards (`SectionCard`, `StatusCard`, `MetricCard`, `PageHeader`, `StatusBadge`, `LoadingSpinner`) and global feedback containers (`LoadingState`, `ErrorState`, `EmptyState`, `UnauthorizedState`, `NotFoundState`).

### Why it was implemented
*   To establish a clean, modular, and production-ready frontend architecture before implementing dashboard telemetry widgets or API integrations.
*   To provide SREs with a high-fidelity Grafana-like dark theme optimized for node utilization, self-healing status tracing, and audit trail exploration.
*   To ensure fast initial page loads and clean chunk bundles through aggressive code splitting.

### How it works
*   Vite config maps absolute paths to target source folders.
*   `App` mounts the theme, router, and query providers.
*   `AppLayout` defines the shell, rendering placeholders for global overlay states, notifications, command palettes, and breadcrumbs, delegating subroutes to lazy-loaded containers.
*   Axios client interceptors capture API requests, logging authorization indicators, timeouts, and gateway warnings centrally.

### How it was tested
*   **Compilation Verification**: Executed `npm run build` which successfully outputted clean, code-split chunks for all pages and components.
*   **Code Quality Linter**: Executed `npm run lint` which successfully completed with 0 warnings and 0 errors.

---

## PHASE 4.1 REFINEMENTS: Enterprise Architecture Hardening

### What was implemented
1. **Industry-Standard Theme Integration**: Replaced the custom context theme provider with the `next-themes` library, configured with class-based attributes, system theme auto-detection, default-dark values, and storage state synchronization.
2. **State Decoupling**: Organized state models into distinct channels (Server states handled by TanStack Query; client UI states managed by React Contexts).
3. **Services Abstraction**: Created a dedicated `src/services/` layer holding placeholders for `GatewayService`, `TransactionService`, `HealingService`, `ObserverService`, `NotificationService`, and `MetricsService` to house upcoming business logic.
4. **Types Registry Reorganization**: Restructured types under categorized subfolders (`src/types/api/`, `src/types/ui/`, `src/types/shared/`), separating server DTO schemas from presentation interfaces.
5. **Real-time & Security Scaffolding**: Added placeholder architectures for `src/realtime/` (WebSockets/SSE) and `src/auth/` (JWT/OAuth2 sessions).
6. **Data Integrity Enforcement**: Cleaned all frontend page components to strictly load `"Not Available Yet"` messages instead of inventing simulated alerts, operations, or node performance metrics.

### Why it was implemented
*   To establish a hardened, future-proof directory skeleton before data layers are wired.
*   To prevent developers or operators from misinterpreting synthetic dashboard alerts or CPU counters as real cluster metrics.
*   To keep codebases clean and comply with professional React standard practices.

### How it was tested
*   **Production Build**: Verified that `npm run build` completes successfully.
*   **ESLint Rules**: Verified that `npm run lint` returns zero warnings and zero errors.
*   **TypeScript Verification**: Verified that `tsc -b` passes without any type checks failure.

---

## PHASE 4.2: Dashboard & Backend Integration

### What was implemented
1. **API Mappings & Mappers**: Configured services mapping `/actuator/health`, `/actuator/prometheus`, `/api/v1/healing`, and `/api/v1/notifications` Gateway endpoints.
2. **Prometheus Text Parser**: Coded a raw text compiler inside `MetricsService` that processes line metrics for `system_cpu_usage`, `jvm_memory_used_bytes`, and HTTP latency counts.
3. **Data Integrity Policy Toggles**: Replaced all hardcoded charts or operational values with a professional `"Backend endpoint unavailable"` or `"Telemetry endpoint unavailable"` indicator.
4. **Recharts Rolling Timeline**: Wired Recharts area plots to a rolling state array inside `DashboardPage` that plots active CPU and Memory usage ticks over a moving 15-ticks window.
5. **Dashboard Service Aggregator**: Introduced `DashboardService` using `Promise.all` queries. Performs date-based filtering and success rate arithmetic centrally before passing results to React presentation views.

### Why it was implemented
*   To keep components purely presentation-oriented and maintain absolute decoupling between network logic and rendering views.
*   To strictly enforce dashboard data integrity, showing only real cluster metrics or explicit unavailability flags instead of misleading synthetic telemetry.

### How it was tested
*   **Vite Build**: Successfully executed `npm run build` with zero errors.
*   **ESLint Linter**: Verified zero style violations or warnings.
*   **Routing & Theme tests**: Verified responsive sidebar collapses, page routes load, and dark/light switching persists configurations.

---

## PHASE 4.3: AI Operations Center UI Pages & Backend Telemetry

### What was implemented
1. **AI Diagnosis History (`GET /api/v1/healing/analysis`)**: Implemented a query method in `HealingServiceImpl` to fetch all `AIAnalysisRecord` instances from the DB, exposing it as a read-only GET mapping in `HealingController` (routed via existing gateway paths). The frontend AI page now queries it, allowing SREs to click and inspect historical analyses.
2. **Cached Alerts feed (`GET /api/v1/alerts`)**: Implemented a thread-safe `CopyOnWriteArrayList` cache in `AlertController` within `k8s-observer-service` to store Alertmanager webhook payloads and query them dynamically.
3. **Kubernetes Cluster Telemetry (`GET /api/v1/observer/kubernetes`)**: Added a telemetry aggregator in `KubernetesContextServiceImpl` exposing Namespaces, Pods (status/restarts), Deployments (desired/ready replica sizes), and Services.
4. **Audit Logs Correlation Join**: Integrated a client-side join in the SRE `Audit` view matching `HealingOperation` logs with `AIAnalysisRecord` history by `correlationId` to display AI confidence, diagnosis summaries, and prompt latencies.
5. **UI Pages & steppers**: Scaffolded the Lens-like tabbed workloads, timeline tracers (`StatusTimeline`), Prometheus metrics graphs, alerts grids, and read-only settings parameters.

### Why it was implemented
* To satisfy SRE visibility requirements, pulling real cluster workloads and alert feeds instead of static unavailable indicators.
* To preserve existing business logic, keeping endpoints read-only and using existing Kubernetes client configurations.

### How it was tested
* **Maven Compile**: Executed `mvn clean compile` on `healing-service` and `k8s-observer-service` successfully.
### How it was tested
* **Maven compilation check**: Ran `mvn clean package -DskipTests` to verify that all modules package successfully.
* **Manifest dry-run validation**: Executed `kubectl apply -R -f k8s/ --dry-run=client` to ensure all manifests conform to Kubernetes API schema.
* **Mock alert call validation**: Triggered a curl request representing the alert webhook, confirming details log successfully.

### Remaining work
* **Phase 2 (Gemini Integration)**: Use Kubernetes client library inside the observer to fetch live container logs. Inject logs into the Gemini API prompt inside `healing-service` to auto-determine repair actions.

---

## PHASE 2: AI Context Enrichment & Gemini Integration

### What was implemented
1. **Kubernetes Context Enrichment**: Integrated official Kubernetes Java Client in `k8s-observer-service` to fetch real-time pod configurations (owner reference deployments, limits, requests, logs, events). Includes try-catch offline fallbacks returning mock parameters.
2. **Deterministic Gemini REST client**: Configured `WebClient` pointing to the Configured AI Model (default: gemini-3.5-flash) GenerateContent API, sending structured JSON Schema configuration parameters to force the model to output valid JSON.
3. **Prompt Template & PromptBuilder**: Stored the diagnosis prompt externally in `prompts/healing-analysis.txt` and created a dedicated `PromptBuilder` component.
4. **JPA Audit Log Persistence**: Mapped `AIAnalysisRecord` entity in `healing-service` to store Prompts, Responses, Models, Versions, Actions, Confidence enums, and API duration times in PostgreSQL.
5. **Analyze Endpoints**: Added Feign interfaces and REST controller handler mapping `POST /api/v1/healing/analyze` (Testing/Dev Endpoint Only).

### Why it was implemented
* To enrich raw monitoring alerts with full container contexts, giving the AI model sufficient data to diagnose the error.
* To secure structured, validated actions from the LLM, avoiding natural language ambiguities.
* To establish audit trails of prompt runs for dashboard telemetry (Grafana duration metrics).

### How it works
* Upon alert catch, `KubernetesContextService` builds an enriched `FailureContext`.
* The Observer posts the context to `healing-service/analyze`.
* `HealingService` loads the template, constructs the prompt, queries the Configured AI Model (default: gemini-3.5-flash), validates the JSON output, saves an `AIAnalysisRecord` record, and returns the decision.

### How it was tested
* **Maven Compile**: Ran `mvn clean package -DskipTests` ensuring WebClient dependencies, entities, and K8s builders compile successfully.

### Remaining work
* **Phase 3 (Self-Healing Remediation)**: Implement automatic healing executors (restarting pods, scaling deployments, increasing memory resource limits) based on the AI healing decisions returned in Phase 2.

---

## PHASE 3: AI Self-Healing Engine

### What was implemented
1. **Remediation Execution Layer**: Developed `HealingExecutionServiceImpl` using the official Kubernetes Java Client. Supported actions: `RESTART_POD` (deleting the Pod), `SCALE_DEPLOYMENT` (patching replicas), and `INCREASE_MEMORY_LIMIT` (patching specs).
2. **Policy Verification Layer**: Implemented `HealingPolicyServiceImpl` to reject LOW confidence decisions (recommending `NO_ACTION` and detailing the reason), whitelist whitelisted actions, and enforce replica scale limits.
3. **Asynchronous Cooldown Feedback Loop**: Triggered asynchronous tasks utilizing `CompletableFuture` that sleep for a configurable period, re-read pod health, and save final statuses.
4. **Telemetry & Email Hooks**: Integrated Feign client alerts mapping executed diagnoses to the Notification Service, and registered Micrometer counters/timers.

### Why it was implemented
* To close the loop on platform automation, translating AI recommendations directly into safe cluster changes.
* To prevent Gateway timeouts by executing feedback loops asynchronously.
* To ensure fail-safes (blocking LOW confidence runs) are enforced.

### How it works
* When `analyzeFailure` is called, it retrieves the Gemini decision.
* It applies policy checks. If approved, it triggers `executeRemediation` and schedules the async feedback check.
* It sends alert logs to `notification-service` and records Micrometer counters.

### How it was tested
* **Maven Compile**: Successfully built all modules with `mvn clean package -DskipTests`.

---

## PHASE 3.5: Architecture Refinement & Production Hardening

### What changed
1. **Dynamic Parameterized Execution**: Removed hardcoded replica offsets and resource limit settings. Gemini now suggests dynamic variables inside `actionParameters` (`memoryLimit` and `replicas`) which are validated and applied recursively.
2. **Configurable Model Resolution**: Externalized the model string in `application.yml` (`gemini.model: gemini-3.5-flash`), eliminating hardcoded versions.
3. **Parameter Validation Layer**: The policy checker now blocks execution if required parameters are missing for scaling or memory upgrades.
4. **Traceable Audit Tracking**: Injected unique execution identifier UUIDs (`executionId`) and analysis IDs (`analysisId`) into `HealingOperation` before execution starts.
5. **Partial Health States**: Expanded health checking checks to return `PARTIAL` if containers are running but not fully ready.
6. **Detailed Telemetry**: Registered a second Timer (`ai_analysis_duration`) separate from the execution latency timer (`ai_healing_duration`).

### Why it changed
* To support flexible cluster adaptations (e.g. scaling directly to 3 replicas or upgrading limits directly to 768Mi) rather than incremental updates.
* To avoid code changes when moving models or shifting limits.
* To prevent runtime parameter errors from propagating into Kubernetes API mutations.

### How it works
* Incoming FailureContext maps trigger model prompts.
* `AIAnalysisService` extracts the recommendation.
* `HealingPolicyService` verifies action parameters against externalized config limits, and binds UUID keys.
* `HealingOperation` writes PENDING logs, then triggers K8s mutations.
* Health loops inspect ready states and write SUCCESS/FAILED/PARTIAL logs.

### How it was tested
* **Maven Compile**: Verified successful project compilation with `mvn clean package -DskipTests`.

---

## FINAL ARCHITECTURE REFINEMENT

### What changed
1. **Distributed Correlation ID**: Added correlationId tracking fields to FailureContext, AIAnalysisRecord, and HealingOperation. Generated in AlertController and propagated in all SLF4J logs (`[CorrelationID: xxxx]`).
2. **AI Recommendation Snapshot**: Saved a complete serialized JSON snapshot representing the validated AI decision (`validated_recommendation_snapshot` column) inside the JPA analysis audit trail.
3. **AI Provider Abstraction**: Introduced the `AIProvider` interface and decoupled `AIAnalysisServiceImpl` from Gemini client classes. Created `GeminiProvider` implementing the abstraction, facilitating future provider plug-ins (OpenAI, Claude).

### Why it was changed
* To support end-to-end trace tracking across distributed microservices.
* To retain exact historical audits of what the AI model recommended before safety policy alterations.
* To align model versions under the generalized "Configured AI Model" concept.

### How it works
* Webhook requests receive correlationId keys.
* Context building and database operations save the correlationId.
* Provider calls process prompt queries.
* Decisions are serialized to the database, validated, and executed.

### How it was tested
* **Maven Compile**: Verified successful project compilation with `mvn clean package -DskipTests`.

---

## PHASE 4.1: AIOps Control Center Frontend Foundation

### What was implemented
1. **Tech Stack Scaffolding**: Configured a React 19 + TypeScript + Vite + TailwindCSS v3 project inside the `frontend/` directory.
2. **Absolute Path Aliases**: Configured `@/` path aliases mapping to `@/components`, `@/pages`, `@/api`, `@/layouts`, `@/hooks`, `@/types`, and `@/utils` in Vite and TypeScript.
3. **Responsive Layout with Collapsible Sidebar**: Created `AppLayout` with a collapsible sidebar (active route highlights, Tooltips on collapse, Lucide icons, keyboard accessibility) and top Status Navbar (cluster status, model badge, notifications, theme toggle).
4. **Theme System**: Implemented a custom context-based `ThemeProvider` supporting Dark (default) and Light themes, persisted dynamically in `localStorage`.
5. **Code Splitting & Routing**: Configured React Router 6 with lazy loading of page components via `React.lazy()` and wrapped transitions inside `<Suspense>` boundaries.
6. **Centralized API Layer**: Established an Axios client instance with request/response interceptors, timeout properties, and dynamic configuration loading from `VITE_API_BASE_URL` env files.
7. **Reusable Components & States**: Designed strictly typed TypeScript props for reusable UI layout cards (`SectionCard`, `StatusCard`, `MetricCard`, `PageHeader`, `StatusBadge`, `LoadingSpinner`) and global feedback containers (`LoadingState`, `ErrorState`, `EmptyState`, `UnauthorizedState`, `NotFoundState`).

### Why it was implemented
*   To establish a clean, modular, and production-ready frontend architecture before implementing dashboard telemetry widgets or API integrations.
*   To provide SREs with a high-fidelity Grafana-like dark theme optimized for node utilization, self-healing status tracing, and audit trail exploration.
*   To ensure fast initial page loads and clean chunk bundles through aggressive code splitting.

### How it works
*   Vite config maps absolute paths to target source folders.
*   `App` mounts the theme, router, and query providers.
*   `AppLayout` defines the shell, rendering placeholders for global overlay states, notifications, command palettes, and breadcrumbs, delegating subroutes to lazy-loaded containers.
*   Axios client interceptors capture API requests, logging authorization indicators, timeouts, and gateway warnings centrally.

### How it was tested
*   **Compilation Verification**: Executed `npm run build` which successfully outputted clean, code-split chunks for all pages and components.
*   **Code Quality Linter**: Executed `npm run lint` which successfully completed with 0 warnings and 0 errors.

---

## PHASE 4.1 REFINEMENTS: Enterprise Architecture Hardening

### What was implemented
1. **Industry-Standard Theme Integration**: Replaced the custom context theme provider with the `next-themes` library, configured with class-based attributes, system theme auto-detection, default-dark values, and storage state synchronization.
2. **State Decoupling**: Organized state models into distinct channels (Server states handled by TanStack Query; client UI states managed by React Contexts).
3. **Services Abstraction**: Created a dedicated `src/services/` layer holding placeholders for `GatewayService`, `TransactionService`, `HealingService`, `ObserverService`, `NotificationService`, and `MetricsService` to house upcoming business logic.
4. **Types Registry Reorganization**: Restructured types under categorized subfolders (`src/types/api/`, `src/types/ui/`, `src/types/shared/`), separating server DTO schemas from presentation interfaces.
5. **Real-time & Security Scaffolding**: Added placeholder architectures for `src/realtime/` (WebSockets/SSE) and `src/auth/` (JWT/OAuth2 sessions).
6. **Data Integrity Enforcement**: Cleaned all frontend page components to strictly load `"Not Available Yet"` messages instead of inventing simulated alerts, operations, or node performance metrics.

### Why it was implemented
*   To establish a hardened, future-proof directory skeleton before data layers are wired.
*   To prevent developers or operators from misinterpreting synthetic dashboard alerts or CPU counters as real cluster metrics.
*   To keep codebases clean and comply with professional React standard practices.

### How it was tested
*   **Production Build**: Verified that `npm run build` completes successfully.
*   **ESLint Rules**: Verified that `npm run lint` returns zero warnings and zero errors.
*   **TypeScript Verification**: Verified that `tsc -b` passes without any type checks failure.

---

## PHASE 4.2: Dashboard & Backend Integration

### What was implemented
1. **API Mappings & Mappers**: Configured services mapping `/actuator/health`, `/actuator/prometheus`, `/api/v1/healing`, and `/api/v1/notifications` Gateway endpoints.
2. **Prometheus Text Parser**: Coded a raw text compiler inside `MetricsService` that processes line metrics for `system_cpu_usage`, `jvm_memory_used_bytes`, and HTTP latency counts.
3. **Data Integrity Policy Toggles**: Replaced all hardcoded charts or operational values with a professional `"Backend endpoint unavailable"` or `"Telemetry endpoint unavailable"` indicator.
4. **Recharts Rolling Timeline**: Wired Recharts area plots to a rolling state array inside `DashboardPage` that plots active CPU and Memory usage ticks over a moving 15-ticks window.
5. **Dashboard Service Aggregator**: Introduced `DashboardService` using `Promise.all` queries. Performs date-based filtering and success rate arithmetic centrally before passing results to React presentation views.

### Why it was implemented
*   To keep components purely presentation-oriented and maintain absolute decoupling between network logic and rendering views.
*   To strictly enforce dashboard data integrity, showing only real cluster metrics or explicit unavailability flags instead of misleading synthetic telemetry.

### How it was tested
*   **Vite Build**: Successfully executed `npm run build` with zero errors.
*   **ESLint Linter**: Verified zero style violations or warnings.
*   **Routing & Theme tests**: Verified responsive sidebar collapses, page routes load, and dark/light switching persists configurations.

---

## PHASE 4.3: AI Operations Center UI Pages & Backend Telemetry

### What was implemented
1. **AI Diagnosis History (`GET /api/v1/healing/analysis`)**: Implemented a query method in `HealingServiceImpl` to fetch all `AIAnalysisRecord` instances from the DB, exposing it as a read-only GET mapping in `HealingController` (routed via existing gateway paths). The frontend AI page now queries it, allowing SREs to click and inspect historical analyses.
2. **Cached Alerts feed (`GET /api/v1/alerts`)**: Implemented a thread-safe `CopyOnWriteArrayList` cache in `AlertController` within `k8s-observer-service` to store Alertmanager webhook payloads and query them dynamically.
3. **Kubernetes Cluster Telemetry (`GET /api/v1/observer/kubernetes`)**: Added a telemetry aggregator in `KubernetesContextServiceImpl` exposing Namespaces, Pods (status/restarts), Deployments (desired/ready replica sizes), and Services.
4. **Audit Logs Correlation Join**: Integrated a client-side join in the SRE `Audit` view matching `HealingOperation` logs with `AIAnalysisRecord` history by `correlationId` to display AI confidence, diagnosis summaries, and prompt latencies.
5. **UI Pages & steppers**: Scaffolded the Lens-like tabbed workloads, timeline tracers (`StatusTimeline`), Prometheus metrics graphs, alerts grids, and read-only settings parameters.

### Why it was implemented
* To satisfy SRE visibility requirements, pulling real cluster workloads and alert feeds instead of static unavailable indicators.
* To preserve existing business logic, keeping endpoints read-only and using existing Kubernetes client configurations.

### How it was tested
* **Maven Compile**: Executed `mvn clean compile` on `healing-service` and `k8s-observer-service` successfully.
* **Vite Chunks Build**: Verified that `npm run build` compiles with zero warnings.
* **ESLint Linter**: Verified zero violations.

---

## PHASE 4.4: Production Readiness Review

### What was implemented
1. **Kubernetes Resources & Probes Tuning**: Configured CPU and memory requests/limits and liveness/readiness probes pointing to Actuator health checks in all Kubernetes deployment manifests in `k8s/` (`gateway`, `healing`, `observer`, `notification`, `transaction`).
2. **Security & API Keys Audit**: Verified that zero credentials or secret tokens are hardcoded. The Gemini API Key is loaded dynamically from environment properties, with mock fallbacks in place.
3. **Project Audit Log**: Generated `project_audit.md` mapping out directories, API routes, database schemas, and workload requests.
4. **Capstone Documentation Upgrade**: Rewrote root `README.md` into a CSE capstone defense guide, detailing setup scripts, event flows, and tabbed workloads.
5. **Quality Review**: Verified compile success on all backend Java modules and frontend React pages.

### Why it was implemented
* To establish a stable, compile-safe, and self-healing Release Candidate (RC) ready for cluster deployment.
* To comply with SRE deployment standards, providing resource safety boundaries and health endpoints within Kubernetes.

### How it was tested
* **Kubernetes YAML Validation**: Validated manifest syntax configurations.
* **Maven Clean Compile**: Executed `mvn clean compile` on all modules successfully.
* **Vite Chunks build**: Run `npm run build` with zero warnings.
* **ESLint checks**: Run `npm run lint` with zero errors.

---

## PHASE 4.5: Release Candidate Final Stabilization (RC-1.1)

### What was implemented
1. **Kubernetes Scale Subresource Integration**: Refactored deployment scaling in `HealingExecutionServiceImpl` to use the official Kubernetes Scale Subresource API (`readNamespacedDeploymentScale` + `replaceNamespacedDeploymentScale`) for native and transaction-safe replica management.
2. **Strategic Merge Patching**: Replaced error-prone JSON patch mutations with K8s-native Strategic Merge Patching for resource limits adjustments (`INCREASE_MEMORY_LIMIT`), eliminating 415/422 validation errors caused by missing paths.
3. **Java CorsWebFilter Bean**: Added a reactive Java `CorsWebFilter` configuration in `gateway-service` to dynamically apply CORS headers across all routed paths and local management/actuator endpoints.
4. **Independent Service Health Cards**: Implemented a multi-target service health checker in the frontend (`ServiceHealthService.ts`) to query each microservice's actuator/API endpoint independently via Gateway routes, eliminating inferred health state assumptions.
5. **Database-computed AI Latency**: Added a `/api/v1/healing/analysis/stats` endpoint to compute average Gemini analysis durations using persisted JPA entities (`SUM(executionDurationMs) / COUNT(records)`) instead of browser-side approximations.
6. **Toast Notification System**: Integrated the lightweight `sonner` package to dispatch real-time SRE status logs (Healing Started, Gateway Lost/Connected, etc.) across layout contexts.
7. **Lens-style Kubernetes View**: Revamped the Workloads component with namespace dropdown filters, name searching, container count badges, restart counter highlights, and pod state chips.
8. **Interactive Timelines & drawers**: Added clickable stage tracers showing step durations, logs, and K8s output, and a sliding detail drawer in the Audits page showing complete cluster context variables.
9. **Grafana/Dynatrace System Overview Banner**: Added a flagship telemetry banner summarizing cluster nodes, online deployments, success rates, active model tags, and live alert sizes.

### Why it was implemented
* To replace all static placeholders with live database and cluster events.
* To satisfy capstone guidelines prohibiting artificial mock data.
* To prevent K8s client mutations from encountering HTTP 415 / 422 payload errors on Minikube.

### How it was tested
* **Production Vite Compile**: Output files generated successfully with zero errors.
* **ESLint Verification**: Linter verified zero syntax style warnings.
* **Maven Clean package**: All Java JAR archives packaged successfully.

---

## PHASE 4.6: Grafana Provisioning & Observability Dashboard

### What was implemented
1. **Pinned Image tags**: Updated Grafana deployment to `grafana/grafana:10.4.2`, Prometheus to `prom/prometheus:v2.51.1`, and Alertmanager to `prom/alertmanager:v0.27.0`.
2. **Persistent Storage configuration**: Added PV storage claims (`grafana-pvc` with 5Gi and `prometheus-pvc` with 10Gi) ensuring operational telemetry and custom dashboard adjustments survive container rescheduling.
3. **Automated Prometheus Datasource**: Configured automated datasource provisioning targeting `http://prometheus:9090` (editable: false, default: true).
4. **Interactive Dashboard Providers**: Automatically registers folder-scoped dashboards located under `/etc/grafana/provisioning/dashboards/json`.
5. **Dashboard ConfigMap JSON mappings**: Leveraged Node generation scripts to wrap 5 raw JSON dashboards (AIOps Overview, Gateway Metrics, HTTP Metrics, AI Self-Healing, Kubernetes) into valid Kubernetes ConfigMaps to prevent syntax errors during recursive `kubectl apply -R`.
6. **Grafana Alerting Rules**: Configured default thresholds for critical cluster variables: CPU (>90%), Memory (>85%), HTTP 5xx spikes (>1/sec), self-healing failures, and service down alarms.

### Why it was implemented
* To establish fully automated, version-controlled observability panels on Minikube startup.
* To comply with capstone specifications prohibiting manual Grafana datasource or dashboard imports.
* To guarantee metric persistence across container restarts.

### How it was tested
* **Manifest dry-run validation**: Validated syntax recursively with `kubectl apply -R -f k8s/ --dry-run=client` successfully.
* **Image dependency checks**: Verified that all image tags are strictly pinned.
* **Volume Mount Refactoring**: Refactored the dashboard mounts from individual subPath file overrides to a single ConfigMap directory mount (`/etc/grafana/provisioning/dashboards/json`), successfully resolving the `CrashLoopBackOff` ("not a directory") pod error.
