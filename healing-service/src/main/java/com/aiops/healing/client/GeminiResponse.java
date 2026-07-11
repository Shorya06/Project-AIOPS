package com.aiops.healing.client;

import lombok.*;
import java.util.List;

/**
 * ==============================================================
 * GeminiResponse
 * ==============================================================
 *
 * Purpose:
 * Models the response payload returned by the Gemini generateContent REST endpoint.
 *
 * Why it exists:
 * Parses candidates, content, and text parts from the raw JSON response.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GeminiResponse {

    private List<Candidate> candidates;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Candidate {
        private Content content;
        private String finishReason;
        private Integer index;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Content {
        private List<Part> parts;
        private String role;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Part {
        private String text;
    }
}
