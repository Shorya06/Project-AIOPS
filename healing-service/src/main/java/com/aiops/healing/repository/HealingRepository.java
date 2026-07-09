package com.aiops.healing.repository;

import com.aiops.healing.entity.HealingOperation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * ==============================================================
 * HealingRepository Interface
 * ==============================================================
 * 
 * Purpose: Provides standard database operations (CRUD) for HealingOperation entities.
 * 
 * Why it exists: Integrates with Spring Data JPA to provide built-in database queries
 * without writing SQL code, separating data access from service logic.
 */
@Repository
public interface HealingRepository extends JpaRepository<HealingOperation, Long> {
}
