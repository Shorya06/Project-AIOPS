package com.aiops.healing.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * ==============================================================
 * HealingOperationNotFoundException
 * ==============================================================
 * 
 * Purpose: Custom runtime exception triggered when a healing operation
 * cannot be retrieved by its primary key.
 * 
 * Why it exists: Provides clear and descriptive error messages at runtime
 * and maps the response to HTTP 404 (Not Found).
 */
@ResponseStatus(HttpStatus.NOT_FOUND)
public class HealingOperationNotFoundException extends RuntimeException {
    public HealingOperationNotFoundException(String message) {
        super(message);
    }
}
