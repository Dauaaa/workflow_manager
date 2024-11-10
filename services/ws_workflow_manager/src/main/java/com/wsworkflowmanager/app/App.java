package com.wsworkflowmanager.app;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.CachingConnectionFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;

@SpringBootApplication
public class App {
  static final String topicExchangeName = "workflow-manager-mutations";

  static final String registerQueueName = "workflow-manager-event-register";
  static final String notifyQueueName = "workflow-manager-event-notify";

  @Value("${spring.rabbitmq.host}")
  String rabbitHost;

  @Value("${spring.rabbitmq.port}")
  Integer rabbitPort;

  @Value("${spring.rabbitmq.username}")
  String rabbitUsername;

  @Value("${spring.rabbitmq.password}")
  String rabbitPassword;

  @Value("${spring.redis.host}")
  String redisHost;

  @Value("${spring.redis.port}")
  Integer redisPort;

  @Value("${spring.redis.password}")
  String redisPassword;

  @Bean
  ConnectionFactory connectionFactory() {
    CachingConnectionFactory cachingConnectionFactory =
        new CachingConnectionFactory(this.rabbitHost);
    cachingConnectionFactory.setUsername(this.rabbitUsername);
    cachingConnectionFactory.setPassword(this.rabbitPassword);
    cachingConnectionFactory.setPort(this.rabbitPort);
    return cachingConnectionFactory;
  }

  @Bean
  public LettuceConnectionFactory redisStandAloneConnectionFactory() {
    return new LettuceConnectionFactory(
        new RedisStandaloneConfiguration(this.redisHost, this.redisPort));
  }

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
