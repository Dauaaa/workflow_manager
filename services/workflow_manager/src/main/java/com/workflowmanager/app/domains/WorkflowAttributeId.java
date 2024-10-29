package com.workflowmanager.app.domains;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.workflowmanager.app.domains.WorkflowAttributeDescription.WorkflowAttributeReferenceType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.Embeddable;
import jakarta.persistence.Enumerated;
import jakarta.persistence.ManyToOne;
import jakarta.validation.constraints.NotNull;
import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class WorkflowAttributeId implements Serializable {
  @Schema(description = "Description of the attribute")
  @ManyToOne(optional = false)
  private WorkflowAttributeDescription description;

  @Schema(description = "If this is not null, it tells that the attribute references this workflow")
  @JsonBackReference
  @ManyToOne(optional = false)
  private Workflow parentWorkflow;

  @Schema(description = "The id of the entity referenced. baseEntityId + refType finds the entity")
  @NotNull
  private Integer baseEntityId;

  @Schema(
      description =
          "The type of entity of the entity referenced. baseEntityId + refType finds the entity")
  @Enumerated
  private WorkflowAttributeReferenceType refType;

  public WorkflowAttributeId(
      WorkflowAttributeDescription description,
      Workflow parentWorkflow,
      Integer baseEntityId,
      WorkflowAttributeReferenceType refType) {
    this.description = description;
    this.parentWorkflow = parentWorkflow;
    this.baseEntityId = baseEntityId;
    this.refType = refType;
  }

  public Workflow getParentWorkflow() {
    return this.parentWorkflow;
  }

  public void setParentWorkflow(Workflow parentWorkflow) {
    this.parentWorkflow = parentWorkflow;
  }

  public Integer getBaseEntityId() {
    return this.baseEntityId;
  }

  public void setBaseEntityId(Integer baseEntityId) {
    this.baseEntityId = baseEntityId;
  }

  public WorkflowAttributeReferenceType getRefType() {
    return this.refType;
  }

  public void setRefType(WorkflowAttributeReferenceType refType) {
    this.refType = refType;
  }

  public WorkflowAttributeDescription getDescription() {
    return description;
  }

  public void setDescription(WorkflowAttributeDescription description) {
    this.description = description;
  }

  public WorkflowAttributeId() {}

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || this.getClass() != o.getClass()) return false;
    WorkflowAttributeId that = (WorkflowAttributeId) o;
    return Objects.equals(this.description, that.description)
        && Objects.equals(this.parentWorkflow, that.parentWorkflow)
        && Objects.equals(this.baseEntityId, that.baseEntityId)
        && Objects.equals(this.refType, that.refType);
  }

  @Override
  public int hashCode() {
    return Objects.hash(this.description, this.parentWorkflow, this.baseEntityId, this.refType);
  }
}
