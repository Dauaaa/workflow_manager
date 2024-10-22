package com.workflowmanager.app.domains;

import java.io.Serializable;
import java.util.Objects;

public class WorkflowAttributeDescriptionId implements Serializable {
  private String name;
  private Integer parentWorkflow;

  public Integer getParentWorkflow() {
    return parentWorkflow;
  }

  public void setFrom(Integer parentWorkflow) {
    this.parentWorkflow = parentWorkflow;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public WorkflowAttributeDescriptionId() {}

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || this.getClass() != o.getClass()) return false;
    WorkflowAttributeDescriptionId that = (WorkflowAttributeDescriptionId) o;
    return Objects.equals(this.name, that.name)
        && Objects.equals(this.parentWorkflow, that.parentWorkflow);
  }

  @Override
  public int hashCode() {
    return Objects.hash(this.name, this.parentWorkflow);
  }
}
