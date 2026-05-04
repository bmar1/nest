package com.nest.nestapp.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class HealthController {

    private final JdbcTemplate jdbcTemplate;

    @GetMapping({"/", "/api/v1/health"})
    public Map<String, Object> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "nest-api");
        
        try {
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            response.put("database", "connected");
        } catch (Exception e) {
            response.put("database", "disconnected");
            response.put("status", "DOWN");
        }
        
        return response;
    }
}
