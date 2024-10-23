package com.workflowmanager.app.controllers.dtos;

import com.workflowmanager.app.domains.WorkflowAttribute;
import com.workflowmanager.app.domains.WorkflowAttributeDescription;

public class WorkflowAttributeResponseDTO {
  public WorkflowAttribute attribute;
  public WorkflowAttributeDescription description;

  public WorkflowAttributeResponseDTO(
      WorkflowAttribute attribute, WorkflowAttributeDescription description) {
    this.attribute = attribute;
    this.description = description;
  }
}
