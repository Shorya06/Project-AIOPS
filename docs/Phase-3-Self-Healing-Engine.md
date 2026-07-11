# Phase 3: AI Self-Healing Engine

This document outlines the validation policies, Kubernetes mutations, Micrometer telemetry metrics, email notifications, and asynchronous feedback loops that make up the AI Self-Healing Engine.

---

## Objective
The objective of this phase was to transform the validated AI recommendations from the Configured AI Model into safe, automated Kubernetes remediation actions (restarts, scaling, limit modifications) without manual operator intervention.

---

## Architecture
The complete remediation workflow proceeds as follows:

```text
 [Alertmanager Webhook] (Generates Correlation ID)
          │
          ▼
 [Observer Service]
          │ (Enriches Context & propagates Correlation ID)
          ▼
 [Healing Service /analyze (Dev/Test Endpoint Only)]
          │
          ▼
 [AIAnalysisService] (Orchestrates prompt templates)
          │
          ▼
 [AIProvider Interface] ───► GeminiProvider (Configured AI Model implementation)
          │
          ▼
 [HealingPolicyService] (Validation layer: checks ActionParameters, LOW confidence, limits)
          │
          ▼
 [Audit Logger] (Persists HealingOperation PENDING record with executionId/analysisId/correlationId)
          │ (Persists AIAnalysisRecord validatedRecommendationSnapshot)
          ▼
 [HealingExecutionService] (Kubernetes Remediation Engine)
          │
          ├── RESTART_POD (Deletes Pod via CoreV1Api)
          ├── SCALE_DEPLOYMENT (Patches replicas count dynamically via AppsV1Api)
          └── INCREASE_MEMORY_LIMIT (Patches limit specs dynamically via AppsV1Api)
          │
          ├──► Increments Micrometer telemetry counters (healing and analysis timers)
          ├──► Dispatches Feign alert email via Notification Service (with Correlation ID)
          └──► Spawns Asynchronous Cooldown Feedback Loop (60s sleep -> recheck pod health)
                    │
                    ▼
          [Final Audit Update] (SUCCESS / FAILED / PARTIAL stored in PostgreSQL)
```

---

## Distributed Correlation ID
To support end-to-end trace auditing across the microservice topology, a distributed **Correlation ID** is generated upon Alertmanager entry:
1. **Generation**: `AlertController` generates a UUID correlation identifier.
2. **Context Propagation**: The Correlation ID is embedded inside `FailureContext` and passed across HTTP Feign interfaces to the `healing-service`.
3. **Database Logging**: Persistent records inside both `ai_analysis_records` and `healing_operations` tables cache the correlation identifier.
4. **Log Tracing**: Every SLF4J log statement generated across the observer and healing nodes prepends the correlation token (`[CorrelationID: xxxx]`), enabling developers to query the entire lifecycle of a single alert event.

---

## AI Recommendation Snapshot
For diagnostic verification and quality auditing, the engine persists the complete validated recommendation details as a serialized JSON string:
*   **Target column**: `validated_recommendation_snapshot` inside the `ai_analysis_records` table.
*   **Content**: Contains the exact JSON object schema (`diagnosis`, `reasoning`, `recommendedAction`, `confidence`, `actionParameters`) mapped from the `AIHealingDecision` DTO before mutations are initiated.

---

## AI Provider Abstraction
To prepare the platform for future AI provider extensions (such as OpenAI, Claude, or Azure OpenAI), the model request pipeline is decoupled:
*   **`AIProvider`**: Interface defining the diagnostic contract:
    ```java
    public interface AIProvider {
        AIAnalysisResult analyzeFailure(FailureContext context, String prompt, String correlationId);
    }
    ```
*   **`GeminiProvider`**: Concrete implementation of `AIProvider` that handles Gemini WebClient payload marshalling.
*   **Orchestration**: `AIAnalysisServiceImpl` injects the abstract `AIProvider` interface, allowing alternative provider implementations to be swapped in by replacing bean definitions without editing core business orchestration rules.

---

## Validation & Confidence Policies
To prevent unsafe or erratic AI actions, all recommendations pass through a strict **Validation Layer** (`HealingPolicyService`):
1. **Confidence Policy**: If Gemini returns a confidence level of `LOW`, the action is automatically downgraded to `NO_ACTION` with the reason "Low confidence AI recommendation requires manual review."
2. **ActionParameters Validation**:
   - `RESTART_POD` requires no parameters.
   - `SCALE_DEPLOYMENT` requires `replicas` to be present.
   - `INCREASE_MEMORY_LIMIT` requires `memoryLimit` to be present.
   - Missing required parameters cause the policy checker to reject the action and set it to `NO_ACTION`.
3. **Whitelist**: Only whitelisted actions (`RESTART_POD`, `SCALE_DEPLOYMENT`, `INCREASE_MEMORY_LIMIT`, `NO_ACTION`) are permitted.
4. **Hard Limits**: Maximum scaling replicas are capped by properties (default: `5`), and memory limit increases are checked against `max-memory-limit` (default: `2048Mi`) to prevent runaway resource usage.

---

## Safety Guarantees
*   **AI never executes raw LLM output directly**: The raw output is always validated against Java schema models and structural action constraints.
*   **Every recommendation passes HealingPolicyService**: Validations are executed in a dedicated sandbox layer before any cluster API modifications are triggered.
*   **LOW confidence recommendations are automatically blocked**: Recommendations with `ConfidenceLevel.LOW` are downgraded to `NO_ACTION` to prevent risky automated repairs.
*   **Unknown actions are rejected**: Any action not whitelisted in the enum is blocked.
*   **Resource modifications are bounded**: Memory limit adjustments cannot exceed the configured boundary (`healing.policy.max-memory-limit`).
*   **Replica scaling is bounded**: Deployment scaling replica targets are bounded by policy maximums (`healing.policy.max-replicas`).
*   **Kubernetes mutations are whitelisted**: Only safe, predefined operations (restarting pods, patching deployment limits/replicas) are allowed.
*   **Every action is audited**: Traceable database logs link the unique `executionId` (UUID) and `analysisId` to final run statuses.
*   **Every remediation is observable through Micrometer**: Custom timers (`ai_analysis_duration`, `ai_healing_duration`) track system latency.
*   **Every remediation enters the Feedback Loop**: Running remediation triggers asynchronous health verifications.
*   **AI model is configurable through application.yml**: Decoupled keys and model parameters (e.g. `gemini.model`) prevent hardcoding.

---

## Kubernetes Remediation Engine
Remediation actions are implemented using the official Kubernetes Java Client:
*   **`RESTART_POD`**: Deletes the pod instance (`deleteNamespacedPod`). The ReplicaSet controller automatically spawns a fresh pod replacement.
*   **`SCALE_DEPLOYMENT`**: Patches the replicas count using a JSON Patch operation to the validated target.
*   **`INCREASE_MEMORY_LIMIT`**: Patches the pod spec container memory limit using a JSON Patch operation to the validated limit.

---

## Asynchronous Cooldown Feedback Loop
To prevent blocking and Gateway timeouts, the feedback loop runs asynchronously:
1. Spawns an asynchronous task sleeping for the configured period (`healing.policy.feedback-delay-seconds`).
2. Checks pod status health using `CoreV1Api`.
3. Persists final outcomes (`SUCCESS`, `FAILED`, or `PARTIAL`) back into the SQL logs.

---

## Micrometer Metrics & Telemetry
Remediation executions write metrics using Micrometer:
*   `ai_healing_total` (Counter): Total healing runs initiated.
*   `ai_healing_success_total` (Counter): Successfully completed executions.
*   `ai_healing_failed_total` (Counter): Failed executions.
*   `ai_healing_validation_failures` (Counter): Actions modified or blocked by policy rules.
*   `ai_analysis_duration` (Timer): Latency of the AI reasoning step.
*   `ai_healing_duration` (Timer): Latency of the Kubernetes remediation execution.

---

## Testing Guide
A curl test payload can be sent to the testing endpoint:
```bash
curl -X POST http://localhost:8080/api/v1/healing/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "podName": "transaction-service-89f4b",
    "namespace": "aiops",
    "alertName": "PodCrashLooping",
    "severity": "critical",
    "deploymentName": "transaction-service",
    "restartCount": 5,
    "exitCode": 137,
    "cpuRequest": "100m",
    "cpuLimit": "500m",
    "memoryRequest": "256Mi",
    "memoryLimit": "512Mi",
    "containerState": "Terminated: OOMKilled",
    "recentPodEvents": ["Warning: BackOff restarting failed container"],
    "last50LogLines": "java.lang.OutOfMemoryError: Java heap space",
    "timestamp": "2026-07-11T20:00:00"
  }'
```
Check:
1. PostgreSQL table `healing_operations` showing `PENDING` -> `SUCCESS`/`FAILED`/`PARTIAL` (after cooldown).
2. Prometheus metrics targets for `ai_healing_` and `ai_analysis_` prefixes.
