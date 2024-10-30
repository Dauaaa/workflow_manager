package com.workflowmanager.app.controllers.responses;

import com.workflowmanager.app.domains.WorkflowEntity;
import jakarta.validation.constraints.NotNull;
import org.springframework.web.server.ResponseStatusException;

public class ResponseWorkflowEntity extends ResponseBaseEntity {
  @NotNull public Integer workflowId;

  @NotNull public Integer currentStateId;

  public ResponseWorkflowEntity(WorkflowEntity entity) throws ResponseStatusException {
    super(entity);

    this.workflowId = entity.getWorkflowId();
    this.currentStateId = entity.getCurrentStateId();
  }
}
