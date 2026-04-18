package com.nest.nestapp.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import jakarta.validation.ConstraintViolationException;
import java.util.HashMap;
import java.util.Map;
import java.util.NoSuchElementException;

/**
 * Centralised exception handler.
 *
 * Returns clean, user-facing messages instead of leaking internal stack traces,
 * SQL state codes, or service implementation details.
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /** Validation failures on @RequestBody (e.g. @NotNull, @Min, @Max). */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(error.getField(), error.getDefaultMessage());
        }
        Map<String, Object> body = new HashMap<>();
        body.put("status", 400);
        body.put("error", "Invalid request");
        body.put("fields", fieldErrors);
        return ResponseEntity.badRequest().body(body);
    }

    /** Constraint violations on path variables or query params. */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, Object>> handleConstraintViolation(ConstraintViolationException ex) {
        log.debug("Constraint violation: {}", ex.getMessage());
        return errorResponse(HttpStatus.BAD_REQUEST, "Invalid request parameters");
    }

    /** Wrong type in path variable (e.g. non-UUID searchId). */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        log.debug("Type mismatch on parameter '{}': {}", ex.getName(), ex.getMessage());
        return errorResponse(HttpStatus.BAD_REQUEST, "Invalid value for parameter: " + ex.getName());
    }

    /** Entity not found — thrown by service layer when a search ID is unknown. */
    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(NoSuchElementException ex) {
        log.debug("Resource not found: {}", ex.getMessage());
        return errorResponse(HttpStatus.NOT_FOUND, "The requested resource was not found");
    }

    /** Malformed JSON body or type mismatch on deserialize (not the same as validation). */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleUnreadable(HttpMessageNotReadableException ex) {
        log.warn("Unreadable request body: {}", ex.getMessage());
        return errorResponse(HttpStatus.BAD_REQUEST, "Invalid request body");
    }

    /** DB unique / FK / check constraint (e.g. RLS, wrong role, schema drift). */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrity(DataIntegrityViolationException ex) {
        log.error("Data integrity violation", ex);
        return errorResponse(HttpStatus.CONFLICT, "Could not save data. Check server logs and database configuration.");
    }

    /** Other persistence errors (connection, RLS, etc.). */
    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<Map<String, Object>> handleDataAccess(DataAccessException ex) {
        log.error("Data access error", ex);
        return errorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Database error. Check server logs and connection settings.");
    }

    /** Catch-all for RuntimeExceptions from the service layer (e.g. "Scraping job not found"). */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntime(RuntimeException ex) {
        log.error("Unhandled runtime exception", ex);
        return errorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred");
    }

    /** Final catch-all. */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneral(Exception ex) {
        log.error("Unhandled exception", ex);
        return errorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred");
    }

    private static ResponseEntity<Map<String, Object>> errorResponse(HttpStatus status, String message) {
        Map<String, Object> body = new HashMap<>();
        body.put("status", status.value());
        body.put("error", message);
        return ResponseEntity.status(status).body(body);
    }
}
