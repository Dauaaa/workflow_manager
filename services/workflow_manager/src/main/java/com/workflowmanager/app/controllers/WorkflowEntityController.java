package com.workflowmanager.app.controllers;

import com.workflowmanager.app.controllers.requests.RequestNewAttribute;
import com.workflowmanager.app.controllers.requests.RequestNewWorkflowEntity;
import com.workflowmanager.app.controllers.responses.ResponseAttribute;
import com.workflowmanager.app.controllers.responses.ResponseAttributeWithDescriptionList;
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
  public ResponseWorkflowEntity getWorkflow(
      @PathVariable("workflowEntityId") Integer workflowEntityId) {
    return new ResponseWorkflowEntity(
        ErrorUtils.onEmpty404(
            this.workflowEntityRepository.getByIdAndClientId(workflowEntityId, 1)));
  }

  @Operation(description = "List all child entities of a workflow")
  @GetMapping("workflows/{workflowId}/workflow-entities")
  @ResponseBody
  public Page<ResponseWorkflowEntity> listByWorkflowId(
      @RequestParam(defaultValue = "1") int page,
      @RequestParam(defaultValue = "50") int pageSize,
      @PathVariable("workflowId") Integer workflowId) {
    return this.workflowEntityRepository
        .listByWorkflowIdAndClientId(workflowId, 1, PageRequest.of(page - 1, pageSize))
        .map(entity -> new ResponseWorkflowEntity(entity));
  }

  @Operation(description = "List all entities in a given state")
  @GetMapping("workflow-states/{workflowStateId}/workflow-entities")
  @ResponseBody
  public Page<ResponseWorkflowEntity> listByStateId(
      @RequestParam(defaultValue = "1") int page,
      @RequestParam(defaultValue = "50") int pageSize,
      @PathVariable("workflowStateId") Integer workflowStateId) {
    return this.workflowEntityRepository
        .listByStateIdAndClientId(workflowStateId, 1, PageRequest.of(page - 1, pageSize))
        .map(entity -> new ResponseWorkflowEntity(entity));
  }

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

    return new ResponseWorkflowEntity(workflowEntity);
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
                attributeName, entityId, WorkflowAttributeReferenceType.WORKFLOW_ENTITY),
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

    return new ResponseAttribute(attribute);
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
    WorkflowState nextState =
        ErrorUtils.onEmpty404(
            this.workflowStateRepository.getByIdAndClientId(newStateId, auth.clientId), newStateId);

    // TODO: execute rule stuff...
    // REMEBER WE NEED TO BIND THE WORKFLOW VARIABLES TOO!
    entity.setCurrentState(nextState);

    this.workflowEntityRepository.save(entity);
  }

  @GetMapping("workflow-entities/{entityId}/attributes")
  @ResponseBody
  public ResponseAttributeWithDescriptionList listAttributes(
      @PathVariable("entityId") Integer entityId) {
    AuthorizationDTO auth = new AuthorizationDTO(1, 1);

    WorkflowEntity entity =
        ErrorUtils.onEmpty404(
            this.workflowEntityRepository.getByIdAndClientId(entityId, auth.clientId), entityId);

    // TODO: how to concurrent?
    List<WorkflowAttributeDescription> descriptions =
        this.attributeDescriptionRepository.list(
            entity.getWorkflowId(), WorkflowAttributeReferenceType.WORKFLOW_ENTITY);
    List<WorkflowAttribute> attributes =
        this.workflowAttributeRepository.list(
            entity.getId(), WorkflowAttributeReferenceType.WORKFLOW_ENTITY);

    return new ResponseAttributeWithDescriptionList(attributes, descriptions);
  }
}
