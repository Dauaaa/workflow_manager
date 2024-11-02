package com.workflowmanager.app.controllers;

import com.workflowmanager.app.controllers.requests.RequestNewAttribute;
import com.workflowmanager.app.controllers.requests.RequestNewWorkflowState;
import com.workflowmanager.app.controllers.requests.RequestSetChangeStateRule;
import com.workflowmanager.app.controllers.responses.ResponseAttribute;
import com.workflowmanager.app.controllers.responses.ResponseAttributeWithDescriptionList;
import com.workflowmanager.app.controllers.responses.ResponseWorkflowState;
import com.workflowmanager.app.core.AuthorizationDTO;
import com.workflowmanager.app.core.ErrorUtils;
import com.workflowmanager.app.domains.NewWorkflowAttributeDTO;
import com.workflowmanager.app.domains.NewWorkflowStateDTO;
import com.workflowmanager.app.domains.Workflow;
import com.workflowmanager.app.domains.WorkflowAttribute;
import com.workflowmanager.app.domains.WorkflowAttributeDescription;
import com.workflowmanager.app.domains.WorkflowAttributeDescription.WorkflowAttributeReferenceType;
import com.workflowmanager.app.domains.WorkflowState;
import com.workflowmanager.app.domains.state.ChangeStateRules;
import com.workflowmanager.app.domains.state.NewChangeStateRulesDTO;
import com.workflowmanager.app.repositories.ChangeStateRulesRepository;
import com.workflowmanager.app.repositories.WorkflowAttributeDescriptionRepository;
import com.workflowmanager.app.repositories.WorkflowAttributeRepository;
import com.workflowmanager.app.repositories.WorkflowRepository;
import com.workflowmanager.app.repositories.WorkflowStateRepository;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class WorkflowStateController {
  private final WorkflowStateRepository workflowStateRepository;
  private final WorkflowRepository workflowRepository;
  private final ChangeStateRulesRepository changeStateRulesRepository;
  private final WorkflowAttributeDescriptionRepository attributeDescriptionRepository;
  private final WorkflowAttributeRepository workflowAttributeRepository;

  public WorkflowStateController(
      WorkflowStateRepository workflowStateRepository,
      WorkflowRepository workflowRepository,
      ChangeStateRulesRepository changeStateRulesRepository,
      WorkflowAttributeDescriptionRepository attributeDescriptionRepository,
      WorkflowAttributeRepository workflowAttributeRepository) {
    this.workflowStateRepository = workflowStateRepository;
    this.workflowRepository = workflowRepository;
    this.changeStateRulesRepository = changeStateRulesRepository;
    this.attributeDescriptionRepository = attributeDescriptionRepository;
    this.workflowAttributeRepository = workflowAttributeRepository;
  }

  @GetMapping("workflows/{workflowId}/workflow-states")
  @ResponseBody
  public List<ResponseWorkflowState> listStates(@PathVariable("workflowId") Integer workflowId) {
    AuthorizationDTO auth = new AuthorizationDTO(1, 1);

    return this.workflowStateRepository
        .listByWorkflowIdAndClientId(workflowId, auth.clientId)
        .stream()
        .map(state -> new ResponseWorkflowState(state))
        .collect(Collectors.toList());
  }

  @GetMapping("workflow-states/{workflowStateId}")
  @ResponseBody
  public ResponseWorkflowState getState(@PathVariable("workflowStateId") Integer workflowStateId) {
    AuthorizationDTO auth = new AuthorizationDTO(1, 1);

    return new ResponseWorkflowState(
        ErrorUtils.onEmpty404(
            this.workflowStateRepository.getByIdAndClientId(workflowStateId, auth.clientId)));
  }

  @PostMapping("workflows/{workflowId}/workflow-states")
  @ResponseBody
  public ResponseWorkflowState createState(
      @PathVariable("workflowId") Integer workflowId,
      @RequestBody RequestNewWorkflowState request) {
    AuthorizationDTO auth = new AuthorizationDTO(1, 1);

    Workflow workflow =
        ErrorUtils.onEmpty404(
            this.workflowRepository.getByIdAndClientId(workflowId, auth.clientId), workflowId);

    NewWorkflowStateDTO dto = new NewWorkflowStateDTO(request, auth);

    WorkflowState workflowState = new WorkflowState(dto, workflow);
    this.workflowStateRepository.save(workflowState);

    return new ResponseWorkflowState(workflowState);
  }

  @PostMapping("workflow-states/{workflowStateId}/rules")
  @ResponseBody
  public void createRule(
      @PathVariable("workflowStateId") Integer workflowStateId,
      @RequestBody RequestSetChangeStateRule request) {
    AuthorizationDTO auth = new AuthorizationDTO(1, 1);

    WorkflowState from =
        ErrorUtils.onEmpty404(
            this.workflowStateRepository.getByIdAndClientIdWithWorkflow(
                workflowStateId, auth.clientId),
            workflowStateId);
    WorkflowState to =
        ErrorUtils.onEmpty404(
            this.workflowStateRepository.getByIdAndClientIdWithWorkflow(
                request.toId, auth.clientId),
            request.toId);

    // just guarantee it exists
    ErrorUtils.onEmpty404(
        this.workflowRepository.getByIdAndClientId(from.getWorkflow().getId(), auth.clientId),
        from.getWorkflow().getId());

    NewChangeStateRulesDTO dto = new NewChangeStateRulesDTO(request, from.getId());

    ChangeStateRules rules = new ChangeStateRules(from, to, dto);

    this.changeStateRulesRepository.save(rules);
  }

  @PutMapping("workflow-states/{stateId}/attributes/{attributeName}")
  @ResponseBody
  public ResponseAttribute setAttribute(
      @PathVariable("stateId") Integer stateId,
      @PathVariable("attributeName") String attributeName,
      @RequestBody RequestNewAttribute request) {
    AuthorizationDTO auth = new AuthorizationDTO(1, 1);

    WorkflowState state =
        ErrorUtils.onEmpty404(
            this.workflowStateRepository.getByIdAndClientId(stateId, auth.clientId), stateId);
    Workflow workflow =
        ErrorUtils.onEmpty404(
            this.workflowRepository.getByIdAndClientId(state.getWorkflowId(), auth.clientId),
            state.getWorkflowId());
    WorkflowAttributeDescription attributeDescription =
        ErrorUtils.onEmpty404(
            this.attributeDescriptionRepository.getByNameParentWorkflowIdAndRefType(
                attributeName, stateId, WorkflowAttributeReferenceType.WORKFLOW_STATE),
            attributeName);

    NewWorkflowAttributeDTO dto = new NewWorkflowAttributeDTO(request);

    WorkflowAttribute attribute =
        new WorkflowAttribute(
            dto,
            attributeDescription,
            workflow,
            stateId,
            WorkflowAttributeReferenceType.WORKFLOW_STATE);

    this.workflowAttributeRepository.save(attribute);

    return new ResponseAttribute(attribute);
  }

  @GetMapping("workflow-states/{stateId}/attributes")
  @ResponseBody
  public ResponseAttributeWithDescriptionList listAttributes(
      @PathVariable("stateId") Integer stateId) {
    AuthorizationDTO auth = new AuthorizationDTO(1, 1);

    WorkflowState state =
        ErrorUtils.onEmpty404(
            this.workflowStateRepository.getByIdAndClientId(stateId, auth.clientId), stateId);

    // TODO: how to concurrent?
    List<WorkflowAttributeDescription> descriptions =
        this.attributeDescriptionRepository.list(
            state.getWorkflowId(), WorkflowAttributeReferenceType.WORKFLOW_STATE);
    List<WorkflowAttribute> attributes =
        this.workflowAttributeRepository.list(
            state.getId(), WorkflowAttributeReferenceType.WORKFLOW_STATE);

    return new ResponseAttributeWithDescriptionList(attributes, descriptions);
  }
}
