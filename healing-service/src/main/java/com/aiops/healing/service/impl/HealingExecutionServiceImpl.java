package com.aiops.healing.service.impl;

import com.aiops.healing.dto.AIHealingDecision;
import com.aiops.healing.entity.HealingAction;
import com.aiops.healing.entity.HealingStatus;
import com.aiops.healing.service.HealingExecutionService;
import io.kubernetes.client.custom.V1Patch;
import io.kubernetes.client.openapi.ApiClient;
import io.kubernetes.client.openapi.Configuration;
import io.kubernetes.client.openapi.apis.AppsV1Api;
import io.kubernetes.client.openapi.apis.CoreV1Api;
import io.kubernetes.client.openapi.models.V1ContainerStatus;
import io.kubernetes.client.openapi.models.V1Pod;
import io.kubernetes.client.util.Config;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * ==============================================================
 * HealingExecutionServiceImpl
 * ==============================================================
 *
 * Purpose:
 * Concrete implementation that executes Kubernetes mutations (restarting,
 * scaling, modifying limits) and checks pod statuses.
 *
 * Why it exists:
 * Wraps K8s API builder invocations with try-catch blocks to prevent cluster
 * connection errors from crashing the main transaction pipeline.
 */
@Service
public class HealingExecutionServiceImpl implements HealingExecutionService {

    private static final Logger log = LoggerFactory.getLogger(HealingExecutionServiceImpl.class);

    private CoreV1Api coreV1Api;
    private AppsV1Api appsV1Api;

    public HealingExecutionServiceImpl() {
        try {
            ApiClient client = Config.defaultClient();
            Configuration.setDefaultApiClient(client);
            this.coreV1Api = new CoreV1Api();
            this.appsV1Api = new AppsV1Api();
            log.info("Kubernetes API clients initialized successfully in HealingExecutionService.");
        } catch (Exception e) {
            log.warn("Could not load default Kubernetes configuration. Running in offline/mock execution mode. Error: {}", e.getMessage());
            this.coreV1Api = null;
            this.appsV1Api = null;
        }
    }

    @Override
    public void executeRemediation(String podName, String namespace, String deploymentName, AIHealingDecision decision) {
        HealingAction action = decision.getRecommendedAction();
        log.info("Executing remediation action: {} on Pod: {} (Deployment: {})", action, podName, deploymentName);

        if (coreV1Api == null || appsV1Api == null) {
            log.warn("Kubernetes API client is offline. Simulating remediation execution -> SUCCESS");
            return;
        }

        try {
            switch (action) {
                case RESTART_POD:
                    log.info("Kubernetes Exec: Deleting pod {} in namespace {} to trigger restart.", podName, namespace);
                    coreV1Api.deleteNamespacedPod(podName, namespace).execute();
                    break;

                case SCALE_DEPLOYMENT:
                    int targetReplicas = decision.getActionParameters().getReplicas();
                    log.info("Kubernetes Exec: Patching deployment {} replicas to {} in namespace {}.", 
                            deploymentName, targetReplicas, namespace);
                    String jsonPatch = "[{\"op\": \"replace\", \"path\": \"/spec/replicas\", \"value\": " + targetReplicas + "}]";
                    appsV1Api.patchNamespacedDeployment(deploymentName, namespace, new V1Patch(jsonPatch)).execute();
                    log.info("Scale patch successfully executed in Kubernetes.");
                    break;

                case INCREASE_MEMORY_LIMIT:
                    String memoryLimit = decision.getActionParameters().getMemoryLimit();
                    log.info("Kubernetes Exec: Patching memory resource limits to {} for deployment {} in namespace {}.", 
                            memoryLimit, deploymentName, namespace);
                    String limitPatch = "[{\"op\": \"replace\", \"path\": \"/spec/template/spec/containers/0/resources/limits/memory\", \"value\": \"" + memoryLimit + "\"}]";
                    appsV1Api.patchNamespacedDeployment(deploymentName, namespace, new V1Patch(limitPatch)).execute();
                    log.info("Resource limits patch successfully applied to Kubernetes.");
                    break;

                case NO_ACTION:
                default:
                    log.info("No Kubernetes remediation action needed.");
                    break;
            }
        } catch (Exception e) {
            log.error("Failed to execute Kubernetes remediation action {}: {}", action, e.getMessage());
            throw new RuntimeException("Remediation execution failed: " + e.getMessage(), e);
        }
    }

    @Override
    public HealingStatus checkPodHealth(String podName, String namespace) {
        if (coreV1Api == null) {
            log.warn("Kubernetes API client is offline. Simulating pod health check -> SUCCESS");
            return HealingStatus.SUCCESS;
        }

        try {
            V1Pod pod = coreV1Api.readNamespacedPod(podName, namespace).execute();
            if (pod.getStatus() != null) {
                String phase = pod.getStatus().getPhase();
                if ("Running".equalsIgnoreCase(phase)) {
                    if (pod.getStatus().getContainerStatuses() != null && !pod.getStatus().getContainerStatuses().isEmpty()) {
                        boolean allReady = true;
                        boolean atLeastOneReady = false;
                        for (V1ContainerStatus status : pod.getStatus().getContainerStatuses()) {
                            Boolean ready = status.getReady();
                            if (ready != null && ready) {
                                atLeastOneReady = true;
                            } else {
                                allReady = false;
                            }
                        }
                        if (allReady) {
                            return HealingStatus.SUCCESS;
                        } else if (atLeastOneReady) {
                            return HealingStatus.PARTIAL;
                        } else {
                            return HealingStatus.FAILED;
                        }
                    }
                    return HealingStatus.SUCCESS;
                }
            }
        } catch (Exception e) {
            log.warn("Failed to check health of pod {} in namespace {}: {}", podName, namespace, e.getMessage());
        }
        return HealingStatus.FAILED;
    }
}
