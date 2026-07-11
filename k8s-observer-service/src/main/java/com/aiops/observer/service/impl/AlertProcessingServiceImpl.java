package com.aiops.observer.service.impl;

import com.aiops.observer.client.HealingClient;
import com.aiops.observer.context.FailureContext;
import com.aiops.observer.dto.AlertDTO;
import com.aiops.observer.dto.AlertWebhookDTO;
import com.aiops.observer.service.AlertProcessingService;
import com.aiops.observer.service.KubernetesContextService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * ==============================================================
 * AlertProcessingServiceImpl
 * ==============================================================
 *
 * Purpose:
 * Concrete implementation that handles logging, context enrichment, and forwarding of alerts.
 *
 * Why it exists:
 * Exposes the logical execution hook to process alert metadata,
 * calls KubernetesContextService to enrich context, and forwards it to Healing Service.
 */
@Service
public class AlertProcessingServiceImpl implements AlertProcessingService {

    private static final Logger log = LoggerFactory.getLogger(AlertProcessingServiceImpl.class);

    private final KubernetesContextService kubernetesContextService;
    private final HealingClient healingClient;

    public AlertProcessingServiceImpl(
            KubernetesContextService kubernetesContextService,
            HealingClient healingClient) {
        this.kubernetesContextService = kubernetesContextService;
        this.healingClient = healingClient;
    }

    @Override
    public void processAlerts(AlertWebhookDTO webhookDTO, String correlationId) {
        if (webhookDTO == null || webhookDTO.getAlerts() == null) {
            log.warn("[CorrelationID: {}] Received empty or null Alertmanager webhook payload.", correlationId);
            return;
        }

        log.info("[CorrelationID: {}] Processing Alertmanager webhook. Status: {}, Receiver: {}, Alerts Count: {}",
                correlationId, webhookDTO.getStatus(), webhookDTO.getReceiver(), webhookDTO.getAlerts().size());

        for (AlertDTO alert : webhookDTO.getAlerts()) {
            String alertName = alert.getLabels() != null ? alert.getLabels().getAlertname() : "UnknownAlert";
            String namespace = alert.getLabels() != null ? alert.getLabels().getNamespace() : "default";
            String podName = alert.getLabels() != null ? alert.getLabels().getPod() : "unknown-pod";
            String severity = alert.getLabels() != null ? alert.getLabels().getSeverity() : "info";

            log.info("[CorrelationID: {}] Alert firing -> Name: {}, Namespace: {}, Pod: {}, Severity: {}",
                    correlationId, alertName, namespace, podName, severity);

            // 1. Build K8s failure context
            FailureContext context = kubernetesContextService.buildFailureContext(podName, namespace, alertName, severity, correlationId);
            log.info("[CorrelationID: {}] Enriched FailureContext successfully created for pod: {}", correlationId, podName);

            // 2. Call Healing Service for AI analysis
            try {
                Object decision = healingClient.analyzeFailure(context);
                log.info("[CorrelationID: {}] Successfully received AI diagnosis decision from Healing Service: {}", correlationId, decision);
            } catch (Exception e) {
                log.error("[CorrelationID: {}] Failed to forward FailureContext to Healing Service for AI analysis: {}", correlationId, e.getMessage());
            }
        }
    }
}
