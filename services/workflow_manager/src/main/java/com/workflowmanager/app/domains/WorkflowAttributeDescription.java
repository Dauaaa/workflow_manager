package com.workflowmanager.app.domains;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.workflowmanager.app.domains.attribute.WorkflowAttributeExprRule;
import com.workflowmanager.app.domains.attribute.WorkflowAttributeRegexRule;
import io.hypersistence.utils.hibernate.type.json.JsonType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;
import org.hibernate.annotations.Immutable;
import org.hibernate.annotations.Type;

@Entity
@Table(name = "workflow_attribute_descriptions")
@IdClass(WorkflowAttributeDescriptionId.class)
public class WorkflowAttributeDescription {
  @Id
  @Schema(description = "Name of the attribute. Unique per workflow.")
  @NotNull
  @Pattern(
      regexp = "^[a-zA-Z_][a-zA-Z0-9_]*$",
      message = "Invalid characters, regex: ^[a-zA-Z_][a-zA-Z0-9_]*$")
  @Size(min = 1, max = 64)
  private String name;

  @Id
  @ManyToOne(optional = false)
  @JoinColumn(name = "parent_workflow_id2")
  @JsonBackReference
  private Workflow parentWorkflow;

  @Schema(
      description =
          "Workflow this attribute is part of, it's not related to the value it references")
  private Integer parentWorkflowId;

  @Immutable private WorkflowAttributeReferenceType refType;
  private WorkflowAttributeType attrType;

  @Type(JsonType.class)
  private WorkflowAttributeExprRule expression;

  @Type(JsonType.class)
  private WorkflowAttributeRegexRule regex;

  @Min(1)
  @Max(50)
  private Integer maxLength;

  private List<String> enumDescription;

  public WorkflowAttributeDescription() {}

  public WorkflowAttributeDescription(
      NewWorkflowAttributeDescriptionDTO dto, Workflow parentWorkflow) {
    this.name = dto.name;
    this.parentWorkflow = parentWorkflow;
    if (parentWorkflow != null) this.parentWorkflowId = parentWorkflow.getId();
    this.refType = dto.refType;
    this.attrType = dto.attrType;
    this.expression = dto.expression;
    this.regex = dto.regex;
    this.enumDescription = dto.enumDescription;
  }

  public Integer getParentWorkflowId() {
    return this.parentWorkflowId;
  }

  public Integer getMaxLength() {
    return this.maxLength;
  }

  public String getName() {
    return this.name;
  }

  public WorkflowAttributeReferenceType getRefType() {
    return this.refType;
  }

  public WorkflowAttributeType getAttrType() {
    return this.attrType;
  }

  public WorkflowAttributeExprRule getExpression() {
    return this.expression;
  }

  public void setExpression(WorkflowAttributeExprRule expression) {
    this.expression = expression;
  }

  public WorkflowAttributeRegexRule getRegex() {
    return this.regex;
  }

  public void setRegex(WorkflowAttributeRegexRule regex) {
    this.regex = regex;
  }

  public List<String> getEnumDescription() {
    return this.enumDescription;
  }

  public void setMaxLength(Integer maxLength) {
    this.maxLength = maxLength;
  }

  public void setEnumDescription(List<String> enumDescription) {
    this.enumDescription = enumDescription;
  }

  @PrePersist
  protected void persistParentWorkflowId() {
    this.parentWorkflowId = this.parentWorkflow.getId();
  }

  public enum WorkflowAttributeType {
    INTEGER,
    FLOATING,
    ENUMERATION,
    DECIMAL,
    CURRENCY,
    DATE,
    TIMESTAMP,
    FLAG,
    TEXT,
  }

  public enum WorkflowAttributeReferenceType {
    WORKFLOW,
    WORKFLOW_STATE,
    WORKFLOW_ENTITY,
  }
}
