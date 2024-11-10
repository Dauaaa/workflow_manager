package com.workflowmanager.app;

import java.util.UUID;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.CachingConnectionFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpHeaders;

@SpringBootApplication
public class App {
  public static final String topicExchangeName = "workflow-manager-mutations";

  @Value("${spring.rabbitmq.host}")
  String rabbitHost;

  @Value("${spring.rabbitmq.port}")
  Integer rabbitPort;

  @Value("${spring.rabbitmq.username}")
  String rabbitUsername;

  @Value("${spring.rabbitmq.password}")
  String rabbitPassword;

  @Bean
  ConnectionFactory connectionFactory() {
    System.out.println(this.rabbitHost);
    System.out.println(this.rabbitUsername);
    CachingConnectionFactory cachingConnectionFactory =
        new CachingConnectionFactory(this.rabbitHost);
    cachingConnectionFactory.setUsername(this.rabbitUsername);
    cachingConnectionFactory.setPassword(this.rabbitPassword);
    cachingConnectionFactory.setPort(this.rabbitPort);
    return cachingConnectionFactory;
  }

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
