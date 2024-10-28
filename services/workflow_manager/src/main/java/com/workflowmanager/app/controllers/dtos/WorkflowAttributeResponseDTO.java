package com.workflowmanager.app.controllers.dtos;

import com.workflowmanager.app.domains.WorkflowAttribute;
import com.workflowmanager.app.domains.WorkflowAttributeDescription;
import jakarta.validation.constraints.NotNull;

public class WorkflowAttributeResponseDTO {
  public WorkflowAttribute attribute;
  @NotNull public WorkflowAttributeDescription description;

  public WorkflowAttributeResponseDTO(
      WorkflowAttribute attribute, WorkflowAttributeDescription description) {
    this.attribute = attribute;
    this.description = description;
  }
}
