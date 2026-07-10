package com.aiops.observer.client;

import com.aiops.observer.dto.PodFailureRequestDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

/**
 * ==============================================================
 * HealingClient
 * ==============================================================
 *
 * PURPOSE
 * -------
 * Allows the Observer Service to communicate with the Healing Service.
 *
 * Instead of manually making HTTP requests,
 * Spring Cloud OpenFeign generates the implementation automatically.
 */
@FeignClient(
        name = "healing-service",
        url = "http://localhost:8082"
)
public interface HealingClient {

    /**
     * Calls:
     * POST http://localhost:8082/api/v1/healing/restart
     */
    @PostMapping("/api/v1/healing/restart")
    void restartPod(@RequestBody PodFailureRequestDTO request);
}