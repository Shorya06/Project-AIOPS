package com.aiops.healing.dto;

/**
 * ==============================================================
 * ConfidenceLevel Enum
 * ==============================================================
 *
 * Purpose:
 * Represents the confidence level of the AI diagnostics analysis.
 *
 * Why it exists:
 * Restricts AI diagnosis confidence to three distinct states (HIGH, MEDIUM, LOW),
 * simplifying evaluation and logging compared to percentage points.
 */
public enum ConfidenceLevel {
    HIGH,
    MEDIUM,
    LOW
}
