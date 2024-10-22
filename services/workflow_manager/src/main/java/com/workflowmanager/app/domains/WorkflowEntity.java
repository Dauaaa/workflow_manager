package com.workflowmanager.app.domains;

import com.workflowmanager.app.core.AuthorizationDTO;
import com.workflowmanager.app.core.BaseEntity;
import com.workflowmanager.app.core.ErrorUtils;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
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
  @JoinColumn(name = "workflow_id")
  Workflow workflow;

  @ManyToOne(optional = false)
  @JoinColumn(name = "current_state_id")
  WorkflowState currentState;

  public WorkflowEntity() {}

  public WorkflowEntity(
      NewWorkflowEntityDTO newWorkflowEntity, AuthorizationDTO auth, Workflow workflow)
      throws ResponseStatusException {
    super(newWorkflowEntity, auth);

    ErrorUtils.assertNeq(
        workflow.getInitialState(), null, "Workflow[id:%s] doesn't have an initial state.");

    this.workflow = workflow;
    this.currentState = workflow.getInitialState();
  }
}
