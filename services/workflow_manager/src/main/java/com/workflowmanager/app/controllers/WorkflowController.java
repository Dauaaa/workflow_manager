package com.workflowmanager.app.controllers;

import com.workflowmanager.app.App;
import com.workflowmanager.app.Publisher;
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
import java.util.Map;
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
public class WorkflowController {
  private final WorkflowRepository workflowRepository;
  private final WorkflowStateRepository workflowStateRepository;
  private final WorkflowAttributeDescriptionRepository attributeDescriptionRepository;
  private final WorkflowAttributeRepository workflowAttributeRepository;
  private final Publisher publisher;

  public WorkflowController(
      WorkflowRepository workflowRepository,
      WorkflowStateRepository workflowStateRepository,
      WorkflowAttributeDescriptionRepository attributeDescriptionRepository,
      WorkflowAttributeRepository workflowAttributeRepository,
      Publisher publisher) {
    this.workflowRepository = workflowRepository;
    this.workflowStateRepository = workflowStateRepository;
    this.attributeDescriptionRepository = attributeDescriptionRepository;
    this.workflowAttributeRepository = workflowAttributeRepository;
    this.publisher = publisher;
  }

  @GetMapping("workflows/{workflowId}")
  @ResponseBody
  public ResponseWorkflow getWorkflow(@RequestHeader Map<String, String> headers, @PathVariable("workflowId") Integer workflowId) {
    AuthorizationDTO auth = new AuthorizationDTO(headers);

    return new ResponseWorkflow(
        ErrorUtils.onEmpty404(
            this.workflowRepository.getByIdAndClientId(workflowId, auth.clientId), workflowId));
  }

  @GetMapping("workflows")
  @ResponseBody
  public List<ResponseWorkflow> list(@RequestHeader Map<String, String> headers) {
    AuthorizationDTO auth = new AuthorizationDTO(headers);

    return this.workflowRepository.list(auth.clientId).stream()
        .map(workflow -> new ResponseWorkflow(workflow))
        .collect(Collectors.toList());
  }

  @PostMapping("workflows")
  @ResponseBody
  public ResponseEntity<ResponseWorkflow> createWorkflow(@RequestHeader Map<String, String> headers, @RequestBody RequestNewWorkflow newWorkflow) {
    AuthorizationDTO auth = new AuthorizationDTO(headers);

    NewWorkflowDTO dto = new NewWorkflowDTO(newWorkflow, auth);
    Workflow workflow = new Workflow(dto);
    this.workflowRepository.save(workflow);

    ResponseWorkflow ret = this.getWorkflow(headers, workflow.getId());
    UUID eventId = UUID.randomUUID();

    Publisher.MessageBatch batch = this.publisher.batch();

    batch.add_to_batch(ret, Publisher.MessageType.UPDATE, auth, eventId);

    this.publisher.publish(batch);

    return ResponseEntity.ok().headers(App.mutationResponseHeaders(eventId)).body(ret);
  }

  @PutMapping("workflows/{workflowId}/config")
  @ResponseBody
  public ResponseEntity<ResponseWorkflow> setConfig(
      @RequestHeader Map<String, String> headers,
      @PathVariable("workflowId") Integer workflowId,
      @RequestBody RequestUpdateWorkflowConfig request) {
    AuthorizationDTO auth = new AuthorizationDTO(headers);

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

    ResponseWorkflow ret = this.getWorkflow(headers, workflow.getId());

    Publisher.MessageBatch batch = this.publisher.batch();

    UUID eventId = UUID.randomUUID();

    batch.add_to_batch(ret, Publisher.MessageType.UPDATE, auth, eventId);

    this.publisher.publish(batch);

    return ResponseEntity.ok().headers(App.mutationResponseHeaders(eventId)).body(ret);
  }

  @PostMapping("workflows/{workflowId}/attribute-descriptions")
  @ResponseBody
  public ResponseEntity<ResponseAttributeDescription> createAttributeDescription(
      @RequestHeader Map<String, String> headers,
      @PathVariable("workflowId") Integer workflowId,
      @RequestBody RequestNewAttributeDescription request) {
    AuthorizationDTO auth = new AuthorizationDTO(headers);

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

    ResponseAttributeDescription ret =
        new ResponseAttributeDescription(
            this.attributeDescriptionRepository
                .getByNameParentWorkflowId(attributeDescription.getName(), workflow.getId())
                .orElseThrow());

    Publisher.MessageBatch batch = this.publisher.batch();

    UUID eventId = UUID.randomUUID();

    batch.add_to_batch(ret, Publisher.MessageType.UPDATE, auth, eventId);

    this.publisher.publish(batch);

    return ResponseEntity.ok().headers(App.mutationResponseHeaders(eventId)).body(ret);
  }

  @GetMapping("workflows/{workflowId}/attribute-descriptions")
  @ResponseBody
  public List<ResponseAttributeDescription> listAttributeDescription(
      @RequestHeader Map<String, String> headers,
      @PathVariable("workflowId") Integer workflowId) {
    AuthorizationDTO auth = new AuthorizationDTO(headers);

    // authorize
    ErrorUtils.onEmpty404(
        this.workflowRepository.getByIdAndClientId(workflowId, auth.clientId), workflowId);

    return this.attributeDescriptionRepository.listByWorkflowId(workflowId).stream()
        .map(description -> new ResponseAttributeDescription(description))
        .collect(Collectors.toList());
  }

  @PutMapping("workflows/{workflowId}/attributes/{attributeName}")
  @ResponseBody
  public ResponseEntity<ResponseAttribute> setAttribute(
      @RequestHeader Map<String, String> headers,
      @PathVariable("workflowId") Integer workflowId,
      @PathVariable("attributeName") String attributeName,
      @RequestBody RequestNewAttribute request) {
    AuthorizationDTO auth = new AuthorizationDTO(headers);

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

    ResponseAttribute ret =
        new ResponseAttribute(
            this.workflowAttributeRepository
                .getByBaseEntityAndDescriptionName(
                    workflow.getId(),
                    attributeDescription.getName(),
                    WorkflowAttributeReferenceType.WORKFLOW)
                .orElseThrow());

    Publisher.MessageBatch batch = this.publisher.batch();

    UUID eventId = UUID.randomUUID();

    batch.add_to_batch(ret, Publisher.MessageType.UPDATE, auth, eventId);

    this.publisher.publish(batch);

    return ResponseEntity.ok().headers(App.mutationResponseHeaders(eventId)).body(ret);
  }

  @GetMapping("workflows/{workflowId}/attributes")
  @ResponseBody
  public List<ResponseAttribute> listAttributes(@RequestHeader Map<String, String> headers, @PathVariable("workflowId") Integer workflowId) {
    AuthorizationDTO auth = new AuthorizationDTO(headers);

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
