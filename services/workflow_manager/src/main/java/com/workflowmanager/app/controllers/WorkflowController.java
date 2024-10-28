package com.workflowmanager.app.controllers;

import com.workflowmanager.app.controllers.dtos.WorkflowAttributeResponseDTO;
import com.workflowmanager.app.controllers.dtos.WorkflowAttributeWithDescriptionListDTO;
import com.workflowmanager.app.core.AuthorizationDTO;
import com.workflowmanager.app.core.ErrorUtils;
import com.workflowmanager.app.domains.NewWorkflowAttributeDTO;
import com.workflowmanager.app.domains.NewWorkflowAttributeDescriptionDTO;
import com.workflowmanager.app.domains.NewWorkflowDTO;
import com.workflowmanager.app.domains.Workflow;
import com.workflowmanager.app.domains.WorkflowAttribute;
import com.workflowmanager.app.domains.WorkflowAttributeDescription;
import com.workflowmanager.app.domains.WorkflowAttributeDescription.WorkflowAttributeReferenceType;
import com.workflowmanager.app.domains.WorkflowState;
import com.workflowmanager.app.domains.workflow.WorkflowConfig;
import com.workflowmanager.app.domains.workflow.WorkflowConfigDTO;
import com.workflowmanager.app.repositories.WorkflowAttributeDescriptionRepository;
import com.workflowmanager.app.repositories.WorkflowAttributeRepository;
import com.workflowmanager.app.repositories.WorkflowRepository;
import com.workflowmanager.app.repositories.WorkflowStateRepository;
import java.util.List;
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
  private final WorkflowAttributeDescriptionRepository attributeDescriptionRepository;
  private final WorkflowAttributeRepository workflowAttributeRepository;

  public WorkflowController(
      WorkflowRepository workflowRepository,
      WorkflowStateRepository workflowStateRepository,
      WorkflowAttributeDescriptionRepository attributeDescriptionRepository,
      WorkflowAttributeRepository workflowAttributeRepository) {
    this.workflowRepository = workflowRepository;
    this.workflowStateRepository = workflowStateRepository;
    this.attributeDescriptionRepository = attributeDescriptionRepository;
    this.workflowAttributeRepository = workflowAttributeRepository;
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

  @PostMapping("workflows/{workflowId}/attributes")
  @ResponseBody
  public void createAttribute(
      @PathVariable("workflowId") Integer workflowId,
      @RequestBody NewWorkflowAttributeDescriptionDTO attributeDescriptionDTO) {
    Workflow workflow =
        ErrorUtils.onEmpty404(
            this.workflowRepository.getByIdAndClientId(workflowId, 1), workflowId);

    WorkflowAttributeDescription attributeDescription =
        new WorkflowAttributeDescription(attributeDescriptionDTO, workflow);

    this.attributeDescriptionRepository.save(attributeDescription);
  }

  @PutMapping("workflows/{workflowId}/attributes/{attributeName}")
  @ResponseBody
  public WorkflowAttributeResponseDTO setAttribute(
      @PathVariable("workflowId") Integer workflowId,
      @PathVariable("attributeName") String attributeName,
      @RequestBody NewWorkflowAttributeDTO attributeDTO) {
    Workflow workflow =
        ErrorUtils.onEmpty404(
            this.workflowRepository.getByIdAndClientId(workflowId, 1), workflowId);
    WorkflowAttributeDescription attributeDescription =
        ErrorUtils.onEmpty404(
            this.attributeDescriptionRepository.getByNameParentWorkflowId(
                attributeName, workflowId),
            attributeName);

    WorkflowAttribute attribute =
        new WorkflowAttribute(
            attributeDTO,
            attributeDescription,
            workflow,
            workflowId,
            WorkflowAttributeReferenceType.WORKFLOW);

    this.workflowAttributeRepository.save(attribute);

    return new WorkflowAttributeResponseDTO(attribute, attributeDescription);
  }

  @GetMapping("workflows/{workflowId}/attributes")
  @ResponseBody
  public WorkflowAttributeWithDescriptionListDTO listAttributes(
      @PathVariable("workflowId") Integer workflowId) {
    Workflow workflow =
        ErrorUtils.onEmpty404(
            this.workflowRepository.getByIdAndClientId(workflowId, 1), workflowId);

    // TODO: how to concurrent?
    List<WorkflowAttributeDescription> descriptions =
        this.attributeDescriptionRepository.list(
            workflow.getId(), WorkflowAttributeReferenceType.WORKFLOW);
    List<WorkflowAttribute> attributes =
        this.workflowAttributeRepository.list(
            workflow.getId(), WorkflowAttributeReferenceType.WORKFLOW);

    return new WorkflowAttributeWithDescriptionListDTO(attributes, descriptions);
  }
}
