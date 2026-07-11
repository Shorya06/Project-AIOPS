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
