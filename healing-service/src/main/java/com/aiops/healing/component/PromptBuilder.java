package com.aiops.healing.component;

import com.aiops.healing.context.FailureContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;
import org.springframework.util.StreamUtils;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * ==============================================================
 * PromptBuilder
 * ==============================================================
 *
 * Purpose:
 * Responsible for loading the external prompt template and rendering the
 * final prompt text injected with FailureContext details.
 *
 * Why it exists:
 * Decouples prompt layout design and string templating from AI orchestration
 * logic.
 */
@Component
public class PromptBuilder {

    private static final Logger log = LoggerFactory.getLogger(PromptBuilder.class);

    @Value("classpath:prompts/healing-analysis.txt")
    private Resource promptTemplateResource;

    private String templateContent;

    @PostConstruct
    public void init() {
        try {
            this.templateContent = StreamUtils.copyToString(promptTemplateResource.getInputStream(), StandardCharsets.UTF_8);
            log.info("Prompt template loaded successfully. Size: {} bytes", templateContent.length());
        } catch (IOException e) {
            log.error("Failed to load prompt template from classpath: {}", e.getMessage());
            this.templateContent = "";
        }
    }

    public String buildPrompt(FailureContext context) {
        if (templateContent.isEmpty()) {
            log.warn("Prompt template is empty, returning blank prompt.");
            return "";
        }

        String recentEventsStr = context.getRecentPodEvents() != null 
                ? String.join("\n", context.getRecentPodEvents()) 
                : "No events recorded.";

        return templateContent
                .replace("{alertName}", cleanString(context.getAlertName()))
                .replace("{severity}", cleanString(context.getSeverity()))
                .replace("{podName}", cleanString(context.getPodName()))
                .replace("{namespace}", cleanString(context.getNamespace()))
                .replace("{deploymentName}", cleanString(context.getDeploymentName()))
                .replace("{restartCount}", String.valueOf(context.getRestartCount()))
                .replace("{exitCode}", String.valueOf(context.getExitCode()))
                .replace("{containerState}", cleanString(context.getContainerState()))
                .replace("{cpuRequest}", cleanString(context.getCpuRequest()))
                .replace("{cpuLimit}", cleanString(context.getCpuLimit()))
                .replace("{memoryRequest}", cleanString(context.getMemoryRequest()))
                .replace("{memoryLimit}", cleanString(context.getMemoryLimit()))
                .replace("{recentEvents}", recentEventsStr)
                .replace("{logTail}", cleanString(context.getLast50LogLines()));
    }

    private String cleanString(String input) {
        return input == null ? "N/A" : input;
    }
}
