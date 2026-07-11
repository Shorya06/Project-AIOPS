package com.aiops.healing.service.impl;

import com.aiops.healing.config.HealingPolicyProperties;
import com.aiops.healing.dto.AIHealingDecision;
import com.aiops.healing.dto.ConfidenceLevel;
import com.aiops.healing.entity.HealingAction;
import com.aiops.healing.service.HealingPolicyService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * ==============================================================
 * HealingPolicyServiceImpl
 * ==============================================================
 *
 * Purpose:
 * Concrete implementation of the HealingPolicyService interface.
 *
 * Why it exists:
 * Validates recommended actions, confidence levels, and checks required action parameters
 * (replicas or memoryLimit) against externalized configuration constraints before execution.
 */
@Service
public class HealingPolicyServiceImpl implements HealingPolicyService {

    private static final Logger log = LoggerFactory.getLogger(HealingPolicyServiceImpl.class);

    private final HealingPolicyProperties policyProperties;

    private static final List<HealingAction> WHITELISTED_ACTIONS = List.of(
            HealingAction.RESTART_POD,
            HealingAction.SCALE_DEPLOYMENT,
            HealingAction.INCREASE_MEMORY_LIMIT,
            HealingAction.NO_ACTION
    );

    public HealingPolicyServiceImpl(HealingPolicyProperties policyProperties) {
        this.policyProperties = policyProperties;
    }

    @Override
    public void validateDecision(AIHealingDecision decision) {
        if (decision == null) {
            log.warn("Received null AI decision during policy checks.");
            return;
        }

        log.info("Applying Healing Policy to AI Decision. Action: {}, Confidence: {}",
                decision.getRecommendedAction(), decision.getConfidence());

        // 1. Enforce Confidence Policy
        if (decision.getConfidence() == ConfidenceLevel.LOW) {
            log.warn("Policy Violation: Low confidence action rejected.");
            decision.setRecommendedAction(HealingAction.NO_ACTION);
            decision.setReasoning("Low confidence AI recommendation requires manual review. Original Reasoning: " + decision.getReasoning());
            return;
        }

        // 2. Enforce Action Whitelist
        if (!WHITELISTED_ACTIONS.contains(decision.getRecommendedAction())) {
            log.warn("Policy Violation: Action {} is not whitelisted.", decision.getRecommendedAction());
            decision.setRecommendedAction(HealingAction.NO_ACTION);
            return;
        }

        // 3. Validate ActionParameters
        HealingAction action = decision.getRecommendedAction();
        if (action == HealingAction.SCALE_DEPLOYMENT) {
            if (decision.getActionParameters() == null || decision.getActionParameters().getReplicas() == null) {
                log.warn("Policy Violation: SCALE_DEPLOYMENT action requires 'replicas' parameter. Rejecting action.");
                decision.setRecommendedAction(HealingAction.NO_ACTION);
                return;
            }
            int requestedReplicas = decision.getActionParameters().getReplicas();
            if (requestedReplicas < 1) {
                log.warn("Policy Violation: Requested replicas {} is less than 1. Setting to 1.", requestedReplicas);
                decision.getActionParameters().setReplicas(1);
            } else if (requestedReplicas > policyProperties.getMaxReplicas()) {
                log.warn("Policy Violation: Requested replicas {} exceeds max limit of {}. Capping replicas.",
                        requestedReplicas, policyProperties.getMaxReplicas());
                decision.getActionParameters().setReplicas(policyProperties.getMaxReplicas());
            }
        } else if (action == HealingAction.INCREASE_MEMORY_LIMIT) {
            if (decision.getActionParameters() == null || decision.getActionParameters().getMemoryLimit() == null) {
                log.warn("Policy Violation: INCREASE_MEMORY_LIMIT action requires 'memoryLimit' parameter. Rejecting action.");
                decision.setRecommendedAction(HealingAction.NO_ACTION);
                return;
            }
            String requestedLimit = decision.getActionParameters().getMemoryLimit();
            long maxMb = parseMemoryToMb(policyProperties.getMaxMemoryLimit());
            long requestedMb = parseMemoryToMb(requestedLimit);
            if (requestedMb > maxMb) {
                log.warn("Policy Violation: Requested memory limit {} exceeds policy max limit of {}. Capping limit.",
                        requestedLimit, policyProperties.getMaxMemoryLimit());
                decision.getActionParameters().setMemoryLimit(policyProperties.getMaxMemoryLimit());
            }
        }

        log.info("Healing Policy validation passed. Safe to proceed with action: {}", decision.getRecommendedAction());
    }

    private long parseMemoryToMb(String memory) {
        if (memory == null) return 0;
        String clean = memory.trim().toUpperCase();
        try {
            if (clean.endsWith("GI")) {
                return Long.parseLong(clean.replace("GI", "")) * 1024;
            } else if (clean.endsWith("MI")) {
                return Long.parseLong(clean.replace("MI", ""));
            } else if (clean.endsWith("G")) {
                return Long.parseLong(clean.replace("G", "")) * 1024;
            } else if (clean.endsWith("M")) {
                return Long.parseLong(clean.replace("M", ""));
            }
            return Long.parseLong(clean);
        } catch (Exception e) {
            log.warn("Failed to parse memory limit: {}. Defaulting to 1024MB", memory);
            return 1024;
        }
    }
}
