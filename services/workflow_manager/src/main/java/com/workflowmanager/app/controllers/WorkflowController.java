package com.workflowmanager.app.controllers;

import com.workflowmanager.app.core.AuthorizationDTO;
import com.workflowmanager.app.core.ErrorUtils;
import com.workflowmanager.app.domains.NewWorkflowDTO;
import com.workflowmanager.app.domains.Workflow;
import com.workflowmanager.app.domains.WorkflowState;
import com.workflowmanager.app.domains.workflow.WorkflowConfig;
import com.workflowmanager.app.domains.workflow.WorkflowConfigDTO;
import com.workflowmanager.app.repositories.WorkflowRepository;
import com.workflowmanager.app.repositories.WorkflowStateRepository;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class WorkflowController {
  private final WorkflowRepository workflowRepository;
  private final WorkflowStateRepository workflowStateRepository;

  public WorkflowController(
      WorkflowRepository workflowRepository, WorkflowStateRepository workflowStateRepository) {
    this.workflowRepository = workflowRepository;
    this.workflowStateRepository = workflowStateRepository;
  }

  @GetMapping("workflows/{workflowId}")
  @ResponseBody
  public Workflow getWorkflow(@PathVariable("workflowId") Integer workflowId) {
    return ErrorUtils.onEmpty404(
        this.workflowRepository.getByIdAndClientId(workflowId, 1), workflowId);
  }

  @PostMapping("workflows")
  @ResponseBody
  public Workflow createWorkflow(@RequestBody NewWorkflowDTO newWorkflow) {
    AuthorizationDTO auth = new AuthorizationDTO(1, 1);

    Workflow workflow = new Workflow(newWorkflow, auth);
    this.workflowRepository.save(workflow);

    return this.workflowRepository
        .getByIdAndClientId(workflow.getId(), workflow.getClientId())
        .orElseThrow();
  }

  @PutMapping("workflows/{workflowId}/config")
  @ResponseBody
  public Workflow setConfig(
      @PathVariable("workflowId") Integer workflowId, @RequestBody WorkflowConfigDTO config) {
    Workflow workflow = this.getWorkflow(workflowId);

    // resolve config handles (e.g. initialStateId -> initialState)
    WorkflowState initialState = null;
    if (config.initialStateId != null) {
      initialState =
          ErrorUtils.onEmpty404(
              this.workflowStateRepository.getByIdAndClientId(config.initialStateId, 1),
              config.initialStateId);
    }

    WorkflowConfig fullConfig = new WorkflowConfig(config, initialState);
    workflow.updateConfig(fullConfig);

    this.workflowRepository.save(workflow);

    return this.getWorkflow(workflow.getId());
  }
}
