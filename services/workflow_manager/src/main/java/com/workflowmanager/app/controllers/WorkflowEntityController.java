package com.workflowmanager.app.controllers;

import com.workflowmanager.app.core.AuthorizationDTO;
import com.workflowmanager.app.core.ErrorUtils;
import com.workflowmanager.app.domains.NewWorkflowEntityDTO;
import com.workflowmanager.app.domains.Workflow;
import com.workflowmanager.app.domains.WorkflowEntity;
import com.workflowmanager.app.repositories.WorkflowEntityRepository;
import com.workflowmanager.app.repositories.WorkflowRepository;
import com.workflowmanager.app.repositories.WorkflowStateRepository;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class WorkflowEntityController {
  private final WorkflowEntityRepository workflowEntityRepository;
  private final WorkflowRepository workflowRepository;
  private final WorkflowStateRepository workflowStateRepository;

  public WorkflowEntityController(
      WorkflowEntityRepository workflowEntityRepository,
      WorkflowRepository workflowRepository,
      WorkflowStateRepository workflowStateRepository) {
    this.workflowEntityRepository = workflowEntityRepository;
    this.workflowRepository = workflowRepository;
    this.workflowStateRepository = workflowStateRepository;
  }

  @Operation(description = "Create an entity for a workflow")
  @GetMapping("workflow-entities/{workflowEntityId}")
  @ResponseBody
  public WorkflowEntity getWorkflow(@PathVariable("workflowEntityId") Integer workflowEntityId) {
    return ErrorUtils.onEmpty404(
        this.workflowEntityRepository.getByIdAndClientId(workflowEntityId, 1));
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
}
