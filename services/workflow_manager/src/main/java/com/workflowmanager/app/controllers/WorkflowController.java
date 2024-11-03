package com.workflowmanager.app.controllers;

import com.workflowmanager.app.controllers.requests.RequestNewAttribute;
import com.workflowmanager.app.controllers.requests.RequestNewAttributeDescription;
import com.workflowmanager.app.controllers.requests.RequestNewWorkflow;
import com.workflowmanager.app.controllers.requests.RequestUpdateWorkflowConfig;
import com.workflowmanager.app.controllers.responses.ResponseAttribute;
import com.workflowmanager.app.controllers.responses.ResponseAttributeDescription;
import com.workflowmanager.app.controllers.responses.ResponseWorkflow;
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
import java.util.stream.Collectors;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseBody;

@CrossOrigin
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
  public ResponseWorkflow getWorkflow(@PathVariable("workflowId") Integer workflowId) {
    AuthorizationDTO auth = new AuthorizationDTO(1, 1);

    return new ResponseWorkflow(
        ErrorUtils.onEmpty404(
            this.workflowRepository.getByIdAndClientId(workflowId, auth.clientId), workflowId));
  }

  @GetMapping("workflows")
  @ResponseBody
  public List<ResponseWorkflow> list() {
    AuthorizationDTO auth = new AuthorizationDTO(1, 1);

    return this.workflowRepository.list(auth.clientId).stream()
        .map(workflow -> new ResponseWorkflow(workflow))
        .collect(Collectors.toList());
  }

  @PostMapping("workflows")
  @ResponseBody
  public ResponseWorkflow createWorkflow(@RequestBody RequestNewWorkflow newWorkflow) {
    AuthorizationDTO auth = new AuthorizationDTO(1, 1);

    NewWorkflowDTO dto = new NewWorkflowDTO(newWorkflow, auth);
    Workflow workflow = new Workflow(dto);
    this.workflowRepository.save(workflow);

    return new ResponseWorkflow(
        this.workflowRepository.getByIdAndClientId(workflow.getId(), auth.clientId).orElseThrow());
  }

  @PutMapping("workflows/{workflowId}/config")
  @ResponseBody
  public ResponseWorkflow setConfig(
      @PathVariable("workflowId") Integer workflowId,
      @RequestBody RequestUpdateWorkflowConfig request) {
    AuthorizationDTO auth = new AuthorizationDTO(1, 1);

    Workflow workflow =
        ErrorUtils.onEmpty404(
            this.workflowRepository.getByIdAndClientId(workflowId, auth.clientId));

    // resolve config handles (e.g. initialStateId -> initialState)
    WorkflowState initialState = null;
    if (request.initialStateId != null) {
      initialState =
          ErrorUtils.onEmpty404(
              this.workflowStateRepository.getByIdAndClientId(
                  request.initialStateId, auth.clientId),
              request.initialStateId);
    }

    WorkflowConfigDTO dto = new WorkflowConfigDTO(request);

    WorkflowConfig fullConfig = new WorkflowConfig(dto, initialState);
    workflow.updateConfig(fullConfig);

    this.workflowRepository.save(workflow);

    return new ResponseWorkflow(workflow);
  }

  @PostMapping("workflows/{workflowId}/attribute-descriptions")
  @ResponseBody
  public ResponseAttributeDescription createAttributeDescription(
      @PathVariable("workflowId") Integer workflowId,
      @RequestBody RequestNewAttributeDescription request) {
    AuthorizationDTO auth = new AuthorizationDTO(1, 1);

    Workflow workflow =
        ErrorUtils.onEmpty404(
            this.workflowRepository.getByIdAndClientId(workflowId, auth.clientId), workflowId);

    ErrorUtils.conflictIfExists(
        this.attributeDescriptionRepository.getByNameParentWorkflowId(
            request.name, workflow.getId()));

    NewWorkflowAttributeDescriptionDTO dto =
        new NewWorkflowAttributeDescriptionDTO(request, workflow);

    WorkflowAttributeDescription attributeDescription =
        new WorkflowAttributeDescription(dto, workflow);

    this.attributeDescriptionRepository.save(attributeDescription);

    return new ResponseAttributeDescription(
        this.attributeDescriptionRepository
            .getByNameParentWorkflowId(attributeDescription.getName(), workflow.getId())
            .orElseThrow());
  }

  @GetMapping("workflows/{workflowId}/attribute-descriptions")
  @ResponseBody
  public List<ResponseAttributeDescription> listAttributeDescription(
      @PathVariable("workflowId") Integer workflowId) {
    AuthorizationDTO auth = new AuthorizationDTO(1, 1);

    // authorize
    ErrorUtils.onEmpty404(
        this.workflowRepository.getByIdAndClientId(workflowId, auth.clientId), workflowId);

    return this.attributeDescriptionRepository.listByWorkflowId(workflowId).stream()
        .map(description -> new ResponseAttributeDescription(description))
        .collect(Collectors.toList());
  }

  @PutMapping("workflows/{workflowId}/attributes/{attributeName}")
  @ResponseBody
  public ResponseAttribute setAttribute(
      @PathVariable("workflowId") Integer workflowId,
      @PathVariable("attributeName") String attributeName,
      @RequestBody RequestNewAttribute request) {
    AuthorizationDTO auth = new AuthorizationDTO(1, 1);

    Workflow workflow =
        ErrorUtils.onEmpty404(
            this.workflowRepository.getByIdAndClientId(workflowId, auth.clientId), workflowId);
    WorkflowAttributeDescription attributeDescription =
        ErrorUtils.onEmpty404(
            this.attributeDescriptionRepository.getByNameParentWorkflowIdAndRefType(
                attributeName, workflowId, WorkflowAttributeReferenceType.WORKFLOW),
            attributeName);

    NewWorkflowAttributeDTO dto = new NewWorkflowAttributeDTO(request);

    WorkflowAttribute attribute =
        new WorkflowAttribute(
            dto,
            attributeDescription,
            workflow,
            workflowId,
            WorkflowAttributeReferenceType.WORKFLOW);

    this.workflowAttributeRepository.save(attribute);

    return new ResponseAttribute(
        this.workflowAttributeRepository
            .getByBaseEntityAndDescriptionName(
                workflow.getId(),
                attributeDescription.getName(),
                WorkflowAttributeReferenceType.WORKFLOW)
            .orElseThrow());
  }

  @GetMapping("workflows/{workflowId}/attributes")
  @ResponseBody
  public List<ResponseAttribute> listAttributes(@PathVariable("workflowId") Integer workflowId) {
    AuthorizationDTO auth = new AuthorizationDTO(1, 1);

    // authorize
    Workflow workflow =
        ErrorUtils.onEmpty404(
            this.workflowRepository.getByIdAndClientId(workflowId, auth.clientId), workflowId);

    return this.workflowAttributeRepository
        .list(workflow.getId(), WorkflowAttributeReferenceType.WORKFLOW)
        .stream()
        .map(attr -> new ResponseAttribute(attr))
        .collect(Collectors.toList());
  }
}
