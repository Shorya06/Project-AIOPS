package com.aiops.healing.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * ==============================================================
 * GeminiProperties
 * ==============================================================
 *
 * Purpose:
 * Binds configuration properties from application.yml related to the Gemini API.
 *
 * Why it exists:
 * Avoids hardcoding critical configurations (like API keys or model names),
 * allowing them to be injected via environment variables.
 */
@Component
@ConfigurationProperties(prefix = "gemini")
@Data
public class GeminiProperties {
    private String apiKey;
    private String model = "gemini-3.5-flash";
}
