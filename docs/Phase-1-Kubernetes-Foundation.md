# Phase 1: Kubernetes & Alertmanager Foundation

This document describes the Kubernetes manifests structure, Alertmanager alert integration, and webhook validation details implemented in Phase 1 of the platform transition.

---

## Objective
The objective of this phase was to transition the AIOps platform from a Docker Compose local configuration into a cloud-native **Kubernetes deployment topology** and implement the Alertmanager webhook reception foundation inside the Observer Service.

---

## Architecture
The platform is deployed inside a dedicated `aiops` namespace. Services communicate using internal Kubernetes DNS (e.g. `http://notification-service:8083`).

```text
                       [API Gateway (NodePort/LoadBalancer: 8080)]
                                            │
        ┌───────────────────────────────────┼───────────────────────────────────┐
        ▼                                   ▼                                   ▼
 [Transaction Service]               [Healing Service]               [Notification Service]
     (Port 8081)                         (Port 8082)                         (Port 8083)
                                            ▲
                                            │ (OpenFeign)
                                            ▼
                                   [Observer Service]
                                      (Port 8084)
                                            ▲
                                            │ (Webhook POST /api/v1/alerts)
                                            ▼
                                     [Alertmanager]
                                      (Port 9093)
                                            ▲
                                            │ (Alerting rules)
                                            ▼
                                      [Prometheus]
                                      (Port 9090)
```

---

## Files Created

### Kubernetes Manifests (`k8s/`)
*   **`k8s/namespace.yaml`**: Creates the `aiops` namespace.
*   **`k8s/postgres/`**:
    *   `secret.yaml`: Secure database credentials (base64 encoded).
    *   `pvc.yaml`: 1Gi PersistentVolumeClaim for local database storage.
    *   `deployment.yaml`: PostgreSQL Pod utilizing Secret env parameters and a `SELECT 1` readiness check.
    *   `service.yaml`: ClusterIP service mapping port 5432.
*   **`k8s/gateway/`**: Deployment and LoadBalancer Service exposing gateway port 8080.
*   **`k8s/transaction/`**, **`k8s/notification/`**, **`k8s/healing/`**, **`k8s/observer/`**: deployments and ClusterIP services mapping respective port routes.
*   **`k8s/prometheus/`**: Deployment, LoadBalancer Service (9090), and ConfigMap mounting `prometheus.yml` configured to scrape internal microservices.
*   **`k8s/grafana/`**: Deployment, LoadBalancer Service (3000), and administrator Secret.
*   **`k8s/alertmanager/`**: Deployment, Service (9093), and ConfigMap containing `alertmanager.yml` forwarding alerts to `http://k8s-observer-service:8084/api/v1/alerts`.

### Observer Service Classes
*   **`com.aiops.observer.dto.AlertWebhookDTO`**: Maps Alertmanager webhook outer metadata.
*   **`com.aiops.observer.dto.AlertDTO`**: Maps individual alerts.
*   **`com.aiops.observer.dto.AlertLabelDTO`**: Maps labels (`alertname`, `pod`, `namespace`, `severity`).
*   **`com.aiops.observer.dto.AlertAnnotationDTO`**: Maps summary and description texts.
*   **`com.aiops.observer.context.FailureContext`**: Context holder placeholder for Phase 2 AI diagnostics.
*   **`com.aiops.observer.service.AlertProcessingService`**: Interface for alert ingestion.
*   **`com.aiops.observer.service.impl.AlertProcessingServiceImpl`**: SLF4J logger and in-memory context caching engine.
*   **`com.aiops.observer.controller.AlertController`**: Exposes `POST /api/v1/alerts` webhook route.

---

## Deployment Flow
To apply all resources to your Kubernetes cluster:
```bash
# 1. Apply namespace
kubectl apply -f k8s/namespace.yaml

# 2. Apply all resources recursively
kubectl apply -R -f k8s/
```

---

## How Alertmanager Works
1. Prometheus monitors metrics scraped from all services' `/actuator/prometheus` endpoints.
2. If a rule triggers (e.g. `PodCrashLooping`), Prometheus pushes alert details to Alertmanager.
3. Alertmanager groups metrics and routes a webhook POST JSON payload containing alert parameters to the Observer Service at `/api/v1/alerts`.
4. The Observer Service receives the JSON, validates annotations, log alerts, and buffers context fields into `FailureContext` cache.

---

## Testing Webhook Manually
To test alert reception, submit a mock webhook request payload to the Observer Service:
```bash
curl -X POST http://localhost:8080/api/v1/alerts \
  -H "Content-Type: application/json" \
  -d '{
    "version": "4",
    "status": "firing",
    "receiver": "webhook-receiver",
    "commonLabels": {
      "alertname": "PodCrashLooping",
      "namespace": "production",
      "pod": "payment-api-7fbc9",
      "severity": "critical"
    },
    "commonAnnotations": {
      "summary": "Container is looping",
      "description": "Pod payment-api-7fbc9 in namespace production is in CrashLoopBackOff"
    },
    "alerts": [
      {
        "status": "firing",
        "labels": {
          "alertname": "PodCrashLooping",
          "namespace": "production",
          "pod": "payment-api-7fbc9",
          "severity": "critical"
        },
        "annotations": {
          "summary": "Container is looping",
          "description": "Pod payment-api-7fbc9 in namespace production is in CrashLoopBackOff"
        }
      }
    ]
  }'
```
Check `k8s-observer-service` logs to verify:
```text
Processing Alertmanager webhook. Status: firing, Receiver: webhook-receiver, Alerts Count: 1
Alert firing -> Name: PodCrashLooping, Namespace: production, Pod: payment-api-7fbc9, Severity: critical, Description: Pod payment-api-7fbc9 in namespace production is in CrashLoopBackOff
```

---

## Future Gemini Integration (Phase 2)
In Phase 2, when an alert matches critical criteria:
1. The Observer Service will read the pod name and namespace.
2. It will call the Kubernetes API to fetch the last 50 log lines of the failing container.
3. It will encapsulate logs and labels into the `FailureContext` and forward it to the `healing-service`.
4. The `healing-service` will query the Gemini API for root cause analysis and execute self-healing.
