package com.aiops.observer.service;

import com.aiops.observer.context.FailureContext;

/**
 * ==============================================================
 * KubernetesContextService
 * ==============================================================
 *
 * Purpose:
 * Service contract for fetching runtime pod details, events, and log diagnostics
 * using the Kubernetes API client.
 *
 * Why it exists:
 * Abstracts calls to the Kubernetes API, isolating K8s cluster interactions
 * from general event processing logic.
 */
public interface KubernetesContextService {

    FailureContext buildFailureContext(String podName, String namespace, String alertName, String severity, String correlationId);

}
