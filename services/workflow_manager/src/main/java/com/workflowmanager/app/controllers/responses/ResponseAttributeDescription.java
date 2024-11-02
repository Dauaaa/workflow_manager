package com.workflowmanager.app.controllers.responses;

import com.workflowmanager.app.core.ErrorUtils;
import com.workflowmanager.app.domains.WorkflowAttributeDescription;
import com.workflowmanager.app.domains.WorkflowAttributeDescription.WorkflowAttributeReferenceType;
import com.workflowmanager.app.domains.WorkflowAttributeDescription.WorkflowAttributeType;
import com.workflowmanager.app.domains.attribute.WorkflowAttributeExprRule;
import com.workflowmanager.app.domains.attribute.WorkflowAttributeRegexRule;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.List;

public class ResponseAttributeDescription {
  @NotNull public Integer parentWorkflowId;
  @NotNull public WorkflowAttributeReferenceType refType;
  @NotNull public WorkflowAttributeType attrType;
  @NotNull public String name;

  @NotNull public Instant creationTime;
  @NotNull public Instant updateTime;

  public WorkflowAttributeExprRule expression;
  public WorkflowAttributeRegexRule regex;
  public Integer maxLength;
  public List<String> enumDescription;

  public ResponseAttributeDescription(WorkflowAttributeDescription description) {
    ErrorUtils.serverAssertNeq(description, null);

    this.parentWorkflowId = description.getParentWorkflowId();
    this.refType = description.getRefType();
    this.attrType = description.getAttrType();
    this.name = description.getName();
    this.creationTime = description.getCreationTime();
    this.updateTime = description.getUpdateTime();
    this.expression = description.getExpression();
    this.regex = description.getRegex();
    this.maxLength = description.getMaxLength();
    this.enumDescription = description.getEnumDescription();
  }
}
