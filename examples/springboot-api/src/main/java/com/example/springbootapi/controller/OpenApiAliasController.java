package com.example.springbootapi.controller;

import org.springframework.core.io.ClassPathResource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

@RestController
public class OpenApiAliasController {
    private final RestTemplate restTemplate = new RestTemplate();

    @GetMapping("/openapi.json")
    public ResponseEntity<String> openapiJson() {
        String spec = restTemplate.getForObject("http://localhost:8080/v3/api-docs", String.class);
        return ResponseEntity.ok(spec);
    }

    @GetMapping("/swagger.json")
    public ResponseEntity<String> swaggerJson() {
        String spec = restTemplate.getForObject("http://localhost:8080/v3/api-docs", String.class);
        return ResponseEntity.ok(spec);
    }
}
