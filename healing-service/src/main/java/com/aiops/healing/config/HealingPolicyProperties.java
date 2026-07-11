package com.aiops.healing.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * ==============================================================
 * HealingPolicyProperties
 * ==============================================================
 *
 * Purpose:
 * Binds configuration properties from application.yml related to self-healing safety limits.
 *
 * Why it exists:
 * Externalizes limits such as maximum replicas, max memory configurations, and cooldowns.
 */
@Component
@ConfigurationProperties(prefix = "healing.policy")
@Data
public class HealingPolicyProperties {
    private int maxReplicas = 5;
    private String maxMemoryLimit = "2048Mi";
    private int feedbackDelaySeconds = 60;
}
