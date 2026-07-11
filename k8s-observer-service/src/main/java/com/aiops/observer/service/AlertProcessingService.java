package com.aiops.observer.service;

import com.aiops.observer.dto.AlertWebhookDTO;

/**
 * ==============================================================
 * AlertProcessingService
 * ==============================================================
 *
 * Purpose:
 * Coordinates the receipt, parsing, and context mapping of Alertmanager webhook payloads.
 *
 * Why it exists:
 * Decouples the HTTP layer (Controller) from alerts orchestration,
 * providing the foundation for logging and later invoking the AI diagnostics.
 */
public interface AlertProcessingService {

    void processAlerts(AlertWebhookDTO webhookDTO, String correlationId);

}
