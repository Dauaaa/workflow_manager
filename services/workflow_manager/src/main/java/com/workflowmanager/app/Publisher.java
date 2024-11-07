package com.workflowmanager.app;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.workflowmanager.app.controllers.responses.ResponseAttribute;
import com.workflowmanager.app.controllers.responses.ResponseAttributeDescription;
import com.workflowmanager.app.controllers.responses.ResponseWorkflow;
import com.workflowmanager.app.controllers.responses.ResponseWorkflowEntity;
import com.workflowmanager.app.controllers.responses.ResponseWorkflowState;
import com.workflowmanager.app.core.AuthorizationDTO;
import com.workflowmanager.app.core.ErrorUtils;
import com.workflowmanager.app.domains.WorkflowAttributeDescription.WorkflowAttributeReferenceType;
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
    mapper.configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);
  }

  public void publish(MessageBatch batch) {
    // TODO: good example for threading
    for (String message : batch.messages)
      this.rabbitTemplate.convertAndSend(
          App.topicExchangeName, "workflow.entities.mutations", message);
  }

  public class MessageBatch {
    protected List<String> messages;
    private ObjectMapper mapper;

    public MessageBatch(ObjectMapper mapper) {
      this.messages = new ArrayList<>();
      this.mapper = mapper;
    }

    public void add_to_batch(
        ResponseWorkflow workflow, MessageType msgType, AuthorizationDTO auth, UUID eventId) {
      String messageKey =
          String.format(
              "%s;%s;%s:%s",
              auth.clientId,
              WorkflowAttributeReferenceType.WORKFLOW,
              WorkflowAttributeReferenceType.WORKFLOW,
              workflow.id);

      this.add_to_batch_inner(
          workflow,
          messageKey,
          msgType,
          WorkflowAttributeReferenceType.WORKFLOW,
          workflow.id,
          auth,
          eventId);
    }

    public void add_to_batch(
        ResponseWorkflowState state, MessageType msgType, AuthorizationDTO auth, UUID eventId) {
      String messageKey =
          String.format(
              "%s;%s:%s;%s:%s",
              auth.clientId,
              WorkflowAttributeReferenceType.WORKFLOW,
              state.workflowId,
              WorkflowAttributeReferenceType.WORKFLOW_STATE,
              state.id);

      this.add_to_batch_inner(
          state,
          messageKey,
          msgType,
          WorkflowAttributeReferenceType.WORKFLOW_STATE,
          state.id,
          auth,
          eventId);
    }

    public void add_to_batch(
        ResponseWorkflowEntity entity, MessageType msgType, AuthorizationDTO auth, UUID eventId) {
      String messageKey =
          String.format(
              "%s;%s:%s;%s:%s",
              auth.clientId,
              WorkflowAttributeReferenceType.WORKFLOW,
              entity.workflowId,
              WorkflowAttributeReferenceType.WORKFLOW_ENTITY,
              entity.id);

      this.add_to_batch_inner(
          entity,
          messageKey,
          msgType,
          WorkflowAttributeReferenceType.WORKFLOW_ENTITY,
          entity.id,
          auth,
          eventId);
    }

    public void add_to_batch(
        ResponseAttributeDescription description,
        MessageType msgType,
        AuthorizationDTO auth,
        UUID eventId) {
      String messageKey =
          String.format(
              "%s;%s:%s",
              auth.clientId, WorkflowAttributeReferenceType.WORKFLOW, description.parentWorkflowId);

      this.add_to_batch_inner(
          description,
          messageKey,
          msgType,
          WorkflowAttributeReferenceType.WORKFLOW,
          description.parentWorkflowId,
          auth,
          eventId);
    }

    public void add_to_batch(
        ResponseAttribute attr,
        WorkflowAttributeReferenceType refType,
        MessageType msgType,
        AuthorizationDTO auth,
        UUID eventId) {
      String messageKey = String.format("%s;%s:%s:attr", auth.clientId, refType, attr.baseEntityId);

      this.add_to_batch_inner(attr, messageKey, msgType, refType, attr.baseEntityId, auth, eventId);
    }

    private <T> void add_to_batch_inner(
        T obj,
        String messageKey,
        MessageType msgType,
        WorkflowAttributeReferenceType refType,
        Integer baseEntityId,
        AuthorizationDTO auth,
        UUID eventId) {
      Message message = new Message();
      message.obj = obj;
      message.objType = obj.getClass().getSimpleName();
      message.msgType = msgType;
      message.refType = refType;
      message.baseEntityId = baseEntityId;
      message.clientId = auth.clientId;
      message.userId = auth.userId;
      message.eventId = eventId;

      try {
        System.out.println(this.mapper.writeValueAsString(message));
        this.messages.add(
            String.format("%s %s", messageKey, this.mapper.writeValueAsString(message)));
      } catch (JsonProcessingException err) {
        throw ErrorUtils.just500("Failed to serialize object: " + err.toString());
      }
    }
  }

  public class Message {
    public Object obj;
    public String objType;
    public MessageType msgType;
    public WorkflowAttributeReferenceType refType;
    public Integer baseEntityId;
    public UUID clientId;
    public UUID userId;
    public UUID eventId;
  }

  public enum MessageType {
    UPDATE,
  }
}
