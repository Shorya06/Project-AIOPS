# AI-Powered Self-Healing AIOps Platform

This is a 5-microservice AIOps Platform built as a final-year CSE capstone project. The core feature is an AI self-healing module that integrates with the Gemini API to auto-detect and remediate Kubernetes failures (OOMKilled, CrashLoopBackOff) by reading container status events and logs.

## Architectural Documents
* [Development Roadmap](./aiops_platform_roadmap.md)
* [Technical Implementation Plan](./implementation_plan.md)

---

## Progress Log

### Day 1: Stage 1 - Workspace & Local Dev Setup (Completed)
**Goal**: Set up the parent workspace structure and local development databases/observability tooling.

**What was done**:
1. **Directory Architecture**: Scaffolded parent directory structure for the 5 microservices (`gateway-service`, `transaction-service`, `k8s-observer-service`, `healing-service`, `notification-service`).
2. **Parent POM Configured**: Created a root Maven Parent `pom.xml` to manage dependencies (Spring Boot, Spring Cloud, Kubernetes client-java SDK) uniformly across all submodules.
3. **Local Infrastructure via Docker Compose**: Spun up local PostgreSQL (database), Prometheus (metrics collection), and Grafana (metrics visualization) using Docker.
4. **Verification**: Checked that PostgreSQL port `5432`, Prometheus port `9090`, and Grafana port `3000` are fully up, mapped to `localhost`, and communicating.

### Day 2: Stage 2 - Core Microservices & Database Integration (Completed)
**Goal**: Bootstrap the microservice modules, establish database communication, route APIs, and write fault injection endpoints.

**What was done**:
1. **Module Scaffolding**: Built the directory structures, packages, and main application classes for all 5 submodules.
2. **Gateway Configuration**: Set up Spring Cloud Gateway in `gateway-service` to route traffic to underlying services (`transaction-service` on port 8081, `healing-service` on port 8082, and `notification-service` on port 8083).
3. **Transaction Backend & Database Integration**: Created JPA entities, repositories, and REST endpoints in `transaction-service` to store transactions in PostgreSQL.
4. **Fault Injection Hooks**: Built custom endpoints `/api/v1/transactions/fault/oom` (simulates memory leaks) and `/api/v1/transactions/fault/crash` (simulates container crashes) inside `transaction-service` to enable test failures.
5. **Notification Service Logger**: Set up tables in the database via JPA to store AI healing logs.
6. **Compilation**: Validated that all modules build cleanly and `mvn clean install` compiles successfully.

**Why it was done**:
* To create a mock business application (`transaction-service`) that behaves like a real-world production database consumer but contains triggerable faults.
* To centralize API gateway routing so the client frontend only needs to connect to one port (`8080`).
* To provide a persistent audit trail (`healing_history`) where the AI Self-Healing engine can store diagnostics for review.

**What it does in the project**:
* Runs the business application and the database logger side-by-side.
* Maps database tables automatically in PostgreSQL via Hibernate's `ddl-auto: update` feature.
* Prepares the system for the Kubernetes observer to watch the container states.