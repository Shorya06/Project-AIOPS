package com.aiops.healing.entity;

/**
 * ==============================================================
 * HealingStatus Enum
 * ==============================================================
 * 
 * Purpose: Tracks the lifecycle status of a healing operation.
 * 
 * Why it exists: Provides status tracking to monitor execution logs
 * (e.g., whether the AI has initiated, successfully resolved, or failed a repair).
 */
public enum HealingStatus {
    PENDING,
    SUCCESS,
    FAILED,
    PARTIAL
}
