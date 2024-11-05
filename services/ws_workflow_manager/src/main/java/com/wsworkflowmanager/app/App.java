package com.wsworkflowmanager.app;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class App {
  static final String topicExchangeName = "workflow-manager-mutations";

  static final String registerQueueName = "workflow-manager-event-register";
  static final String notifyQueueName = "workflow-manager-event-notify";

  @Bean
  Queue registerQueue() {
    return new Queue(App.registerQueueName, false);
  }

  @Bean
  Queue notifyQueue() {
    return new Queue(App.notifyQueueName, false);
  }

  @Bean
  TopicExchange exchange() {
    return new TopicExchange(App.topicExchangeName);
  }

  @Bean
  Binding bindingRegister(TopicExchange exchange) {
    return BindingBuilder.bind(this.registerQueue())
        .to(exchange)
        .with("workflow.entities.mutations");
  }

  @Bean
  Binding bindingNotify(TopicExchange exchange) {
    return BindingBuilder.bind(this.notifyQueue()).to(exchange).with("workflow.entities.mutations");
  }

  public static void main(String[] args) {
    SpringApplication.run(App.class, args);
  }
}
