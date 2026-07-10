package com.aiops.healing.client;

import com.aiops.healing.dto.NotificationRequestDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

/**
 * ==============================================================
 * NotificationClient Feign Interface
 * ==============================================================
 * 
 * Purpose: Declares the REST client boundary for calling the notification service.
 * 
 * Why it exists: Feign automatically generates the HTTP client wrapper at runtime,
 * permitting inter-service communication over REST endpoints.
 */
@FeignClient(
    name = "notification-service",
    url = "${notification-service.url:http://localhost:8083}",
    path = "/api/v1/notifications"
)
public interface NotificationClient {

    @PostMapping
    void sendNotification(@RequestBody NotificationRequestDTO request);
}
