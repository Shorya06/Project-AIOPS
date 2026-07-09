package com.aiops.healing.entity;

/**
 * ==============================================================
 * HealingAction Enum
 * ==============================================================
 * 
 * Purpose: Defines the supported remediation operations that the AI
 * Self-Healing engine can perform.
 * 
 * Why it exists: Enforces compile-time type safety for actions, preventing
 * spelling or syntax mismatches in database queries and API payloads.
 */
public enum HealingAction {
    RESTART,
    SCALE
}
