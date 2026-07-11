package com.aiops.healing.repository;

import com.aiops.healing.entity.AIAnalysisRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * ==============================================================
 * AIAnalysisRecordRepository
 * ==============================================================
 *
 * Purpose:
 * Spring Data JPA Repository interface for saving AI analysis audit logs.
 *
 * Why it exists:
 * Exposes standard CRUD operations against the ai_analysis_records table.
 */
@Repository
public interface AIAnalysisRecordRepository extends JpaRepository<AIAnalysisRecord, Long> {
}
