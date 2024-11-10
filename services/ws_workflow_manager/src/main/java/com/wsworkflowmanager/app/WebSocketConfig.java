package com.wsworkflowmanager.app;

import org.springframework.amqp.rabbit.annotation.EnableRabbit;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
@EnableRabbit
public class WebSocketConfig implements WebSocketConfigurer {
  private Receiver handler;

  public WebSocketConfig(Receiver handler) {
    this.handler = handler;
  }

  @Override
  public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
    registry.addHandler(this.handler, "/workflowmanager").setAllowedOrigins("*");
  }
}
