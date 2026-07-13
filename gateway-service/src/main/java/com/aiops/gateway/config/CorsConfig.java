package com.aiops.gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * ==============================================================
 * Global CORS Configuration
 * ==============================================================
 *
 * Purpose:
 * Applies Cross-Origin Resource Sharing headers to ALL requests
 * passing through the Gateway, including actuator endpoints and
 * proxied downstream routes.
 *
 * Why it exists:
 * Spring Cloud Gateway runs on WebFlux (Netty). The YAML-based
 * globalcors configuration only covers routed paths, NOT the
 * gateway's own management/actuator endpoints. This WebFilter
 * ensures every response — routed or local — includes the
 * correct Access-Control-Allow-* headers so the React frontend
 * on localhost:5173 can communicate without CORS errors.
 */
@Configuration
public class CorsConfig {

    @Bean
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return new CorsWebFilter(source);
    }
}
