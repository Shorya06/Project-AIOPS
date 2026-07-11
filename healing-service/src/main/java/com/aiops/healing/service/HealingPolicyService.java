package com.aiops.healing.service;

import com.aiops.healing.dto.AIHealingDecision;

/**
 * ==============================================================
 * HealingPolicyService
 * ==============================================================
 *
 * Purpose:
 * Validation layer that ensures AI recommendations conform to system safety policies.
 *
 * Why it exists:
 * Enforces limits, confidence thresholds, and whitelists, rejecting dangerous actions.
 */
public interface HealingPolicyService {

    void validateDecision(AIHealingDecision decision);

}
