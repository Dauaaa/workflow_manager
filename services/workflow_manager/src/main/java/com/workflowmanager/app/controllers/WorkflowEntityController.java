package com.workflowmanager.app.controllers;

import com.workflowmanager.app.controllers.dtos.WorkflowAttributeResponseDTO;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

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

  @Operation(description = "Create an entity for a workflow")
  @GetMapping("workflow-entities/{workflowEntityId}")
  @ResponseBody
  public WorkflowEntity getWorkflow(@PathVariable("workflowEntityId") Integer workflowEntityId) {
    return ErrorUtils.onEmpty404(
        this.workflowEntityRepository.getByIdAndClientId(workflowEntityId, 1));
  }

  @Operation(description = "List all child entities of a workflow")
  @GetMapping("workflows/{workflowId}/workflow-entities")
  @ResponseBody
  public Page<WorkflowEntity> listByWorkflowId(
      @RequestParam(defaultValue = "1") int page,
      @RequestParam(defaultValue = "50") int pageSize,
      @PathVariable("workflowId") Integer workflowId) {
    return this.workflowEntityRepository.listByWorkflowIdAndClientId(
        workflowId, 1, PageRequest.of(page - 1, pageSize));
  }

  @Operation(description = "List all entities in a given state")
  @GetMapping("workflow-states/{workflowStateId}/workflow-entities")
  @ResponseBody
  public Page<WorkflowEntity> listByStateId(
      @RequestParam(defaultValue = "1") int page,
      @RequestParam(defaultValue = "50") int pageSize,
      @PathVariable("workflowStateId") Integer workflowStateId) {
    return this.workflowEntityRepository.listByStateIdAndClientId(
        workflowStateId, 1, PageRequest.of(page - 1, pageSize));
  }

  @PostMapping("workflows/{workflowId}/workflow-entities")
  @ResponseBody
  public WorkflowEntity createWorkflow(
      @PathVariable("workflowId") Integer workflowId,
      @RequestBody NewWorkflowEntityDTO newWorkflowEntity) {
    AuthorizationDTO auth = new AuthorizationDTO(1, 1);

    Workflow workflow =
        ErrorUtils.onEmpty404(this.workflowRepository.getByIdAndClientId(workflowId, 1));

    WorkflowEntity workflowEntity = new WorkflowEntity(newWorkflowEntity, auth, workflow);
    this.workflowEntityRepository.save(workflowEntity);

    return this.workflowEntityRepository
        .getByIdAndClientId(workflowEntity.getId(), workflowEntity.getClientId())
        .orElseThrow();
  }

  @PutMapping("workflows-entities/{entityId}/attributes/{attributeName}")
  @ResponseBody
  public WorkflowAttributeResponseDTO setAttribute(
      @PathVariable("entityId") Integer entityId,
      @PathVariable("attributeName") String attributeName,
      @RequestBody NewWorkflowAttributeDTO attributeDTO) {
    WorkflowEntity entity =
        ErrorUtils.onEmpty404(
            this.workflowEntityRepository.getByIdAndClientId(entityId, 1), entityId);
    Workflow workflow =
        ErrorUtils.onEmpty404(
            this.workflowRepository.getByIdAndClientId(entity.getWorkflowId(), 1),
            entity.getWorkflowId());
    WorkflowAttributeDescription attributeDescription =
        ErrorUtils.onEmpty404(
            this.attributeDescriptionRepository.getByNameParentWorkflowId(attributeName, entityId),
            attributeName);

    WorkflowAttribute attribute =
        new WorkflowAttribute(
            attributeDTO,
            attributeDescription,
            workflow,
            entityId,
            WorkflowAttributeReferenceType.WORKFLOW_ENTITY);

    this.workflowAttributeRepository.save(attribute);

    return new WorkflowAttributeResponseDTO(attribute, attributeDescription);
  }

  @Operation(description = "Try moving an entity to a new state")
  @PatchMapping("workflow-entities/{entityId}/workflow-states/{newStateId}")
  @ResponseBody
  public void moveState(
      @PathVariable("entityId") Integer entityId, @PathVariable("newStateId") Integer newStateId) {
    WorkflowEntity entity =
        ErrorUtils.onEmpty404(
            this.workflowEntityRepository.getByIdAndClientId(entityId, 1), entityId);
    WorkflowState nextState =
        ErrorUtils.onEmpty404(
            this.workflowStateRepository.getByIdAndClientId(newStateId, 1), newStateId);

    // TODO: execute rule stuff...
    // REMEBER WE NEED TO BIND THE WORKFLOW VARIABLES TOO!
    entity.setCurrentState(nextState);

    this.workflowEntityRepository.save(entity);
  }
}
