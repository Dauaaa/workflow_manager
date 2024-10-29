package com.workflowmanager.app.controllers;

import com.workflowmanager.app.controllers.dtos.WorkflowAttributeResponseDTO;
import com.workflowmanager.app.controllers.dtos.WorkflowAttributeWithDescriptionListDTO;
import com.workflowmanager.app.controllers.dtos.WorkflowWithStatesDTO;
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
  public WorkflowWithStatesDTO listStates(@PathVariable("workflowId") Integer workflowId) {
    List<WorkflowState> states =
        this.workflowStateRepository.listByWorkflowIdAndClientId(workflowId, 1);

    Workflow workflow =
        ErrorUtils.onEmpty404(
            this.workflowRepository.getByIdAndClientId(workflowId, 1), workflowId);

    return new WorkflowWithStatesDTO(workflow, states);
  }

  @GetMapping("workflow-states/{workflowStateId}")
  @ResponseBody
  public WorkflowState getState(@PathVariable("workflowStateId") Integer workflowStateId) {
    return ErrorUtils.onEmpty404(
        this.workflowStateRepository.getByIdAndClientId(workflowStateId, 1));
  }

  @PostMapping("workflows/{workflowId}/workflow-states")
  @ResponseBody
  public WorkflowState createState(
      @PathVariable("workflowId") Integer workflowId,
      @RequestBody NewWorkflowStateDTO newWorkflowState) {
    AuthorizationDTO auth = new AuthorizationDTO(1, 1);
    Workflow workflow =
        ErrorUtils.onEmpty404(
            this.workflowRepository.getByIdAndClientId(workflowId, 1), workflowId);

    WorkflowState workflowState = new WorkflowState(newWorkflowState, auth, workflow);
    this.workflowStateRepository.save(workflowState);

    return this.workflowStateRepository
        .getByIdAndClientId(workflowState.getId(), workflowState.getClientId())
        .orElseThrow();
  }

  @PostMapping("workflow-states/rules")
  @ResponseBody
  public void createRule(@RequestBody NewChangeStateRulesDTO changeStateRuleDTO) {
    WorkflowState from =
        ErrorUtils.onEmpty404(
            this.workflowStateRepository.getByIdAndClientIdWithWorkflow(
                changeStateRuleDTO.fromId, 1),
            changeStateRuleDTO.fromId);
    WorkflowState to =
        ErrorUtils.onEmpty404(
            this.workflowStateRepository.getByIdAndClientIdWithWorkflow(changeStateRuleDTO.toId, 1),
            changeStateRuleDTO.toId);

    // just guarantee it exists
    ErrorUtils.onEmpty404(
        this.workflowRepository.getByIdAndClientId(from.getWorkflow().getId(), 1),
        from.getWorkflow().getId());

    ChangeStateRules rules = new ChangeStateRules(from, to, changeStateRuleDTO);

    this.changeStateRulesRepository.save(rules);
  }

  @PutMapping("workflow-states/{stateId}/attributes/{attributeName}")
  @ResponseBody
  public WorkflowAttributeResponseDTO setAttribute(
      @PathVariable("stateId") Integer stateId,
      @PathVariable("attributeName") String attributeName,
      @RequestBody NewWorkflowAttributeDTO attributeDTO) {
    WorkflowState state =
        ErrorUtils.onEmpty404(this.workflowStateRepository.getByIdAndClientId(stateId, 1), stateId);
    Workflow workflow =
        ErrorUtils.onEmpty404(
            this.workflowRepository.getByIdAndClientId(state.getWorkflowId(), 1),
            state.getWorkflowId());
    WorkflowAttributeDescription attributeDescription =
        ErrorUtils.onEmpty404(
            this.attributeDescriptionRepository.getByNameParentWorkflowIdAndRefType(
                attributeName, stateId, WorkflowAttributeReferenceType.WORKFLOW_STATE),
            attributeName);

    WorkflowAttribute attribute =
        new WorkflowAttribute(
            attributeDTO,
            attributeDescription,
            workflow,
            stateId,
            WorkflowAttributeReferenceType.WORKFLOW_STATE);

    this.workflowAttributeRepository.save(attribute);

    return new WorkflowAttributeResponseDTO(attribute, attributeDescription);
  }

  @GetMapping("workflow-states/{stateId}/attributes")
  @ResponseBody
  public WorkflowAttributeWithDescriptionListDTO listAttributes(
      @PathVariable("stateId") Integer stateId) {
    WorkflowState state =
        ErrorUtils.onEmpty404(this.workflowStateRepository.getByIdAndClientId(stateId, 1), stateId);

    // TODO: how to concurrent?
    List<WorkflowAttributeDescription> descriptions =
        this.attributeDescriptionRepository.list(
            state.getWorkflowId(), WorkflowAttributeReferenceType.WORKFLOW_STATE);
    List<WorkflowAttribute> attributes =
        this.workflowAttributeRepository.list(
            state.getId(), WorkflowAttributeReferenceType.WORKFLOW_STATE);

    return new WorkflowAttributeWithDescriptionListDTO(attributes, descriptions);
  }
}
