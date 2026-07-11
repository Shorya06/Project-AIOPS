package com.aiops.healing.service.impl;

import com.aiops.healing.context.FailureContext;
import com.aiops.healing.dto.AIAnalysisResult;
import com.aiops.healing.service.AIAnalysisService;
import com.aiops.healing.service.AIProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * ==============================================================
 * AIAnalysisServiceImpl
 * ==============================================================
 *
 * Purpose:
 * Core orchestrator for AI-powered diagnostics.
 *
 * Why it exists:
 * Delegates prompt-execution to the abstract AIProvider implementation, decoupling
 * business orchestration from specific client HTTP request formats.
 */
@Service
public class AIAnalysisServiceImpl implements AIAnalysisService {

    private static final Logger log = LoggerFactory.getLogger(AIAnalysisServiceImpl.class);

    private final AIProvider aiProvider;

    public AIAnalysisServiceImpl(AIProvider aiProvider) {
        this.aiProvider = aiProvider;
    }

    @Override
    public AIAnalysisResult analyzeFailure(FailureContext context, String promptText, String correlationId) {
        log.info("[CorrelationID: {}] Orchestrating AI failure analysis via abstract AIProvider.", correlationId);
        return aiProvider.analyzeFailure(context, promptText, correlationId);
    }
}
