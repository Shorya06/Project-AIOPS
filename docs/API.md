# API Documentation

All microservices are exposed through the API Gateway at port `8080`.

---

## 🔀 API Gateway Route Registry

| HTTP Method | Path | Target Microservice | Description |
| :--- | :--- | :--- | :--- |
| **GET** | `/actuator/health` | `gateway-service` | Gateway liveness and readiness status |
| **GET** | `/api/v1/transactions` | `transaction-service` | Retrieve mock transaction processing history |
| **GET** | `/api/v1/transactions/fault/oom` | `transaction-service` | Triggers a simulated memory leak container fault |
| **GET** | `/api/v1/healing` | `healing-service` | Retrieve active self-healing action audits |
| **GET** | `/api/v1/healing/analysis` | `healing-service` | Retrieve raw Gemini LLM diagnosis records |
| **GET** | `/api/v1/healing/analysis/stats` | `healing-service` | Fetch database-computed AI diagnosis durations |
| **GET** | `/api/v1/notifications` | `notification-service` | Fetch outbound message alerts log |
| **GET** | `/api/v1/observer/kubernetes` | `k8s-observer-service` | Retrieve active cluster workload mappings |
| **POST** | `/api/v1/alerts` | `k8s-observer-service` | Webhook ingestion endpoint for Alertmanager payloads |

---

## 🔍 Highlighted Endpoint Schemas

### 1. Retrieve AI Diagnosis Statistics
* **Endpoint**: `GET /api/v1/healing/analysis/stats`
* **Response Payload (200 OK)**:
```json
{
  "averageAnalysisTimeMs": 2480.5,
  "totalAnalyses": 12,
  "lastAnalysisTimestamp": "2026-07-13T08:50:27Z",
  "activeModel": "gemini-1.5-flash"
}
```

### 2. Alertmanager Webhook Payload
* **Endpoint**: `POST /api/v1/alerts`
* **Request Payload**:
```json
{
  "alerts": [
    {
      "status": "firing",
      "labels": {
        "alertname": "PodCrashLooping",
        "severity": "critical",
        "pod": "transaction-service-xyz",
        "namespace": "aiops"
      },
      "annotations": {
        "summary": "Container is continuously restarting"
      }
    }
  ]
}
```
