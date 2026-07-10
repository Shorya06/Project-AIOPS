package com.aiops.observer;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

/**
 * ==============================================================
 * K8sObserverServiceApplication
 * ==============================================================
 *
 * PURPOSE
 * -------
 * Main entry point of the Kubernetes Observer Service.
 *
 * WHY THIS CLASS EXISTS
 * ---------------------
 * Spring Boot starts the application from here.
 *
 * @EnableFeignClients tells Spring to automatically generate
 * implementations for all interfaces annotated with @FeignClient.
 */
@SpringBootApplication
@EnableFeignClients
public class K8sObserverServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(K8sObserverServiceApplication.class, args);
    }
}