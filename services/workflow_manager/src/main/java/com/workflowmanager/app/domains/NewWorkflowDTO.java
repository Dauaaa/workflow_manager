package com.workflowmanager.app.domains;

import com.workflowmanager.app.controllers.requests.RequestNewWorkflow;
import com.workflowmanager.app.core.AuthorizationDTO;
import com.workflowmanager.app.core.NewBaseEntityDTO;

public class NewWorkflowDTO extends NewBaseEntityDTO {
  public NewWorkflowDTO(RequestNewWorkflow request, AuthorizationDTO auth) {
    super(request, auth);
  }
}
