# Troubleshooting Guide

This guide covers common issues and resolutions when deploying or developing the AIOps platform.

---

## 🔒 1. Prometheus CrashLoopBackOff: "lock DB directory: resource temporarily unavailable"

### Symptom
The Prometheus container logs display:
`opening storage failed: lock DB directory: resource temporarily unavailable`

### Cause
Prometheus is configured with a ReadWriteOnce (RWO) PersistentVolumeClaim. If a **RollingUpdate** strategy is used, Kubernetes boots the new replica before terminating the old one, causing both instances to attempt to lock the same database directory.

### Resolution
Ensure the deployment configuration in [deployment.yaml](file:///c:/Users/hp/Desktop/Project%20AIOPS/k8s/prometheus/deployment.yaml) uses `strategy: type: Recreate`:
```yaml
spec:
  replicas: 1
  strategy:
    type: Recreate
```
This forces the old pod to release the storage lock before the new pod attempts to mount it.

---

## 📂 2. Grafana CrashLoopBackOff: "not a directory"

### Symptom
Grafana container crashes with:
`Are you trying to mount a directory onto a file (or vice-versa)?`

### Cause
Mounting multiple JSON dashboard files into the same directory `/etc/grafana/provisioning/dashboards/json` using individual volume overrides and `subPath` mounts causes conflicts if the parent directory is not initialized.

### Resolution
Consolidate all dashboard JSON definitions into a single ConfigMap [dashboard-configmap.yaml](file:///c:/Users/hp/Desktop/Project%20AIOPS/k8s/grafana/dashboard-configmap.yaml) and mount it as a directory:
```yaml
          volumeMounts:
            - name: grafana-dashboards
              mountPath: /etc/grafana/provisioning/dashboards/json
```

---

## 🛡️ 3. SRE Workloads showing "K8s API client unmapped"

### Symptom
The Kubernetes workload screen shows "K8s API client unmapped" or logs show `HTTP 403 Forbidden` on namespaces/services.

### Cause
The Observer service account does not have RBAC permissions to query cluster namespaces and services.

### Resolution
1. Ensure the `default` service account has role bindings in [rbac.yaml](file:///c:/Users/hp/Desktop/Project%20AIOPS/k8s/healing/rbac.yaml) including `services`.
2. The platform implements robust exception isolating wrappers inside `KubernetesContextServiceImpl.java` so namespace retrieval failures degrade gracefully by defaulting to `["aiops"]` instead of crashing the entire HTTP thread.

---

## 🌐 4. Browser Console CORS Errors on Actuators

### Symptom
Fetching `/actuator/health` or `/actuator/prometheus` triggers a CORS error.

### Cause
Spring Cloud Gateway routes ignore global CORS configuration for local management/actuator routes.

### Resolution
Verify that `gateway-service` declares a reactive `CorsWebFilter` bean that matches all paths (`/**`) including actuators:
```java
@Configuration
public class CorsConfig {
    @Bean
    public CorsWebFilter corsWebFilter() {
        // Declares global CORS mappings
    }
}
```
