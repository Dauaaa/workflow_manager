package com.workflowmanager.app;

import org.springframework.amqp.core.TopicExchange;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class App {
  public static final String topicExchangeName = "workflow-manager-mutations";

  @Bean
  TopicExchange exchange() {
    return new TopicExchange(App.topicExchangeName);
  }

  public static void main(String[] args) {
    SpringApplication.run(App.class, args);
  }
}
