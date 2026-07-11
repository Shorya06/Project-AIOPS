package com.aiops.healing.client;

import lombok.*;
import java.util.List;
import java.util.Map;

/**
 * ==============================================================
 * GeminiRequest
 * ==============================================================
 *
 * Purpose:
 * Models the request payload for Google's Gemini generateContent REST API endpoint.
 *
 * Why it exists:
 * Maps contents, parts, and generation configurations to enforce structured JSON output.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GeminiRequest {

    private List<Content> contents;
    private GenerationConfig generationConfig;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Content {
        private List<Part> parts;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Part {
        private String text;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class GenerationConfig {
        private String responseMimeType;
        private ResponseSchema responseSchema;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ResponseSchema {
        private String type;
        private Map<String, SchemaProperty> properties;
        private List<String> required;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SchemaProperty {
        private String type;
        private List<String> enumeration;
        private Map<String, SchemaProperty> properties; // Support recursive nesting
        
        @com.fasterxml.jackson.annotation.JsonProperty("enum")
        public List<String> getEnumeration() {
            return enumeration;
        }
    }
}
