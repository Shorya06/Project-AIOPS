package com.aiops.healing.service;

import com.aiops.healing.dto.AIHealingDecision;
import com.aiops.healing.entity.HealingStatus;

/**
 * ==============================================================
 * HealingExecutionService
 * ==============================================================
 *
 * Purpose:
 * Service contract for executing safe, validated Kubernetes remediation actions.
 *
 * Why it exists:
 * Isolates Kubernetes client mutation API calls from business log storage.
 */
public interface HealingExecutionService {

    void executeRemediation(String podName, String namespace, String deploymentName, AIHealingDecision decision);

    HealingStatus checkPodHealth(String podName, String namespace);

}
