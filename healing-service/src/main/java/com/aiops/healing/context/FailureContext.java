package com.aiops.healing.context;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

/**
 * ==============================================================
 * FailureContext
 * ==============================================================
 *
 * Purpose:
 * Encapsulates the complete Kubernetes runtime failure context received from the
 * Observer Service for AI-powered self-healing diagnostics.
 *
 * Why it exists:
 * Binds the JSON schema of incoming webhook events to strongly-typed fields
 * inside the Healing Service.
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
