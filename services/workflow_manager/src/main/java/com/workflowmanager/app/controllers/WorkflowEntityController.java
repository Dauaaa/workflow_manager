package com.workflowmanager.app.controllers;

import com.workflowmanager.app.App;
import com.workflowmanager.app.Publisher;
import com.workflowmanager.app.controllers.requests.RequestNewAttribute;
import com.workflowmanager.app.controllers.requests.RequestNewWorkflowEntity;
import com.workflowmanager.app.controllers.responses.ResponseAttribute;
import com.workflowmanager.app.controllers.responses.ResponseEntityChangeState;
import com.workflowmanager.app.controllers.responses.ResponseWorkflowEntity;
import com.workflowmanager.app.controllers.responses.ResponseWorkflowState;
import com.workflowmanager.app.core.AuthorizationDTO;
import com.workflowmanager.app.core.ErrorUtils;
import com.workflowmanager.app.domains.NewWorkflowAttributeDTO;
import com.workflowmanager.app.domains.NewWorkflowEntityDTO;
import com.workflowmanager.app.domains.Workflow;
import com.workflowmanager.app.domains.WorkflowAttribute;
import com.workflowmanager.app.domains.WorkflowAttributeDescription;
import com.workflowmanager.app.domains.WorkflowAttributeDescription.WorkflowAttributeReferenceType;
import com.workflowmanager.app.domains.WorkflowEntity;
import com.workflowmanager.app.domains.WorkflowState;
import com.workflowmanager.app.repositories.WorkflowAttributeDescriptionRepository;
import com.workflowmanager.app.repositories.WorkflowAttributeRepository;
import com.workflowmanager.app.repositories.WorkflowEntityRepository;
import com.workflowmanager.app.repositories.WorkflowRepository;
import com.workflowmanager.app.repositories.WorkflowStateRepository;
import io.swagger.v3.oas.annotations.Operation;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.ResponseBody;

@CrossOrigin
@Controller
public class WorkflowEntityController {
  private final WorkflowEntityRepository workflowEntityRepository;
  private final WorkflowRepository workflowRepository;
  private final WorkflowStateRepository workflowStateRepository;
  private final WorkflowAttributeDescriptionRepository attributeDescriptionRepository;
  private final WorkflowAttributeRepository workflowAttributeRepository;
  private final Publisher publisher;

  public WorkflowEntityController(
      WorkflowEntityRepository workflowEntityRepository,
      WorkflowRepository workflowRepository,
      WorkflowStateRepository workflowStateRepository,
      WorkflowAttributeDescriptionRepository attributeDescriptionRepository,
      WorkflowAttributeRepository workflowAttributeRepository,
      Publisher publisher) {
    this.workflowEntityRepository = workflowEntityRepository;
    this.workflowRepository = workflowRepository;
    this.workflowStateRepository = workflowStateRepository;
    this.attributeDescriptionRepository = attributeDescriptionRepository;
    this.workflowAttributeRepository = workflowAttributeRepository;
    this.publisher = publisher;
  }

  @GetMapping("workflow-entities/{workflowEntityId}")
  @ResponseBody
  public ResponseWorkflowEntity getEntity(
      @RequestHeader Map<String, String> headers,
      @PathVariable("workflowEntityId") Integer workflowEntityId) {
    AuthorizationDTO auth = new AuthorizationDTO(headers);

    return new ResponseWorkflowEntity(
        ErrorUtils.onEmpty404(
            this.workflowEntityRepository.getByIdAndClientId(workflowEntityId, auth.clientId)));
  }

  @Operation(description = "List all child entities of a workflow")
  @GetMapping("workflows/{workflowId}/workflow-entities")
  @ResponseBody
  public List<ResponseWorkflowEntity> listByWorkflowId(
      @RequestHeader Map<String, String> headers,
      @PathVariable("workflowId") Integer workflowId) {
    AuthorizationDTO auth = new AuthorizationDTO(headers);

    return this.workflowEntityRepository.listByWorkflowAndClient(workflowId, auth.clientId).stream()
        .map(entity -> new ResponseWorkflowEntity(entity))
        .collect(Collectors.toList());
  }

  @GetMapping("workflow-states/{workflowStateId}/workflow-entities")
  @ResponseBody
  public List<ResponseWorkflowEntity> listEntityIdsByStateId(
      @RequestHeader Map<String, String> headers,
      @PathVariable("workflowStateId") Integer workflowStateId) {
    AuthorizationDTO auth = new AuthorizationDTO(headers);

    return this.workflowEntityRepository
        .listByStateAndClient(workflowStateId, auth.clientId)
        .stream()
        .map(entity -> new ResponseWorkflowEntity(entity))
        .collect(Collectors.toList());
  }

  @Operation(description = "Create an entity for a workflow")
  @PostMapping("workflows/{workflowId}/workflow-entities")
  @ResponseBody
  public ResponseEntity<ResponseWorkflowEntity> createEntity(
      @RequestHeader Map<String, String> headers,
      @PathVariable("workflowId") Integer workflowId,
      @RequestBody RequestNewWorkflowEntity request) {
    AuthorizationDTO auth = new AuthorizationDTO(headers);

    Workflow workflow =
        ErrorUtils.onEmpty404(this.workflowRepository.getByIdAndClientId(workflowId, auth.clientId));

    NewWorkflowEntityDTO dto = new NewWorkflowEntityDTO(request, auth);

    WorkflowEntity workflowEntity = new WorkflowEntity(dto, workflow);
    this.workflowEntityRepository.save(workflowEntity);

    ResponseWorkflowEntity ret = this.getEntity(headers, workflowEntity.getId());

    Publisher.MessageBatch batch = this.publisher.batch();

    UUID eventId = UUID.randomUUID();

    batch.add_to_batch(ret, Publisher.MessageType.UPDATE, auth, eventId);

    this.publisher.publish(batch);

    return ResponseEntity.ok().headers(App.mutationResponseHeaders(eventId)).body(ret);
  }

  @PutMapping("workflow-entities/{entityId}/attributes/{attributeName}")
  @ResponseBody
  public ResponseEntity<ResponseAttribute> setAttribute(
      @RequestHeader Map<String, String> headers,
      @PathVariable("entityId") Integer entityId,
      @PathVariable("attributeName") String attributeName,
      @RequestBody RequestNewAttribute request) {
    AuthorizationDTO auth = new AuthorizationDTO(headers);

    WorkflowEntity entity =
        ErrorUtils.onEmpty404(
            this.workflowEntityRepository.getByIdAndClientId(entityId, auth.clientId), entityId);
    Workflow workflow =
        ErrorUtils.onEmpty404(
            this.workflowRepository.getByIdAndClientId(entity.getWorkflowId(), auth.clientId),
            entity.getWorkflowId());
    WorkflowAttributeDescription attributeDescription =
        ErrorUtils.onEmpty404(
            this.attributeDescriptionRepository.getByNameParentWorkflowIdAndRefType(
                attributeName, workflow.getId(), WorkflowAttributeReferenceType.WORKFLOW_ENTITY),
            attributeName);

    NewWorkflowAttributeDTO dto = new NewWorkflowAttributeDTO(request);

    WorkflowAttribute attribute =
        new WorkflowAttribute(
            dto,
            attributeDescription,
            workflow,
            entityId,
            WorkflowAttributeReferenceType.WORKFLOW_ENTITY);

    this.workflowAttributeRepository.save(attribute);

    ResponseAttribute ret =
        new ResponseAttribute(
            this.workflowAttributeRepository
                .getByBaseEntityAndDescriptionName(
                    entity.getId(),
                    attributeDescription.getName(),
                    WorkflowAttributeReferenceType.WORKFLOW_ENTITY)
                .orElseThrow());

    Publisher.MessageBatch batch = this.publisher.batch();

    UUID eventId = UUID.randomUUID();

    batch.add_to_batch(ret, Publisher.MessageType.UPDATE, auth, eventId);

    this.publisher.publish(batch);

    return ResponseEntity.ok().headers(App.mutationResponseHeaders(eventId)).body(ret);
  }

  @Operation(description = "Try moving an entity to a new state")
  @PatchMapping("workflow-entities/{entityId}/workflow-states/{newStateId}")
  @ResponseBody
  public ResponseEntity<ResponseEntityChangeState> moveState(
      @RequestHeader Map<String, String> headers,
      @PathVariable("entityId") Integer entityId, @PathVariable("newStateId") Integer newStateId) {
    AuthorizationDTO auth = new AuthorizationDTO(headers);

    WorkflowEntity entity =
        ErrorUtils.onEmpty404(
            this.workflowEntityRepository.getByIdAndClientId(entityId, auth.clientId), entityId);
    WorkflowState curState =
        ErrorUtils.onEmpty404(
            this.workflowStateRepository.getByIdAndClientId(
                entity.getCurrentStateId(), auth.clientId),
            entity.getCurrentStateId());
    WorkflowState nextState =
        ErrorUtils.onEmpty404(
            this.workflowStateRepository.getByIdAndClientId(newStateId, auth.clientId), newStateId);

    WorkflowState.moveEntity(curState, nextState, entity);

    this.workflowStateRepository.save(curState);
    this.workflowStateRepository.save(nextState);
    this.workflowEntityRepository.save(entity);

    ResponseWorkflowEntity retEntity = this.getEntity(headers, entity.getId());
    ResponseWorkflowState from =
        new ResponseWorkflowState(
            this.workflowStateRepository
                .getByIdAndClientId(curState.getId(), auth.clientId)
                .orElseThrow());
    ResponseWorkflowState to =
        new ResponseWorkflowState(
            this.workflowStateRepository
                .getByIdAndClientId(nextState.getId(), auth.clientId)
                .orElseThrow());

    Publisher.MessageBatch batch = this.publisher.batch();

    UUID eventId = UUID.randomUUID();

    batch.add_to_batch(retEntity, Publisher.MessageType.UPDATE, auth, eventId);
    batch.add_to_batch(from, Publisher.MessageType.UPDATE, auth, eventId);
    batch.add_to_batch(to, Publisher.MessageType.UPDATE, auth, eventId);

    this.publisher.publish(batch);

    ResponseEntityChangeState ret = new ResponseEntityChangeState();
    ret.entity = retEntity;
    ret.from = from;
    ret.to = to;

    return ResponseEntity.ok().headers(App.mutationResponseHeaders(eventId)).body(ret);
  }

  @GetMapping("workflow-entities/{entityId}/attributes")
  @ResponseBody
  public List<ResponseAttribute> listAttributes(@RequestHeader Map<String, String> headers, @PathVariable("entityId") Integer entityId) {
    AuthorizationDTO auth = new AuthorizationDTO(headers);

    // authorize
    ErrorUtils.onEmpty404(
        this.workflowEntityRepository.getByIdAndClientId(entityId, auth.clientId), entityId);

    return this.workflowAttributeRepository
        .list(entityId, WorkflowAttributeReferenceType.WORKFLOW_ENTITY)
        .stream()
        .map(attr -> new ResponseAttribute(attr))
        .collect(Collectors.toList());
  }
}
