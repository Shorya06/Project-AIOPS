package com.aiops.observer.context;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

/**
 * ==============================================================
 * FailureContext
 * ==============================================================
 *
 * Purpose:
 * Encapsulates the complete Kubernetes runtime failure context
 * (pod name, namespace, resource limits/requests, logs, events)
 * to be processed by the AI diagnosis engine.
 *
 * Why it exists:
 * Serves as the rich data-carrier structure passed from the
 * Observer Service to the Healing Service during diagnostics.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FailureContext {
    private String correlationId;
    private String podName;
    private String namespace;
    private String alertName;
    private String severity;
    private String deploymentName;
    private Integer restartCount;
    private Integer exitCode;
    private String cpuUsage;
    private String memoryUsage;
    private String cpuRequest;
    private String cpuLimit;
    private String memoryRequest;
    private String memoryLimit;
    private String containerState;
    private List<String> recentPodEvents;
    private String last50LogLines;
    private LocalDateTime timestamp;
}
