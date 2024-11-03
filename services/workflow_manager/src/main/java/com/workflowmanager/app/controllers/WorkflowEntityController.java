package com.workflowmanager.app.controllers;

import com.workflowmanager.app.controllers.requests.RequestNewAttribute;
import com.workflowmanager.app.controllers.requests.RequestNewWorkflowEntity;
import com.workflowmanager.app.controllers.responses.ResponseAttribute;
import com.workflowmanager.app.controllers.responses.ResponseWorkflowEntity;
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
import java.util.stream.Collectors;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseBody;

@CrossOrigin
@Controller
public class WorkflowEntityController {
  private final WorkflowEntityRepository workflowEntityRepository;
  private final WorkflowRepository workflowRepository;
  private final WorkflowStateRepository workflowStateRepository;
  private final WorkflowAttributeDescriptionRepository attributeDescriptionRepository;
  private final WorkflowAttributeRepository workflowAttributeRepository;

  public WorkflowEntityController(
      WorkflowEntityRepository workflowEntityRepository,
      WorkflowRepository workflowRepository,
      WorkflowStateRepository workflowStateRepository,
      WorkflowAttributeDescriptionRepository attributeDescriptionRepository,
      WorkflowAttributeRepository workflowAttributeRepository) {
    this.workflowEntityRepository = workflowEntityRepository;
    this.workflowRepository = workflowRepository;
    this.workflowStateRepository = workflowStateRepository;
    this.attributeDescriptionRepository = attributeDescriptionRepository;
    this.workflowAttributeRepository = workflowAttributeRepository;
  }

  @GetMapping("workflow-entities/{workflowEntityId}")
  @ResponseBody
  public ResponseWorkflowEntity getEntity(
      @PathVariable("workflowEntityId") Integer workflowEntityId) {
    AuthorizationDTO auth = new AuthorizationDTO(1, 1);

    return new ResponseWorkflowEntity(
        ErrorUtils.onEmpty404(
            this.workflowEntityRepository.getByIdAndClientId(workflowEntityId, auth.clientId)));
  }

  @Operation(description = "List all child entities of a workflow")
  @GetMapping("workflows/{workflowId}/workflow-entities")
  @ResponseBody
  public List<ResponseWorkflowEntity> listByWorkflowId(
      @PathVariable("workflowId") Integer workflowId) {
    AuthorizationDTO auth = new AuthorizationDTO(1, 1);

    return this.workflowEntityRepository.listByWorkflowAndClient(workflowId, auth.clientId).stream()
        .map(entity -> new ResponseWorkflowEntity(entity))
        .collect(Collectors.toList());
  }

  @GetMapping("workflow-states/{workflowStateId}/workflow-entities")
  @ResponseBody
  public List<ResponseWorkflowEntity> listEntityIdsByStateId(
      @PathVariable("workflowStateId") Integer workflowStateId) {
    AuthorizationDTO auth = new AuthorizationDTO(1, 1);

    return this.workflowEntityRepository
        .listByStateAndClient(workflowStateId, auth.clientId)
        .stream()
        .map(entity -> new ResponseWorkflowEntity(entity))
        .collect(Collectors.toList());
  }

  @Operation(description = "Create an entity for a workflow")
  @PostMapping("workflows/{workflowId}/workflow-entities")
  @ResponseBody
  public ResponseWorkflowEntity createEntity(
      @PathVariable("workflowId") Integer workflowId,
      @RequestBody RequestNewWorkflowEntity request) {
    AuthorizationDTO auth = new AuthorizationDTO(1, 1);

    Workflow workflow =
        ErrorUtils.onEmpty404(this.workflowRepository.getByIdAndClientId(workflowId, 1));

    NewWorkflowEntityDTO dto = new NewWorkflowEntityDTO(request, auth);

    WorkflowEntity workflowEntity = new WorkflowEntity(dto, workflow);
    this.workflowEntityRepository.save(workflowEntity);

    return this.getEntity(workflowEntity.getId());
  }

  @PutMapping("workflow-entities/{entityId}/attributes/{attributeName}")
  @ResponseBody
  public ResponseAttribute setAttribute(
      @PathVariable("entityId") Integer entityId,
      @PathVariable("attributeName") String attributeName,
      @RequestBody RequestNewAttribute request) {
    AuthorizationDTO auth = new AuthorizationDTO(1, 1);

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

    return new ResponseAttribute(
        this.workflowAttributeRepository
            .getByBaseEntityAndDescriptionName(
                entity.getId(),
                attributeDescription.getName(),
                WorkflowAttributeReferenceType.WORKFLOW_ENTITY)
            .orElseThrow());
  }

  @Operation(description = "Try moving an entity to a new state")
  @PatchMapping("workflow-entities/{entityId}/workflow-states/{newStateId}")
  @ResponseBody
  public void moveState(
      @PathVariable("entityId") Integer entityId, @PathVariable("newStateId") Integer newStateId) {
    AuthorizationDTO auth = new AuthorizationDTO(1, 1);

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
  }

  @GetMapping("workflow-entities/{entityId}/attributes")
  @ResponseBody
  public List<ResponseAttribute> listAttributes(@PathVariable("entityId") Integer entityId) {
    AuthorizationDTO auth = new AuthorizationDTO(1, 1);

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
