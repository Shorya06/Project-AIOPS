# Implementation Plan - AIOps Self-Healing Platform

This document describes the technical architecture, design patterns, and deployment steps for the 5-microservice AIOps platform.

## User Review Required

> [!IMPORTANT]
> The platform relies on the **Kubernetes Java Client** interacting directly with your local Kubernetes cluster's API. This requires configuring a Kubernetes `ServiceAccount` with RBAC permissions to read logs and edit/patch resources in the namespace.

> [!WARNING]
> Testing self-healing requires simulating failures. The **Transaction Service** contains custom endpoints to trigger a JVM OutOfMemoryError (`OOMKilled`) and uncaught exceptions during startup (`CrashLoopBackOff`). Ensure these endpoints are strictly disabled in production builds.

## Open Questions

> [!NOTE]
> 1. **Kubernetes Environment**: Do you plan to use **Minikube**, **Kind**, or **Docker Desktop Kubernetes** for your local deployment? We recommend Minikube as it offers the most robust local testing suite for resource limiting and scaling.
> 2. **Gemini API Integration**: Would you prefer to use the official Google **Generative AI Java SDK** or call the API directly using Spring's WebClient? (Calling it directly via WebClient keeps dependencies lightweight and reduces potential version conflict issues with Spring Boot).

---

## Proposed Changes

We will organize the microservices into a single multi-module Maven project to simplify dependency management and compiling under tight time limits.

### [NEW] Parent Project Root

#### [NEW] [pom.xml](file:///c:/Users/hp/Desktop/Project AIOPS/pom.xml)
Defines the Maven parent configurations, dependency management (Spring Boot, Spring Cloud, Kubernetes SDK), and module list.

### [NEW] Gateway Service

#### [NEW] [application.yml](file:///c:/Users/hp/Desktop/Project AIOPS/gateway-service/src/main/resources/application.yml)
Configures Spring Cloud Gateway to route HTTP requests:
- `/api/v1/transactions/**` -> `http://transaction-service:8081`
- `/api/v1/healing/**` -> `http://healing-service:8082`
- `/api/v1/notifications/**` -> `http://notification-service:8083`

### [NEW] Transaction Service

#### [NEW] [TransactionController.java](file:///c:/Users/hp/Desktop/Project AIOPS/transaction-service/src/main/java/com/aiops/transaction/controller/TransactionController.java)
Exposes standard CRUD endpoints for transaction records and contains the mock fault injection endpoints:
- `/api/v1/transactions/fault/oom` triggers a fast heap leak.
- `/api/v1/transactions/fault/crash` triggers an immediate `System.exit(1)`.

### [NEW] Kubernetes Observer Service

#### [NEW] [PodEventWatcher.java](file:///c:/Users/hp/Desktop/Project AIOPS/k8s-observer-service/src/main/java/com/aiops/observer/watcher/PodEventWatcher.java)
Uses the Kubernetes Java SDK to open a watch stream on pod status events. Matches pods experiencing `CrashLoopBackOff` or `OOMKilled`, extracts the log tail, and submits them to the `healing-service`.

### [NEW] AI Self-Healing Engine

#### [NEW] [GeminiClient.java](file:///c:/Users/hp/Desktop/Project AIOPS/healing-service/src/main/java/com/aiops/healing/client/GeminiClient.java)
Queries the Gemini 1.5 Flash API with custom prompt engineering templates. Passes pod logs and status metrics, then requests a structured JSON analysis indicating the root cause and remediation type.

#### [NEW] [RemediationExecutor.java](file:///c:/Users/hp/Desktop/Project AIOPS/healing-service/src/main/java/com/aiops/healing/executor/RemediationExecutor.java)
Translates the JSON plan into K8s Java Client API actions:
- `RESTART` -> Deletes the pod to force a fresh restart.
- `INCREASE_RESOURCES` -> Patches the deployment spec to bump CPU/Memory limits.
- `ROLLBACK` -> Rolls back the deployment deployment spec to the previous active revision.

### [NEW] Notification & Analytics Service

#### [NEW] [HealingHistoryController.java](file:///c:/Users/hp/Desktop/Project AIOPS/notification-service/src/main/java/com/aiops/notification/controller/HealingHistoryController.java)
Exposes HTTP endpoints for the React frontend dashboard to query active deployments, historical healing events, and success rates.

### [NEW] Kubernetes Deployment Files

#### [NEW] [deployment.yaml](file:///c:/Users/hp/Desktop/Project AIOPS/k8s/deployment.yaml)
Unified manifest file declaring standard deployment resource constraints, liveness/readiness probes, and ClusterIP services for all 5 microservices.

#### [NEW] [rbac.yaml](file:///c:/Users/hp/Desktop/Project AIOPS/k8s/rbac.yaml)
Configures a dedicated `ServiceAccount` for `k8s-observer-service` and `healing-service` with RBAC permissions:
```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: aiops-k8s-manager-role
rules:
- apiGroups: [""]
  resources: ["pods", "pods/log", "events"]
  verbs: ["get", "list", "watch", "delete"]
- apiGroups: ["apps"]
  resources: ["deployments", "deployments/rollback"]
  verbs: ["get", "list", "watch", "update", "patch"]
```

---

## Verification Plan

To verify that the self-healing platform works exactly as designed:

### Automated Tests
- Run clean builds of all 5 services: `mvn clean package -DskipTests`
- Run local unit tests verifying the Gemini JSON prompt output parsing logic.

### Manual Verification
1. Deploy the 5 microservices inside the local Kubernetes cluster.
2. Launch the React dashboard interface.
3. Access `/api/v1/transactions/fault/oom` on the transaction service to simulate resource exhaustion.
4. Verify via `kubectl get pods` and the React UI that the `k8s-observer-service` captured the event, the `healing-service` invoked Gemini, and the deployment limits were automatically scaled up to resolve the issue.
5. Verify that Grafana reports a visual dip and correction in memory utilization metrics.
