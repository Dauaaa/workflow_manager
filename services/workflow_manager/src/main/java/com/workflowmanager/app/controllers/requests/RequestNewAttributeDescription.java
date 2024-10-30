package com.workflowmanager.app.controllers.requests;

import com.workflowmanager.app.domains.WorkflowAttributeDescription.WorkflowAttributeReferenceType;
import com.workflowmanager.app.domains.WorkflowAttributeDescription.WorkflowAttributeType;
import com.workflowmanager.app.domains.attribute.WorkflowAttributeExprRule;
import com.workflowmanager.app.domains.attribute.WorkflowAttributeRegexRule;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public class RequestNewAttributeDescription {
  @NotNull public String name;
  @NotNull public Integer parentWorkflowId;
  @NotNull public WorkflowAttributeReferenceType refType;
  @NotNull public WorkflowAttributeType attrType;

  public WorkflowAttributeExprRule expression;
  public WorkflowAttributeRegexRule regex;
  public Integer maxLength;
  public List<String> enumDescription;
}
