package com.wsworkflowmanager.app;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class Receiver {

  @RabbitListener(queues = App.registerQueueName)
  public void receiveMessageRegister(String message) {
    System.out.println("REGISTER: Received <" + message + ">");
  }

  @RabbitListener(queues = App.notifyQueueName)
  public void receiveMessageNotify(String message) {
    System.out.println("NOTIFY: Received <" + message + ">");
  }
}
