# Platform Deployment Guide

This document describes the instructions to deploy the AIOps Platform inside a local Kubernetes cluster (Minikube).

---

## ⚙️ Prerequisites

- **Minikube** installed and running.
- **kubectl** CLI installed.
- **Docker** CLI installed.
- **Maven 3.x** and **Java 17** installed.
- **Node.js 18+** installed.

---

## 🚀 Step-by-Step Deployment

### 1. Start Minikube & Connect Local Docker Registry
```powershell
minikube start --driver=docker
minikube docker-env | Invoke-Expression
```

### 2. Build the JARs and Docker Images
Build all Java projects and compile them as local Docker images inside Minikube's Docker daemon context:
```powershell
# Compile Maven packages
mvn clean package -DskipTests

# Build Microservice Docker Images
docker build -t projectaiops-gateway-service:latest ./gateway-service
docker build -t projectaiops-transaction-service:latest ./transaction-service
docker build -t projectaiops-notification-service:latest ./notification-service
docker build -t projectaiops-healing-service:latest ./healing-service
docker build -t projectaiops-k8s-observer-service:latest ./k8s-observer-service
```

### 3. Create Secrets
Setup the database environment variables and the Gemini API key secrets:
```powershell
# Create Namespace
kubectl apply -f k8s/namespace.yaml

# PostgreSQL Password Secret
kubectl create secret generic postgres-secret --from-literal=database=aiops_db --from-literal=username=aiops_user --from-literal=password=aiops_pass -n aiops

# Gemini API Key Secret
kubectl create secret generic gemini-secret --from-literal=gemini-api-key=YOUR_GEMINI_API_KEY -n aiops
```

### 4. Deploy Manifests
Deploy all services, databases, configurations, persistent volumes, and dashboards:
```powershell
# Apply Kubernetes resources recursively
kubectl apply -R -f k8s/
```

### 5. Access Services via Port-Forwarding
Route cluster services to your local loopback address:
```powershell
# Route API Gateway (port 8080)
kubectl port-forward svc/gateway-service 8080:8080 -n aiops

# Route Grafana (port 3000)
kubectl port-forward svc/grafana 3000:3000 -n aiops
```

### 6. Start the SRE Frontend
Launch the Vite React dashboard locally:
```powershell
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.
