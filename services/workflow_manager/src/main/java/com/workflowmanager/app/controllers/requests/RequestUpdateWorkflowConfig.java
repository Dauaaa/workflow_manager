package com.workflowmanager.app.controllers.requests;

import io.swagger.v3.oas.annotations.media.Schema;

public class RequestUpdateWorkflowConfig {
  @Schema(
      description =
          "The state must be owned by the Workflow (initialState.workflowId == workflow.id)")
  public Integer initialStateId;
}
