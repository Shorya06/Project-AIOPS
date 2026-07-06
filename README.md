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