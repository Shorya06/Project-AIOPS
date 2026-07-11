package com.aiops.healing.service.impl;

import com.aiops.healing.client.GeminiRequest;
import com.aiops.healing.client.GeminiResponse;
import com.aiops.healing.config.GeminiProperties;
import com.aiops.healing.context.FailureContext;
import com.aiops.healing.dto.AIAnalysisResult;
import com.aiops.healing.dto.AIHealingDecision;
import com.aiops.healing.dto.ConfidenceLevel;
import com.aiops.healing.entity.HealingAction;
import com.aiops.healing.service.AIProvider;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

/**
 * ==============================================================
 * GeminiProvider
 * ==============================================================
 *
 * Purpose:
 * Implements the AIProvider interface specifically for Google's Gemini API.
 *
 * Why it exists:
 * Concrete provider that marshals prompt data into the GenerateContent REST format,
 * executing the request over WebClient and returning the validated output DTO.
 */
@Component
public class GeminiProvider implements AIProvider {

    private static final Logger log = LoggerFactory.getLogger(GeminiProvider.class);

    private final WebClient webClient;
    private final GeminiProperties geminiProperties;
    private final ObjectMapper objectMapper;

    public GeminiProvider(WebClient geminiWebClient, GeminiProperties geminiProperties, ObjectMapper objectMapper) {
        this.webClient = geminiWebClient;
        this.geminiProperties = geminiProperties;
        this.objectMapper = objectMapper;
    }

    @Override
    public AIAnalysisResult analyzeFailure(FailureContext context, String promptText, String correlationId) {
        log.info("[CorrelationID: {}] Querying Gemini AI model for Alert: {}", correlationId, context.getAlertName());

        // 1. Build Schema properties to restrict Gemini response output structure
        GeminiRequest.SchemaProperty diagnosisProp = GeminiRequest.SchemaProperty.builder().type("STRING").build();
        GeminiRequest.SchemaProperty reasoningProp = GeminiRequest.SchemaProperty.builder().type("STRING").build();
        
        GeminiRequest.SchemaProperty recommendedActionProp = GeminiRequest.SchemaProperty.builder()
                .type("STRING")
                .enumeration(List.of("RESTART_POD", "SCALE_DEPLOYMENT", "INCREASE_MEMORY_LIMIT", "NO_ACTION"))
                .build();
        
        GeminiRequest.SchemaProperty confidenceProp = GeminiRequest.SchemaProperty.builder()
                .type("STRING")
                .enumeration(List.of("HIGH", "MEDIUM", "LOW"))
                .build();
        
        GeminiRequest.SchemaProperty preventiveRecommendationProp = GeminiRequest.SchemaProperty.builder().type("STRING").build();

        // Nested action parameters schema
        GeminiRequest.SchemaProperty memoryLimitProp = GeminiRequest.SchemaProperty.builder().type("STRING").build();
        GeminiRequest.SchemaProperty replicasProp = GeminiRequest.SchemaProperty.builder().type("INTEGER").build();

        GeminiRequest.SchemaProperty actionParametersProp = GeminiRequest.SchemaProperty.builder()
                .type("OBJECT")
                .properties(Map.of(
                        "memoryLimit", memoryLimitProp,
                        "replicas", replicasProp
                ))
                .build();

        Map<String, GeminiRequest.SchemaProperty> properties = Map.of(
                "diagnosis", diagnosisProp,
                "reasoning", reasoningProp,
                "recommendedAction", recommendedActionProp,
                "confidence", confidenceProp,
                "preventiveRecommendation", preventiveRecommendationProp,
                "actionParameters", actionParametersProp
        );

        GeminiRequest.ResponseSchema schema = GeminiRequest.ResponseSchema.builder()
                .type("OBJECT")
                .properties(properties)
                .required(List.of("diagnosis", "reasoning", "recommendedAction", "confidence", "preventiveRecommendation"))
                .build();

        GeminiRequest.GenerationConfig generationConfig = GeminiRequest.GenerationConfig.builder()
                .responseMimeType("application/json")
                .responseSchema(schema)
                .build();

        GeminiRequest.Part part = GeminiRequest.Part.builder().text(promptText).build();
        GeminiRequest.Content content = GeminiRequest.Content.builder().parts(List.of(part)).build();

        GeminiRequest requestPayload = GeminiRequest.builder()
                .contents(List.of(content))
                .generationConfig(generationConfig)
                .build();

        String path = "/v1beta/models/" + geminiProperties.getModel() + ":generateContent?key=" + geminiProperties.getApiKey();

        log.debug("[CorrelationID: {}] Sending POST request to Gemini REST Endpoint path: {} (API Key obfuscated)", 
                correlationId, "/v1beta/models/" + geminiProperties.getModel() + ":generateContent");

        String rawResponseText = "";
        AIHealingDecision decision;

        try {
            GeminiResponse response = webClient.post()
                    .uri(path)
                    .bodyValue(requestPayload)
                    .retrieve()
                    .bodyToMono(GeminiResponse.class)
                    .block();

            if (response != null && response.getCandidates() != null && !response.getCandidates().isEmpty()) {
                GeminiResponse.Candidate candidate = response.getCandidates().get(0);
                if (candidate.getContent() != null && candidate.getContent().getParts() != null && !candidate.getContent().getParts().isEmpty()) {
                    rawResponseText = candidate.getContent().getParts().get(0).getText();
                    log.info("[CorrelationID: {}] Gemini raw response text successfully retrieved.", correlationId);
                    log.debug("[CorrelationID: {}] Raw Response: {}", correlationId, rawResponseText);

                    // 2. Parse and Validate Response
                    decision = objectMapper.readValue(rawResponseText, AIHealingDecision.class);
                    validateDecision(decision);
                    log.info("[CorrelationID: {}] Gemini response validation successful. Action recommended: {}", 
                            correlationId, decision.getRecommendedAction());
                } else {
                    rawResponseText = "{\"error\": \"Empty contents returned by model\"}";
                    decision = buildValidationFailureDecision("Empty contents returned by Gemini candidate parts.", rawResponseText, correlationId);
                }
            } else {
                rawResponseText = "{\"error\": \"No candidates returned by model\"}";
                decision = buildValidationFailureDecision("No candidates returned by Gemini endpoint.", rawResponseText, correlationId);
            }
        } catch (Exception e) {
            log.error("[CorrelationID: {}] Failed to query Gemini API or parse JSON schema response: {}", correlationId, e.getMessage());
            rawResponseText = "{\"error\": \"" + e.getMessage() + "\"}";
            decision = buildValidationFailureDecision("Error querying Gemini: " + e.getMessage(), rawResponseText, correlationId);
        }

        return AIAnalysisResult.builder()
                .decision(decision)
                .prompt(promptText)
                .rawResponse(rawResponseText)
                .modelUsed(geminiProperties.getModel())
                .build();
    }

    private void validateDecision(AIHealingDecision decision) {
        if (decision.getDiagnosis() == null || decision.getDiagnosis().isEmpty()) {
            throw new IllegalArgumentException("Diagnosis field is missing or empty.");
        }
        if (decision.getReasoning() == null || decision.getReasoning().isEmpty()) {
            throw new IllegalArgumentException("Reasoning field is missing or empty.");
        }
        if (decision.getRecommendedAction() == null) {
            throw new IllegalArgumentException("RecommendedAction field is missing or invalid.");
        }
        if (decision.getConfidence() == null) {
            throw new IllegalArgumentException("Confidence field is missing or invalid.");
        }
        if (decision.getPreventiveRecommendation() == null || decision.getPreventiveRecommendation().isEmpty()) {
            throw new IllegalArgumentException("PreventiveRecommendation field is missing or empty.");
        }
    }

    private AIHealingDecision buildValidationFailureDecision(String errorMessage, String rawResponse, String correlationId) {
        log.warn("[CorrelationID: {}] Building structured validation failure response. Reason: {}", correlationId, errorMessage);
        return AIHealingDecision.builder()
                .diagnosis("Validation failed for AI diagnosis response.")
                .reasoning("The Gemini engine failed to respond with a valid JSON payload matching schema constraints. Context: " + errorMessage)
                .recommendedAction(HealingAction.NO_ACTION)
                .confidence(ConfidenceLevel.LOW)
                .preventiveRecommendation("Verify prompt schema configurations, inspect network traffic logs, or retry.")
                .build();
    }
}
