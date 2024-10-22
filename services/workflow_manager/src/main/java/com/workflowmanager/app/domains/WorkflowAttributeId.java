package com.workflowmanager.app.domains;

import com.fasterxml.jackson.annotation.JsonBackReference;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.Embeddable;
import jakarta.persistence.ManyToOne;
import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class WorkflowAttributeId implements Serializable {
  @Schema(name = "Description of the attribute")
  @ManyToOne(optional = false)
  private WorkflowAttributeDescription description;

  @Schema(name = "If this is not null, it tells that the attribute references this workflow")
  @JsonBackReference
  @ManyToOne(optional = true)
  private Workflow workflow;

  @Schema(name = "If this is not null, it tells that the attribute references this workflow state")
  @JsonBackReference
  @ManyToOne(optional = true)
  private WorkflowState state;

  @Schema(name = "If this is not null, it tells that the attribute references this workflow entity")
  @JsonBackReference
  @ManyToOne(optional = true)
  private WorkflowEntity entity;

  public WorkflowAttributeId(
      WorkflowAttributeDescription description,
      Workflow workflow,
      WorkflowState state,
      WorkflowEntity entity) {
    this.description = description;
    this.workflow = workflow;
    this.state = state;
    this.entity = entity;
  }

  public WorkflowEntity getEntity() {
    return entity;
  }

  public Workflow getWorkflow() {
    return this.workflow;
  }

  public WorkflowState getState() {
    return this.state;
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
        && Objects.equals(this.workflow, that.workflow)
        && Objects.equals(this.state, that.state)
        && Objects.equals(this.entity, that.entity);
  }

  @Override
  public int hashCode() {
    return Objects.hash(this.description, this.workflow, this.state, this.entity);
  }
}
