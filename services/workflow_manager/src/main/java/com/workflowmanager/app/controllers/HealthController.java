package com.workflowmanager.app.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HealthController {
  public HealthController() {}

  @GetMapping("health")
  public ResponseEntity healthCheck() {
    System.out.println("health check");
    return ResponseEntity.ok().build();
  }
}
