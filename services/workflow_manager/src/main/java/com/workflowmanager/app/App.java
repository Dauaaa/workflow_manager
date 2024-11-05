package com.workflowmanager.app;

import java.util.UUID;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpHeaders;

@SpringBootApplication
public class App {
  public static final String topicExchangeName = "workflow-manager-mutations";

  @Bean
  TopicExchange exchange() {
    return new TopicExchange(App.topicExchangeName);
  }

  public static HttpHeaders mutationResponseHeaders(UUID eventId) {
    HttpHeaders responseHeaders = new HttpHeaders();
    responseHeaders.set("wm-event-id", eventId.toString());

    return responseHeaders;
  }

  public static void main(String[] args) {
    SpringApplication.run(App.class, args);
  }
}
