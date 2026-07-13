# Phase 4.4 — Grafana Provisioning & Observability Dashboard

This document details the architecture, configuration, and storage structures implemented to fully automate Grafana provisioning and dashboard visualizations.

---

## 🏗️ Provisioning Architecture

The automated observability solution leverages Kubernetes native resources (`ConfigMaps` and `PersistentVolumeClaims`) to deploy a stateless Grafana instance that mounts datasource configurations, folder providers, pre-packaged dashboards, and alerting rules at startup. User configurations and operational logs are persisted in a Persistent Volume.

```text
k8s/grafana/
├── deployment.yaml                   # Pinned to grafana/grafana:10.4.2
├── pvc.yaml                          # 5Gi Grafana database storage
├── secret.yaml                       # Admin password credentials
├── service.yaml                      # Service exposing port 3000
├── datasource-configmap.yaml         # Prometheus datasource mapping
├── dashboard-provider-configmap.yaml # Scrape path locations mapping
├── alerting-configmap.yaml           # Alert rules (CPU, Mem, 5xx, GC)
└── dashboard-configmap.yaml          # ConfigMap YAML - Wraps all 5 JSON dashboards
```

---

## 💾 Storage & Persistence

To guarantee dashboard annotations, stars, and security credentials survive container rescheduling, we declare:

- **Grafana Storage (`grafana-pvc`)**: A `5Gi` volume mounted directly to `/var/lib/grafana`.
- **Prometheus Storage (`prometheus-pvc`)**: A `10Gi` volume mounted directly to `/prometheus` data directory to prevent telemetry loss.

---

## ⚡ Datasource Provisioning

The Prometheus datasource is declared in `prometheus-datasource.yaml` inside [datasource-configmap.yaml](file:///c:/Users/hp/Desktop/Project%20AIOPS/k8s/grafana/datasource-configmap.yaml).
- **UID**: `prometheus-ds` (consistent reference for alert rules)
- **URL**: `http://prometheus:9090` (internal service discovery address)
- **Default**: `true`
- **Editable**: `false` (forces read-only database controls)

---

## 📁 Dashboard Provider configuration

The folder layout scanner is defined in `dashboard-provider.yaml` inside [dashboard-provider-configmap.yaml](file:///c:/Users/hp/Desktop/Project%20AIOPS/k8s/grafana/dashboard-provider-configmap.yaml).
It directs Grafana to load all JSON dashboard structures placed inside `/etc/grafana/provisioning/dashboards/json` into a dashboard folder named **AIOps**.

The dashboards ConfigMap `grafana-dashboards` contains all JSON dashboard files as separate keys and is mounted once as a directory under `/etc/grafana/provisioning/dashboards/json`.

---

## 📊 Observability Panels Layout

We have split AIOps monitoring into 5 pre-packaged dashboards:

1.  **AIOps Overview**: Summary of cluster status, healthy components, active Alertmanager events, and healing execution counts.
2.  **Gateway Metrics**: Monitors CPU loads, JVM Heap consumption, GC pauses, and response latency.
3.  **HTTP Metrics**: Displays HTTP 2xx, 4xx, and 5xx logs alongside server failure percentages.
4.  **AI Self-Healing**: Displays Gemini latency timers and healing actions results.
5.  **Kubernetes**: Tracks pod restarts, CrashLoopBackOff counts, OOMKilled container details, and replica status with friendly "No telemetry available" placeholders if metrics are missing.

---

## 🚨 Provisioned Alerting Rules

Critical alert rules are configured in [alerting-configmap.yaml](file:///c:/Users/hp/Desktop/Project%20AIOPS/k8s/grafana/alerting-configmap.yaml):

- **Gateway Down**: Fires if `up{job="gateway-service"} == 0` for 1 minute.
- **CPU > 90%**: Fires if gateway CPU utilization exceeds 90% for 2 minutes.
- **Memory > 85%**: Fires if JVM heap usage exceeds 85% for 2 minutes.
- **5xx Spikes**: Alerting if 5xx request rates exceed 1 per second for 1 minute.
- **Healing Failures**: Alerting if `ai_healing_failed_total` increments within a 5-minute interval.
- **Prometheus Unreachable**: Fires if `up{job="prometheus"} == 0` for 1 minute.

---

## 🚀 Execution & Port Forwarding

Deploy the stack:
```powershell
kubectl apply -R -f k8s/
```

Access Grafana locally:
```powershell
kubectl port-forward svc/grafana 3000:3000 -n aiops
```
Access the dashboard at `http://localhost:3000` using the username `admin` and the password configured in `grafana-secret` (default password). The Prometheus datasource and all 5 AIOps dashboards are automatically available.
