package com.aiops.observer.client;

import com.aiops.observer.context.FailureContext;
import com.aiops.observer.dto.PodFailureRequestDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

/**
 * ==========================================================
 * HealingClient
 * ==========================================================
 *
 * PURPOSE
 * -------
 * Allows the Observer Service to communicate with the
 * Healing Service.
 *
 * The URL is configurable so the same code works in
 * Local, Docker and Kubernetes.
 */
@FeignClient(name = "healing-service", url = "${healing.service.url:http://localhost:8082}")
public interface HealingClient {

    @PostMapping("/api/v1/healing/restart")
    void restartPod(@RequestBody PodFailureRequestDTO request);

    @PostMapping("/api/v1/healing/analyze")
    Object analyzeFailure(@RequestBody FailureContext context);
}