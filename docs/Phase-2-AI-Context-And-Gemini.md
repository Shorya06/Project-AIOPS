# Phase 2: AI Context Enrichment & Gemini Integration

This document outlines the architecture, prompts, schemas, validation flows, and persistence configurations implemented in Phase 2 of the platform.

---

## Objective
The objective of this phase was to intercept Alertmanager alerts, enrich them with rich Kubernetes diagnostics (container status, events, resource limits, requests, and log tails), and query Google's Gemini 2.5 Flash API to recommend remediation actions.

---

## Architecture
The diagnostic execution flow proceeds as follows:

```text
 [Alertmanager Webhook]
          │
          ▼
 [Observer AlertController] ───────► [KubernetesContextService] (Fetches Pod logs, events, resources)
          │                                  │
          │ (Enriched FailureContext JSON)    ▼
          ▼
 [Healing Service /analyze]
          │
          ▼
 [PromptBuilder] (Loads prompts/healing-analysis.txt template)
          │
          ▼
 [AIAnalysisService] ───────► [Gemini 2.5 Flash API] (Uses responseSchema and JSON MimeType)
          │                                  │
          │ (Validates JSON)                 ▼
          ▼
 [AIAnalysisRecord] ───────► Saved in PostgreSQL Table: ai_analysis_records
          │
          ▼
 Returns [AIHealingDecision] (No remediation executed yet)
```

---

## Context Enrichment Flow
When an alert is received, the `KubernetesContextService` uses the official Kubernetes Java Client to read:
1. **Pod metadata**: Pod Name, Namespace, OwnerReferences (resolving Deployment Name).
2. **Resource definitions**: CPU limits/requests, Memory limits/requests.
3. **Operational state**: Exit codes, Restart count, Container state (e.g. CrashLoopBackOff).
4. **Telemetry metrics**: CPU usage, Memory usage.
5. **Cluster event history**: Lists the last 5 events related to the pod.
6. **Container logs**: Scrapes the last 50 lines of logs.

*Fallback Logic*: If the Kubernetes API is unreachable (e.g. during local tests or cluster offline states), it catches exceptions and populates `FailureContext` with pre-defined mock diagnostics to keep the AI pipeline running.

---

## Gemini Prompt Strategy & JSON Schema
To guarantee deterministic JSON outputs, we utilize Gemini's native **Structured Outputs** parameters (`responseMimeType: "application/json"` and `responseSchema` constraints) specifying:
1. `diagnosis`: String
2. `reasoning`: String
3. `recommendedAction`: String Enum (`RESTART_POD`, `SCALE_DEPLOYMENT`, `INCREASE_MEMORY_LIMIT`, `NO_ACTION`)
4. `confidence`: String Enum (`HIGH`, `MEDIUM`, `LOW`)
5. `preventiveRecommendation`: String

The prompt layout is loaded from classpath resource `prompts/healing-analysis.txt` and rendered dynamically by `PromptBuilder`.

---

## Validation Strategy
Responses are validated against field constraints:
- If fields are missing or if JSON parsing fails, the service catches the exception and returns a **Structured Validation Failure DTO**:
  - `diagnosis`: "Validation failed for AI diagnosis response."
  - `recommendedAction`: `HealingAction.NO_ACTION`
  - `confidence`: `ConfidenceLevel.LOW`
  - This avoids crashing the microservice thread pool while recording the details in the logs.

---

## Persistence Strategy
Every AI analysis executes within a timed transaction block to compute execution duration. The details are persisted to PostgreSQL in the table `ai_analysis_records` via `AIAnalysisRecord` entity mapping:
*   `prompt`: Full prompt string sent.
*   `diagnosis`: AI reasoning outcome.
*   `recommendedAction`: Suggested K8s action.
*   `confidence`: Level (HIGH, MEDIUM, LOW).
*   `geminiModel`: E.g. `gemini-2.5-flash`.
*   `promptVersion`: Template build version (e.g. `1.0.0`).
*   `rawGeminiResponse`: Unparsed response payload for auditing.
*   `executionDurationMs`: Duration in milliseconds.

---

## Testing Guide
To verify the AI analysis loop, call the analyze endpoint with a mock FailureContext payload:
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
Check database logs inside `ai_analysis_records` to confirm raw responses and duration statistics are written successfully.
