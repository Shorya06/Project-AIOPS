# AI-Powered Self-Healing AIOps Platform

This is a production-grade **5-microservice AIOps Platform** built as a final-year CSE capstone project. The platform implements a distributed self-healing loop that simulates container monitor warnings (e.g., CPU/Memory resource exhaustion, OOMKilled, CrashLoopBackOff) and automatically triggers self-healing runs, logs operations audits, and dispatches administrative alerts across the cluster.

---

## 🏗️ System Architecture

### Distributed Microservice Topology
The platform consists of a centralized API gateway that routes traffic to internal microservices communicating via type-safe declarative REST clients (Spring Cloud OpenFeign):

```text
                       API Gateway (Port 8080)
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
 Transaction Service      Healing Service      Notification Service
     (Port 8081)            (Port 8082)            (Port 8083)
                                ▲
                                │
                         OpenFeign Call
                                ▲
                                │
                         Observer Service
                           (Port 8084)
```

### End-to-End Orchestrated Event Flow
When a cluster monitoring agent (represented by the Observer Service) intercepts a container fault, it orchestrates a distributed cascade of self-healing and alert actions:

```text
[POST /api/v1/observer/pod-failure]
                  │
                  ▼
         [Observer Service]
                  │
             (OpenFeign)
                  ▼
          [Healing Service] ───► [Save Healing Audit Record] ───► [PostgreSQL]
                  │
             (OpenFeign)
                  ▼
       [Notification Service] ──► [Save Alert Log Record] ───► [PostgreSQL]
```

---

## ⚡ Core Features

1. **Declarative API Routing**: Centralizes all frontend API paths under Spring Cloud Gateway (`8080`), abstracting port mappings of downstream services.
2. **Kubernetes Failure Observation**: Watcher mock controller (`k8s-observer-service`) capable of capturing pod failure descriptors (`podName`, `namespace`, `reason`) and initiating diagnosis.
3. **Automated Auto-Healing Runs**: Service rules that receive failure logs and determine action workflows (e.g. `RESTART`, `SCALE`) based on log tails.
4. **Multi-Service Persistence**: PostgreSQL storage auditing every healing operation state (`PENDING`, `SUCCESS`, `FAILED`) and administrative notification alerts independently.
5. **Observability Instrumentation**: All services publish system-level metrics via Micrometer and Spring Boot Actuator, fully integrated with Prometheus and Grafana for JVM monitoring.

---

## 🛠️ Technology Stack

* **Core Framework**: Spring Boot 3.5.x
* **Language Runtime**: Java 17
* **Distributed Routing**: Spring Cloud Gateway
* **Inter-Service Communication**: Spring Cloud OpenFeign
* **Object Mapping & Data Access**: Spring Data JPA & Hibernate
* **Database Engine**: PostgreSQL 15 (Alpine)
* **Metrics & Monitoring**: Micrometer, Prometheus, Grafana
* **Container Orchestration**: Docker & Docker Compose
* **Build System**: Maven (Multi-Module Project Model)

---

## 📂 Project Directory Structure

| Directory / File | Description |
| :--- | :--- |
| **`gateway-service/`** | Spring Cloud Gateway proxy routing requests to subservices. |
| **`transaction-service/`** | Mock business microservice with fault-injection controllers. |
| **`healing-service/`** | Self-healing automation engine that determines repair workflows. |
| **`notification-service/`** | Central audit and notification alerting registry service. |
| **`k8s-observer-service/`** | Cluster state observer that dispatches detected pod crashes. |
| **`docker/`** | Mount folders holding configurations (Prometheus targets, Grafana, etc.). |
| **`scripts/`** | Directory housing operational helper batch commands. |
| **`docker-compose.yml`** | Consolidated local database, observability, and microservice compose stack. |
| **`pom.xml`** | Master Parent Maven configuration managing shared versions and compile configurations. |

---

## 🚀 Setup & Execution Guide

### Prerequisites
* Java Development Kit (JDK) 17 or higher
* Apache Maven (or use the pre-packaged POM compile wrapper)
* Docker Desktop (with Compose capability activated)

### 1. Compile and Package the Project
You can compile and clean all modules using the parent Maven descriptors or trigger the pre-packaged command script:
```powershell
# Run the build batch file
.\scripts\build.bat
```
*(This triggers `mvn clean package -DskipTests` to compile and package all modules into jar archives inside their respective `target` folders).*

### 2. Launch Infrastructure and Microservices
Start PostgreSQL, Prometheus, Grafana, and the 5 Spring Boot microservice containers:
```powershell
# Spin up the containers in the background
.\scripts\docker-up.bat
```

### 3. Verify Active Services
Verify container status:
```bash
docker ps
```
The following local ports will be active on your host system:
* **API Gateway**: [http://localhost:8080](http://localhost:8080)
* **Transaction Service**: [http://localhost:8081](http://localhost:8081)
* **Healing Service**: [http://localhost:8082](http://localhost:8082)
* **Notification Service**: [http://localhost:8083](http://localhost:8083)
* **Observer Service**: [http://localhost:8084](http://localhost:8084)
* **Prometheus Dashboard**: [http://localhost:9090](http://localhost:9090)
* **Grafana Dashboard**: [http://localhost:3000](http://localhost:3000) (User: `admin`, Pass: `admin`)

---

## 🔍 Verifying the Self-Healing Event Flow

To test the orchestration flow, trigger a mock pod failure on the Observer Service. This simulates an automated cluster agent finding an OOM crash.

Execute a `POST` request to `/api/v1/observer/pod-failure` (mapped through the Gateway):

```powershell
# Trigger a pod failure via curl
curl -X POST http://localhost:8080/api/v1/observer/pod-failure `
  -H "Content-Type: application/json" `
  -d '{"podName": "payment-api-7fbc9", "namespace": "production", "reason": "OOMKilled"}'
```

### What Happens in the Background:
1. **Observer** receives the crash event and maps it to a `PodFailureRequestDTO`.
2. **Observer** calls `HealingClient` (Feign client pointing to `healing-service`).
3. **Healing Service** logs a `HealingOperation` record (e.g. `RESTART`) as `SUCCESS` inside the PostgreSQL `healing_operations` table.
4. **Healing Service** dispatches a REST alert via `NotificationClient` (Feign client pointing to `notification-service`).
5. **Notification Service** registers an administrator alert warning inside the PostgreSQL `notifications` table.

### Check the PostgreSQL Database Logs:
Connect to the database via Docker:
```bash
docker exec -it aiops-postgres psql -U aiops_user -d aiops_db
```
Query the healing and notification logs:
```sql
-- View generated healing audit entries
SELECT id, pod_name, namespace, healing_action, healing_status, reason FROM healing_operations;

-- View dispatched alerts
SELECT id, recipient, subject, message FROM notifications;
```

---

## 📈 Actuator & Observability Metrics

All microservices are equipped with Micrometer, exposing Prometheus scraping data on `/actuator/prometheus`.

### Verify Metrics Scraping
Request metrics locally:
```bash
curl http://localhost:8081/actuator/prometheus
```
Verify Prometheus network target reachability:
* Open [http://localhost:9090/targets](http://localhost:9090/targets) inside your browser. All internal microservice scrape targets should report as **UP**.

---

## 🖼️ Dashboard Showcase (Placeholders)
*Here, add screenshots of the Grafana JVM Metrics dashboard and the console outputs from self-healing runs.*
* **Grafana Dashboard Screen**: *(Placeholder for Grafana Dashboard JVM Heap/Thread stats)*
* **PostgreSQL Tables Console**: *(Placeholder for SQL table query outputs showing healing operation runs)*

---

## 🔮 Future Architecture Improvements
* **Real Kubernetes Integration**: Swap the mock observer with a real-time event watcher utilizing the `io.kubernetes:client-java` library and configure RBAC `ServiceAccount` credentials.
* **LLM Diagnostics (Gemini API)**: Connect a `WebClient` call to Google Generative AI to feed pod crash log tails into Gemini, dynamically parsing root causes and selecting the best repair strategy (e.g., scale limit vs. pod restart).
* **Fail-Safe Circuit Breaker**: Integrate Resilience4j around Feign client links to handle network delays gracefully.