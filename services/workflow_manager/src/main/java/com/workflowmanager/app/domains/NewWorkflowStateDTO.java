package com.workflowmanager.app.domains;

import com.workflowmanager.app.controllers.requests.RequestNewWorkflowState;
import com.workflowmanager.app.core.AuthorizationDTO;
import com.workflowmanager.app.core.NewBaseEntityDTO;

public class NewWorkflowStateDTO extends NewBaseEntityDTO {
  public NewWorkflowStateDTO(RequestNewWorkflowState request, AuthorizationDTO auth) {
    super(request, auth);
  }
}
