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

### Day 3: Stage 2 - Debugging, Stabilization & Compile Fixes (Completed)
**Goal**: Resolve compilation errors, fix Lombok code generation, implement placeholders, and achieve a successful Maven build across all modules.

**What was done**:
1. **Entity & Enum Completion**: Added properties, package declarations, and JPA mappings to the `Transaction` entity and defined transaction status constants in `TransactionStatus`.
2. **DTO & Mapper Implementation**: Finished `TransactionResponseDTO` properties and implemented static converter functions inside `TransactionMapper` to bridge entities and DTOs.
3. **Exception Architecture Setup**: Created a custom `TransactionNotFoundException` extending `RuntimeException` and mapped response states. Built a `GlobalExceptionHandler` controller advice to format API exception JSON bodies.
4. **Lombok Maven Configuration**: Added the Lombok annotation processor explicitly to the `maven-compiler-plugin` configuration in the parent `pom.xml` to resolve compile-time symbol errors.
5. **Full Clean Build Verification**: Ran `mvn clean install` to execute unit tests and compile all 6 modules successfully into clean runnable jars.

**Why it was done**:
* To replace blank boilerplate placeholders with functional, compiled code.
* To ensure compile-time stability across the code base before building the Kubernetes observer engine.
* To configure Lombok processing correctly under Java 21+ and Spring Boot 3.x, resolving compiler issues with builders, getters, and setters.

**What it does in the project**:
* Guarantees that all Maven packages build cleanly.
* Establishes a working data layer for SQL logging, DTO serialization, and REST exception handler mappings.

### Day 4: Stage 2 - Notification Service Implementation & Debugging (Completed)
**Goal**: Complete the concrete backend logic for the `notification-service`, resolve bean instantiation crashes, and verify clean startup.

**What was done**:
1. **Concrete Service Implementation**: Wrote the complete `NotificationServiceImpl` implementing CRUD methods (`saveNotification`, `getAllNotifications`, `getNotificationById`, `updateNotification`, `deleteNotification`) and connecting to `NotificationRepository`.
2. **Spring Context Resolution**: Annotated the service implementation with `@Service` and verified that it implements `NotificationService` to resolve the autowiring failure in `NotificationController`.
3. **Application Boot Verification**: Verified that the service starts Tomcat successfully on port `8083` and logs a successful JPA Repository interface detection.
4. **Database Mapping**: Verified Hibernate automatically sets up the `notifications` schema inside PostgreSQL.

**Why it was done**:
* To resolve a critical context initialization failure (`UnsatisfiedDependencyException`) caused by missing stereotype annotations.
* To prepare the system's audit logging infrastructure, enabling other services to submit notification alerts and healing state logs to PostgreSQL.

**What it does in the project**:
* Exposes complete CRUD endpoints under `/api/v1/notifications` for tracking system warnings and emails.
* Connects the notification persistence layer so that transaction errors can trigger logged warnings.

### Day 5: Stage 3 - Healing Service Foundation & Configuration (Completed)
**Goal**: Build the core JPA mapping structures, DTOs, mappers, custom exceptions, and REST endpoints for the `healing-service`, and configure database integration.

**What was done**:
1. **Foundation Code Scaffolding**: Generated the complete class suite for `healing-service` comprising the `HealingOperation` entity (with `@PrePersist` hooks), `HealingAction` and `HealingStatus` enums, `HealingRepository`, mapper, validation DTOs, custom exception handler, and `HealingController`.
2. **Build Configurations Fix**: Added the missing `spring-boot-starter-data-jpa` and `postgresql` driver dependencies to the module's `pom.xml`.
3. **Application Properties Updates**: Wrote the PostgreSQL datasource connectivity settings (url, username, password, driver, and Hibernate properties) inside `application.yaml`.
4. **Build & Test Validation**: Executed `mvn clean install` to run tests and verify context loading and JPA mapping compatibility.

**Why it was done**:
* To establish the core database tracking tables (`healing_operations`) where the platform will log every restart or resource scale action taken by the AI.
* To resolve compiler dependency issues and connection pool driver failures that blocked module compilation and tests.

**What it does in the project**:
* Exposes REST CRUD endpoints under `/api/v1/healing` to query or log auto-remediations.
* Maps database tables automatically in PostgreSQL via Hibernate's schema update.

### Day 6: Stage 3 & 4 - Distributed Event Orchestration (Completed)
**Goal**: Integrate the observer service, configure OpenFeign client communication boundaries, and orchestrate the automated failure audit workflow.

**What was done**:
1. **Observer Service Deployment**: Integrated the `k8s-observer-service` (listening on port `8084`) to monitor and report container failures.
2. **Feign Client Integrations**: Configured type-safe declarative REST clients using OpenFeign:
   * **Observer → Healing**: `k8s-observer-service` invokes the `healing-service` endpoint.
   * **Healing → Notification**: `healing-service` invokes the `notification-service` endpoint to notify administrators.
3. **Automated Event Flow Orchestration**: Enabled the core distributed system flow:
   * Client triggers `POST /observer/pod-failure`.
   * `k8s-observer-service` routes details to `healing-service`.
   * `healing-service` creates a `HealingOperation` record (marked PENDING / SUCCESS) in PostgreSQL.
   * `healing-service` invokes `notification-service` to log a notification status record in PostgreSQL.
4. **Project Compilation**: Verified all 6 modules build and pass tests cleanly during the `mvn clean install` cycle.

**Why it was done**:
* To transform individual services into a cohesive distributed platform, simulating how real-world monitoring observers dispatch incidents to AI diagnostics.
* To achieve decoupled auditing where database logs, healing runs, and alerts are stored in their respective service schemas.

**What it does in the project**:
* Connects the API gateway router and all 4 backend microservices into a unified pipeline.
* Handles asynchronous event processing where container crashes are logged, diagnosed, and reported automatically.