package com.workflowmanager.app;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.workflowmanager.app.core.AuthorizationDTO;
import com.workflowmanager.app.core.ErrorUtils;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.core.task.TaskExecutor;
import org.springframework.stereotype.Component;

@Component
public class Publisher {
  private final RabbitTemplate rabbitTemplate;
  private final TaskExecutor taskExecutor;
  private ObjectMapper mapper;

  public MessageBatch batch() {
    return new MessageBatch(this.mapper);
  }

  public Publisher(RabbitTemplate rabbitTemplate, TaskExecutor taskExecutor) {
    this.rabbitTemplate = rabbitTemplate;
    this.taskExecutor = taskExecutor;
    this.mapper = new ObjectMapper();
    mapper.registerModule(new JavaTimeModule());
  }

  public void publish(MessageBatch batch) {
    String batchAsString;
    try {
      batchAsString = this.mapper.writeValueAsString(batch.messages);
    } catch (JsonProcessingException err) {
      throw ErrorUtils.just500("Failed to serialize object: " + err.toString());
    }

    // TODO: good example for threading
    this.rabbitTemplate.convertAndSend(
        App.topicExchangeName, "workflow.entities.mutations", batchAsString);
  }

  public class MessageBatch {
    protected List<String> messages;
    private ObjectMapper mapper;

    public MessageBatch(ObjectMapper mapper) {
      this.messages = new ArrayList<>();
      this.mapper = mapper;
    }

    public <T> void add_to_batch(T obj, MessageType msgType, AuthorizationDTO auth, UUID eventId) {
      Message message = new Message();
      message.obj = obj;
      message.objType = obj.getClass().getSimpleName();
      message.msgType = msgType;
      message.clientId = auth.clientId;
      message.userId = auth.userId;
      message.eventId = eventId;

      try {
        this.messages.add(this.mapper.writeValueAsString(message));
      } catch (JsonProcessingException err) {
        throw ErrorUtils.just500("Failed to serialize object: " + err.toString());
      }
    }
  }

  public class Message {
    public Object obj;
    public String objType;
    public MessageType msgType;
    public UUID clientId;
    public UUID userId;
    public UUID eventId;
  }

  public enum MessageType {
    UPDATE,
  }
}
