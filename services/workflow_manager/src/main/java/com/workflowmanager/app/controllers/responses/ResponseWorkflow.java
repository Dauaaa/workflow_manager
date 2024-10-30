package com.workflowmanager.app.controllers.responses;

import com.workflowmanager.app.domains.Workflow;
import org.springframework.web.server.ResponseStatusException;

public class ResponseWorkflow extends ResponseBaseEntity {
  public Integer initialStateId;

  public ResponseWorkflow(Workflow workflow) throws ResponseStatusException {
    super(workflow);

    this.initialStateId = workflow.getInitialStateId();
  }
}
