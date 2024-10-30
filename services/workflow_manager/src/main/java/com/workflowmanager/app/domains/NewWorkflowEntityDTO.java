package com.workflowmanager.app.domains;

import com.workflowmanager.app.controllers.requests.RequestNewWorkflowEntity;
import com.workflowmanager.app.core.AuthorizationDTO;
import com.workflowmanager.app.core.NewBaseEntityDTO;

public class NewWorkflowEntityDTO extends NewBaseEntityDTO {
  public NewWorkflowEntityDTO(RequestNewWorkflowEntity request, AuthorizationDTO auth) {
    super(request, auth);
  }
}
