package com.workflowmanager.app.domains;

import com.workflowmanager.app.domains.WorkflowAttributeDescription.WorkflowAttributeReferenceType;
import com.workflowmanager.app.domains.WorkflowAttributeDescription.WorkflowAttributeType;
import com.workflowmanager.app.domains.attribute.WorkflowAttributeExprRule;
import com.workflowmanager.app.domains.attribute.WorkflowAttributeRegexRule;
import java.util.List;

public class NewWorkflowAttributeDescriptionDTO {
  public String name;
  public Integer parentWorkflowId;
  public WorkflowAttributeReferenceType refType;
  public WorkflowAttributeType attrType;
  public WorkflowAttributeExprRule expression;
  public WorkflowAttributeRegexRule regex;
  public List<String> enumDescription;

  public NewWorkflowAttributeDescriptionDTO() {}
}
