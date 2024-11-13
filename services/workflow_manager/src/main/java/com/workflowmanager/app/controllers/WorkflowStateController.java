package com.workflowmanager.app.controllers;

import com.workflowmanager.app.App;
import com.workflowmanager.app.Publisher;
import com.workflowmanager.app.controllers.requests.RequestNewAttribute;
import com.workflowmanager.app.controllers.requests.RequestNewWorkflowState;
import com.workflowmanager.app.controllers.requests.RequestSetChangeStateRule;
import com.workflowmanager.app.controllers.responses.ResponseAttribute;
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
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.ResponseBody;

@CrossOrigin
@Controller
public class WorkflowStateController {
  private final WorkflowStateRepository workflowStateRepository;
  private final WorkflowRepository workflowRepository;
  private final ChangeStateRulesRepository changeStateRulesRepository;
  private final WorkflowAttributeDescriptionRepository attributeDescriptionRepository;
  private final WorkflowAttributeRepository workflowAttributeRepository;
  private final Publisher publisher;

  public WorkflowStateController(
      WorkflowStateRepository workflowStateRepository,
      WorkflowRepository workflowRepository,
      ChangeStateRulesRepository changeStateRulesRepository,
      WorkflowAttributeDescriptionRepository attributeDescriptionRepository,
      WorkflowAttributeRepository workflowAttributeRepository,
      Publisher publisher) {
    this.workflowStateRepository = workflowStateRepository;
    this.workflowRepository = workflowRepository;
    this.changeStateRulesRepository = changeStateRulesRepository;
    this.attributeDescriptionRepository = attributeDescriptionRepository;
    this.workflowAttributeRepository = workflowAttributeRepository;
    this.publisher = publisher;
  }

  @GetMapping("workflows/{workflowId}/workflow-states")
  @ResponseBody
  public List<ResponseWorkflowState> listStates(
      @RequestHeader Map<String, String> headers, @PathVariable("workflowId") Integer workflowId) {
    AuthorizationDTO auth = new AuthorizationDTO(headers);

    return this.workflowStateRepository
        .listByWorkflowIdAndClientId(workflowId, auth.clientId)
        .stream()
        .map(state -> new ResponseWorkflowState(state))
        .collect(Collectors.toList());
  }

  @GetMapping("workflow-states/{workflowStateId}")
  @ResponseBody
  public ResponseWorkflowState getState(
      @RequestHeader Map<String, String> headers,
      @PathVariable("workflowStateId") Integer workflowStateId) {
    AuthorizationDTO auth = new AuthorizationDTO(headers);

    return new ResponseWorkflowState(
        ErrorUtils.onEmpty404(
            this.workflowStateRepository.getByIdAndClientId(workflowStateId, auth.clientId)));
  }

  @PostMapping("workflows/{workflowId}/workflow-states")
  @ResponseBody
  public ResponseEntity<ResponseWorkflowState> createState(
      @RequestHeader Map<String, String> headers,
      @PathVariable("workflowId") Integer workflowId,
      @RequestBody RequestNewWorkflowState request) {
    AuthorizationDTO auth = new AuthorizationDTO(headers);

    Workflow workflow =
        ErrorUtils.onEmpty404(
            this.workflowRepository.getByIdAndClientId(workflowId, auth.clientId), workflowId);

    NewWorkflowStateDTO dto = new NewWorkflowStateDTO(request, auth);

    WorkflowState workflowState = new WorkflowState(dto, workflow);
    this.workflowStateRepository.save(workflowState);

    ResponseWorkflowState ret =
        new ResponseWorkflowState(
            this.workflowStateRepository
                .getByIdAndClientId(workflowState.getId(), auth.clientId)
                .orElseThrow());

    Publisher.MessageBatch batch = this.publisher.batch();

    UUID eventId = UUID.randomUUID();

    batch.add_to_batch(ret, Publisher.MessageType.UPDATE, auth, eventId);

    this.publisher.publish(batch);

    return ResponseEntity.ok().headers(App.mutationResponseHeaders(eventId)).body(ret);
  }

  @PostMapping("workflow-states/{workflowStateId}/rules")
  @ResponseBody
  public ResponseEntity<ResponseWorkflowState> createRule(
      @RequestHeader Map<String, String> headers,
      @PathVariable("workflowStateId") Integer workflowStateId,
      @RequestBody RequestSetChangeStateRule request) {
    AuthorizationDTO auth = new AuthorizationDTO(headers);

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

    Workflow workflow =
        ErrorUtils.onEmpty404(
            this.workflowRepository.getByIdAndClientId(from.getWorkflow().getId(), auth.clientId),
            from.getWorkflow().getId());

    List<WorkflowAttributeDescription> descriptions =
        this.attributeDescriptionRepository.listByWorkflowId(workflow.getId());

    NewChangeStateRulesDTO dto = new NewChangeStateRulesDTO(request, from.getId());

    Optional<ChangeStateRules> rulesOpt =
        this.changeStateRulesRepository.get(from.getId(), to.getId());
    rulesOpt.ifPresent(rules -> rules.update(dto));

    ChangeStateRules rules =
        rulesOpt.orElseGet(() -> new ChangeStateRules(from, descriptions, to, dto));

    this.changeStateRulesRepository.save(rules);

    ResponseWorkflowState ret =
        new ResponseWorkflowState(
            this.workflowStateRepository
                .getByIdAndClientId(from.getId(), auth.clientId)
                .orElseThrow());

    Publisher.MessageBatch batch = this.publisher.batch();

    UUID eventId = UUID.randomUUID();

    batch.add_to_batch(ret, Publisher.MessageType.UPDATE, auth, eventId);

    this.publisher.publish(batch);

    return ResponseEntity.ok().headers(App.mutationResponseHeaders(eventId)).body(ret);
  }

  @PutMapping("workflow-states/{stateId}/attributes/{attributeName}")
  @ResponseBody
  public ResponseEntity<ResponseAttribute> setAttribute(
      @RequestHeader Map<String, String> headers,
      @PathVariable("stateId") Integer stateId,
      @PathVariable("attributeName") String attributeName,
      @RequestBody RequestNewAttribute request) {
    AuthorizationDTO auth = new AuthorizationDTO(headers);

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
                attributeName, workflow.getId(), WorkflowAttributeReferenceType.WORKFLOW_STATE),
            attributeName);

    NewWorkflowAttributeDTO dto = new NewWorkflowAttributeDTO(request);

    Optional<WorkflowAttribute> attributeOpt =
        this.workflowAttributeRepository.getByBaseEntityAndDescriptionName(
            state.getId(),
            attributeDescription.getName(),
            WorkflowAttributeReferenceType.WORKFLOW_STATE);
    attributeOpt.ifPresent(attribute -> attribute.update(dto));

    WorkflowAttribute attribute =
        attributeOpt.orElseGet(
            () ->
                new WorkflowAttribute(
                    dto,
                    attributeDescription,
                    workflow,
                    stateId,
                    WorkflowAttributeReferenceType.WORKFLOW_STATE));

    this.workflowAttributeRepository.save(attribute);

    ResponseAttribute ret =
        new ResponseAttribute(
            this.workflowAttributeRepository
                .getByBaseEntityAndDescriptionName(
                    state.getId(),
                    attributeDescription.getName(),
                    WorkflowAttributeReferenceType.WORKFLOW_STATE)
                .orElseThrow());

    Publisher.MessageBatch batch = this.publisher.batch();

    UUID eventId = UUID.randomUUID();

    batch.add_to_batch(
        ret, attributeDescription.getRefType(), Publisher.MessageType.UPDATE, auth, eventId);

    this.publisher.publish(batch);

    return ResponseEntity.ok().headers(App.mutationResponseHeaders(eventId)).body(ret);
  }

  @GetMapping("workflow-states/{stateId}/attributes")
  @ResponseBody
  public List<ResponseAttribute> listAttributes(
      @RequestHeader Map<String, String> headers, @PathVariable("stateId") Integer stateId) {
    AuthorizationDTO auth = new AuthorizationDTO(headers);

    // authorize
    ErrorUtils.onEmpty404(
        this.workflowStateRepository.getByIdAndClientId(stateId, auth.clientId), stateId);

    return this.workflowAttributeRepository
        .list(stateId, WorkflowAttributeReferenceType.WORKFLOW_STATE)
        .stream()
        .map(attr -> new ResponseAttribute(attr))
        .collect(Collectors.toList());
  }
}
