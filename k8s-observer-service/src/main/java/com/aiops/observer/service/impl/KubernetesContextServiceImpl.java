package com.aiops.observer.service.impl;

import com.aiops.observer.context.FailureContext;
import com.aiops.observer.service.KubernetesContextService;
import io.kubernetes.client.openapi.ApiClient;
import io.kubernetes.client.openapi.Configuration;
import io.kubernetes.client.openapi.apis.CoreV1Api;
import io.kubernetes.client.openapi.models.*;
import io.kubernetes.client.util.Config;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * ==============================================================
 * KubernetesContextServiceImpl
 * ==============================================================
 *
 * Purpose:
 * Implements Kubernetes Java Client logic to query live cluster status,
 * events, limits, and logs for context enrichment.
 *
 * Why it exists:
 * Fetches the actual operational state of failing pods. Integrates
 * fail-safe fallbacks to return placeholders if the cluster is unreachable.
 */
@Service
public class KubernetesContextServiceImpl implements KubernetesContextService {

    private static final Logger log = LoggerFactory.getLogger(KubernetesContextServiceImpl.class);

    private CoreV1Api coreV1Api;

    public KubernetesContextServiceImpl() {
        try {
            ApiClient client = Config.defaultClient();
            Configuration.setDefaultApiClient(client);
            this.coreV1Api = new CoreV1Api();
            log.info("Kubernetes API client initialized successfully.");
        } catch (Exception e) {
            log.warn("Could not load default Kubernetes configuration. Running in offline/mock fallback mode. Error: {}", e.getMessage());
            this.coreV1Api = null;
        }
    }

    @Override
    public FailureContext buildFailureContext(String podName, String namespace, String alertName, String severity, String correlationId) {
        log.info("[CorrelationID: {}] Building FailureContext for Pod: {}, Namespace: {}, Alert: {}", 
                correlationId, podName, namespace, alertName);

        FailureContext.FailureContextBuilder builder = FailureContext.builder()
                .correlationId(correlationId)
                .podName(podName)
                .namespace(namespace)
                .alertName(alertName)
                .severity(severity)
                .timestamp(LocalDateTime.now());

        if (coreV1Api == null) {
            log.warn("[CorrelationID: {}] Kubernetes API client is offline. Building mock/placeholder failure context.", correlationId);
            return buildPlaceholderContext(builder, podName, correlationId);
        }

        try {
            V1Pod pod = coreV1Api.readNamespacedPod(podName, namespace).execute();
            
            // 1. Resolve Deployment Name from OwnerReferences or Pod name parser
            String deploymentName = resolveDeploymentName(pod, podName);
            builder.deploymentName(deploymentName);

            // 2. Fetch Container Details (first container)
            if (pod.getStatus() != null && pod.getStatus().getContainerStatuses() != null && !pod.getStatus().getContainerStatuses().isEmpty()) {
                V1ContainerStatus status = pod.getStatus().getContainerStatuses().get(0);
                builder.restartCount(status.getRestartCount());
                
                if (status.getState() != null) {
                    if (status.getState().getTerminated() != null) {
                        builder.containerState("Terminated");
                        builder.exitCode(status.getState().getTerminated().getExitCode());
                    } else if (status.getState().getWaiting() != null) {
                        builder.containerState("Waiting: " + status.getState().getWaiting().getReason());
                        builder.exitCode(-1);
                    } else {
                        builder.containerState("Running");
                        builder.exitCode(0);
                    }
                } else {
                    builder.containerState("Unknown");
                    builder.exitCode(-1);
                }
            } else {
                builder.containerState("NoContainerStatuses");
                builder.restartCount(0);
                builder.exitCode(-1);
            }

            // 3. Fetch Resource requests and limits
            if (pod.getSpec() != null && pod.getSpec().getContainers() != null && !pod.getSpec().getContainers().isEmpty()) {
                V1Container container = pod.getSpec().getContainers().get(0);
                V1ResourceRequirements resources = container.getResources();
                if (resources != null) {
                    Map<String, io.kubernetes.client.custom.Quantity> limits = resources.getLimits();
                    Map<String, io.kubernetes.client.custom.Quantity> requests = resources.getRequests();
                    
                    builder.cpuLimit(limits != null && limits.containsKey("cpu") ? limits.get("cpu").toSuffixedString() : "Unlimited");
                    builder.memoryLimit(limits != null && limits.containsKey("memory") ? limits.get("memory").toSuffixedString() : "Unlimited");
                    builder.cpuRequest(requests != null && requests.containsKey("cpu") ? requests.get("cpu").toSuffixedString() : "NotSet");
                    builder.memoryRequest(requests != null && requests.containsKey("memory") ? requests.get("memory").toSuffixedString() : "NotSet");
                } else {
                    builder.cpuLimit("Unlimited").memoryLimit("Unlimited").cpuRequest("NotSet").memoryRequest("NotSet");
                }
            } else {
                builder.cpuLimit("Unlimited").memoryLimit("Unlimited").cpuRequest("NotSet").memoryRequest("NotSet");
            }

            // 4. Fetch metrics usage placeholders (CPU and memory usage require Metrics Server, so we default to placeholders)
            builder.cpuUsage("50m");
            builder.memoryUsage("128Mi");

            // 5. Fetch recent pod events
            builder.recentPodEvents(fetchEvents(podName, namespace, correlationId));

            // 6. Fetch logs
            builder.last50LogLines(fetchLogTail(podName, namespace, correlationId));

        } catch (Exception e) {
            log.error("[CorrelationID: {}] Error querying Kubernetes API for Pod {}. Returning placeholder data. Exception: {}", 
                    correlationId, podName, e.getMessage());
            return buildPlaceholderContext(builder, podName, correlationId);
        }

        return builder.build();
    }

    private String resolveDeploymentName(V1Pod pod, String podName) {
        if (pod.getMetadata() != null && pod.getMetadata().getOwnerReferences() != null) {
            for (V1OwnerReference ref : pod.getMetadata().getOwnerReferences()) {
                if ("ReplicaSet".equalsIgnoreCase(ref.getKind())) {
                    String rsName = ref.getName();
                    int lastDash = rsName.lastIndexOf('-');
                    if (lastDash > 0) {
                        return rsName.substring(0, lastDash);
                    }
                    return rsName;
                }
            }
        }
        // Fallback to simple parser: e.g. transaction-service-7fbc9-xyz -> transaction-service
        String[] parts = podName.split("-");
        if (parts.length > 2) {
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < parts.length - 2; i++) {
                if (i > 0) sb.append("-");
                sb.append(parts[i]);
            }
            return sb.toString();
        }
        return podName;
    }

    private List<String> fetchEvents(String podName, String namespace, String correlationId) {
        List<String> eventMsgs = new ArrayList<>();
        try {
            CoreV1EventList list = coreV1Api.listNamespacedEvent(namespace).execute();
            if (list != null && list.getItems() != null) {
                for (CoreV1Event event : list.getItems()) {
                    if (event.getInvolvedObject() != null && podName.equals(event.getInvolvedObject().getName())) {
                        eventMsgs.add(event.getType() + ": " + event.getMessage());
                        if (eventMsgs.size() >= 5) break;
                    }
                }
            }
        } catch (Exception e) {
            log.warn("[CorrelationID: {}] Could not retrieve events for pod {}: {}", correlationId, podName, e.getMessage());
        }
        if (eventMsgs.isEmpty()) {
            eventMsgs.add("No events found / K8s events offline.");
        }
        return eventMsgs;
    }

    private String fetchLogTail(String podName, String namespace, String correlationId) {
        try {
            String allLogs = coreV1Api.readNamespacedPodLog(podName, namespace).execute();
            if (allLogs == null || allLogs.isEmpty()) {
                return "No logs found for container.";
            }
            String[] lines = allLogs.split("\n");
            if (lines.length <= 50) {
                return allLogs;
            }
            StringBuilder sb = new StringBuilder();
            for (int i = lines.length - 50; i < lines.length; i++) {
                sb.append(lines[i]).append("\n");
            }
            return sb.toString();
        } catch (Exception e) {
            log.warn("[CorrelationID: {}] Could not retrieve logs for pod {}: {}", correlationId, podName, e.getMessage());
            return "Unable to retrieve container logs. Cluster is offline or container logs are unavailable.";
        }
    }

    private FailureContext buildPlaceholderContext(FailureContext.FailureContextBuilder builder, String podName, String correlationId) {
        List<String> events = new ArrayList<>();
        events.add("WARNING: System running in K8s-offline fallback mode.");
        events.add("MockEvent: Container failed status checks.");

        String mockLogs = "2026-07-11T20:00:00Z [INFO] Service starting...\n" +
                          "2026-07-11T20:00:02Z [ERROR] java.lang.OutOfMemoryError: Java heap space\n" +
                          "2026-07-11T20:00:03Z [ERROR] Container execution aborted.";

        String deploymentName = podName;
        int lastDash = podName.lastIndexOf('-');
        if (lastDash > 0) {
            deploymentName = podName.substring(0, lastDash);
            int secondLastDash = deploymentName.lastIndexOf('-');
            if (secondLastDash > 0) {
                deploymentName = deploymentName.substring(0, secondLastDash);
            }
        }

        return builder
                .deploymentName(deploymentName)
                .restartCount(3)
                .exitCode(137)
                .cpuUsage("200m")
                .memoryUsage("512Mi")
                .cpuRequest("100m")
                .cpuLimit("500m")
                .memoryRequest("256Mi")
                .memoryLimit("512Mi")
                .containerState("Waiting: CrashLoopBackOff")
                .recentPodEvents(events)
                .last50LogLines(mockLogs)
                .build();
    }

    @Override
    public java.util.Map<String, Object> getClusterTelemetry() {
        java.util.Map<String, Object> telemetry = new java.util.HashMap<>();
        if (coreV1Api == null) {
            telemetry.put("status", "OFFLINE");
            telemetry.put("namespaces", java.util.Collections.emptyList());
            telemetry.put("pods", java.util.Collections.emptyList());
            telemetry.put("deployments", java.util.Collections.emptyList());
            telemetry.put("services", java.util.Collections.emptyList());
            return telemetry;
        }

        try {
            telemetry.put("status", "ONLINE");

            // 1. Fetch Namespaces
            List<String> nsList = new java.util.ArrayList<>();
            try {
                V1NamespaceList namespaces = coreV1Api.listNamespace().execute();
                if (namespaces != null && namespaces.getItems() != null) {
                    for (V1Namespace ns : namespaces.getItems()) {
                        if (ns.getMetadata() != null) {
                            nsList.add(ns.getMetadata().getName());
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to list namespaces from cluster API (insufficient RBAC). Defaulting to ['aiops']. Error: {}", e.getMessage());
                nsList.add("aiops");
            }
            telemetry.put("namespaces", nsList);

            // 2. Fetch Pods in namespace "aiops"
            List<java.util.Map<String, Object>> podList = new java.util.ArrayList<>();
            try {
                ApiClient apiClient = Configuration.getDefaultApiClient();
                okhttp3.OkHttpClient httpClient = apiClient.getHttpClient();
                String url = apiClient.getBasePath() + "/api/v1/namespaces/aiops/pods";
                okhttp3.Request request = new okhttp3.Request.Builder()
                        .url(url)
                        .get()
                        .build();
                        
                try (okhttp3.Response response = httpClient.newCall(request).execute()) {
                    if (response.isSuccessful() && response.body() != null) {
                        String bodyString = response.body().string();
                        com.google.gson.JsonObject jsonObject = com.google.gson.JsonParser.parseString(bodyString).getAsJsonObject();
                        com.google.gson.JsonArray items = jsonObject.getAsJsonArray("items");
                        if (items != null) {
                            for (com.google.gson.JsonElement itemEl : items) {
                                com.google.gson.JsonObject item = itemEl.getAsJsonObject();
                                com.google.gson.JsonObject metadata = item.getAsJsonObject("metadata");
                                com.google.gson.JsonObject statusObj = item.getAsJsonObject("status");
                                
                                if (metadata != null) {
                                    java.util.Map<String, Object> p = new java.util.HashMap<>();
                                    p.put("name", metadata.has("name") ? metadata.get("name").getAsString() : "unknown");
                                    p.put("namespace", metadata.has("namespace") ? metadata.get("namespace").getAsString() : "aiops");
                                    
                                    String phase = "Unknown";
                                    int restarts = 0;
                                    if (statusObj != null) {
                                        phase = statusObj.has("phase") ? statusObj.get("phase").getAsString() : "Unknown";
                                        com.google.gson.JsonArray containerStatuses = statusObj.getAsJsonArray("containerStatuses");
                                        if (containerStatuses != null && containerStatuses.size() > 0) {
                                            com.google.gson.JsonObject cStatus = containerStatuses.get(0).getAsJsonObject();
                                            if (cStatus.has("restartCount")) {
                                                restarts = cStatus.get("restartCount").getAsInt();
                                            }
                                        }
                                    }
                                    p.put("status", phase);
                                    p.put("restartCount", restarts);
                                    podList.add(p);
                                }
                            }
                        }
                    } else {
                        log.error("Raw pod list response unsuccessful: code={}, message={}", response.code(), response.message());
                    }
                }
            } catch (Exception e) {
                log.error("Failed to list pods raw in namespace 'aiops': {}", e.getMessage());
            }
            telemetry.put("pods", podList);

            // 3. Fetch Deployments in namespace "aiops"
            io.kubernetes.client.openapi.apis.AppsV1Api appsV1Api = new io.kubernetes.client.openapi.apis.AppsV1Api();
            List<java.util.Map<String, Object>> deployList = new java.util.ArrayList<>();
            V1DeploymentList deploys = appsV1Api.listNamespacedDeployment("aiops").execute();
            if (deploys != null && deploys.getItems() != null) {
                for (V1Deployment deploy : deploys.getItems()) {
                    if (deploy.getMetadata() != null) {
                        java.util.Map<String, Object> d = new java.util.HashMap<>();
                        d.put("name", deploy.getMetadata().getName());
                        d.put("namespace", deploy.getMetadata().getNamespace());
                        
                        int replicas = 0;
                        int readyReplicas = 0;
                        if (deploy.getSpec() != null && deploy.getSpec().getReplicas() != null) {
                            replicas = deploy.getSpec().getReplicas();
                        }
                        if (deploy.getStatus() != null && deploy.getStatus().getReadyReplicas() != null) {
                            readyReplicas = deploy.getStatus().getReadyReplicas();
                        }
                        d.put("replicas", replicas);
                        d.put("readyReplicas", readyReplicas);
                        deployList.add(d);
                    }
                }
            }
            telemetry.put("deployments", deployList);

            // 4. Fetch Services in namespace "aiops"
            List<java.util.Map<String, Object>> serviceList = new java.util.ArrayList<>();
            V1ServiceList svcs = coreV1Api.listNamespacedService("aiops").execute();
            if (svcs != null && svcs.getItems() != null) {
                for (V1Service svc : svcs.getItems()) {
                    if (svc.getMetadata() != null) {
                        java.util.Map<String, Object> s = new java.util.HashMap<>();
                        s.put("name", svc.getMetadata().getName());
                        s.put("namespace", svc.getMetadata().getNamespace());
                        
                        String type = "ClusterIP";
                        if (svc.getSpec() != null) {
                            type = svc.getSpec().getType() != null ? svc.getSpec().getType() : "ClusterIP";
                        }
                        s.put("type", type);
                        serviceList.add(s);
                    }
                }
            }
            telemetry.put("services", serviceList);

        } catch (Exception e) {
            log.error("Error fetching cluster telemetry: {}", e.getMessage());
            telemetry.put("status", "ERROR");
            telemetry.put("error", e.getMessage());
        }

        return telemetry;
    }
}
