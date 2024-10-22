package com.workflowmanager.app.domains.workflow;

import io.swagger.v3.oas.annotations.media.Schema;

public class WorkflowConfigDTO {
  @Schema(
      description =
          "The state must be owned by the Workflow (initialState.workflowId == workflow.id)")
  public Integer initialStateId;
}
