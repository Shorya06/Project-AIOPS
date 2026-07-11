package com.aiops.healing.service;

import com.aiops.healing.context.FailureContext;
import com.aiops.healing.dto.AIAnalysisResult;

/**
 * ==============================================================
 * AIAnalysisService
 * ==============================================================
 *
 * Purpose:
 * Service contract for orchestrating prompt templates and AI-powered evaluations.
 *
 * Why it exists:
 * Exposes a structured wrapper to orchestrate diagnostics calls across the backend.
 */
public interface AIAnalysisService {

    AIAnalysisResult analyzeFailure(FailureContext context, String promptText, String correlationId);

}
