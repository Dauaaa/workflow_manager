package com.workflowmanager.app.domains;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.workflowmanager.app.core.BaseEntity;
import com.workflowmanager.app.core.ErrorUtils;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import org.springframework.web.server.ResponseStatusException;

@Entity
@Table(
    name = "workflow_entities",
    indexes = {
      @Index(name = "workflow_entities_current_state_id_index", columnList = "current_state_id"),
      @Index(name = "workflow_entities_workflow_id_index", columnList = "workflow_id")
    })
public class WorkflowEntity extends BaseEntity {
  @ManyToOne(optional = false)
  @JoinColumn(name = "workflow_id2")
  @JsonBackReference
  private Workflow workflow;

  @ManyToOne(optional = false)
  @JoinColumn(name = "current_state_id2")
  @JsonBackReference
  private WorkflowState currentState;

  private Integer workflowId;

  public Integer getWorkflowId() {
    return this.workflowId;
  }

  private Integer currentStateId;

  public Integer getCurrentStateId() {
    return this.currentStateId;
  }

  public void setCurrentState(WorkflowState currentState) {
    this.currentState = currentState;
    this.currentStateId = currentState.getId();
  }

  public WorkflowEntity() {}

  public WorkflowEntity(NewWorkflowEntityDTO newWorkflowEntity, Workflow workflow)
      throws ResponseStatusException {
    super(newWorkflowEntity);

    ErrorUtils.assertNeq(
        workflow.getInitialState(), null, "Workflow[id:%s] doesn't have an initial state.");

    this.workflow = workflow;
    this.currentState = workflow.getInitialState();
  }

  @PrePersist
  protected void updateIdsOnPersist() {
    this.workflowId = this.workflow.getId();
    this.currentStateId = this.currentState.getId();
  }

  @PreUpdate
  protected void updateIdsOnUpdate() {
    if (this.currentState != null) this.currentStateId = this.currentState.getId();
  }
}
