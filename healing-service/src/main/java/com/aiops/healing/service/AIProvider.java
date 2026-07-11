package com.aiops.healing.service;

import com.aiops.healing.context.FailureContext;
import com.aiops.healing.dto.AIAnalysisResult;

/**
 * ==============================================================
 * AIProvider
 * ==============================================================
 *
 * Purpose:
 * Interface abstraction for generative AI diagnostics providers.
 *
 * Why it exists:
 * Decouples the Healing Service from specific LLM clients (Gemini, OpenAI, Claude),
 * allowing future engines to be plugged in without modifying business orchestration rules.
 */
public interface AIProvider {

    AIAnalysisResult analyzeFailure(FailureContext context, String prompt, String correlationId);

}
