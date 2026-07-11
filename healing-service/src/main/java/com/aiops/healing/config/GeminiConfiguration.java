package com.aiops.healing.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * ==============================================================
 * GeminiConfiguration
 * ==============================================================
 *
 * Purpose:
 * Configures the Spring WebClient bean used to connect to Google Generative AI endpoints.
 *
 * Why it exists:
 * Consolidates network configurations, timeouts, and headers in one place
 * to support clean REST interactions.
 */
@Configuration
public class GeminiConfiguration {

    @Bean
    public WebClient geminiWebClient(WebClient.Builder builder) {
        return builder
                .baseUrl("https://generativelanguage.googleapis.com")
                .defaultHeader("Content-Type", "application/json")
                .build();
    }
}
