package com.workflowmanager.app.domains;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.workflowmanager.app.core.BaseEntity;
import com.workflowmanager.app.core.ErrorUtils;
import com.workflowmanager.app.domains.state.ChangeStateRules;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import java.util.ArrayList;
import java.util.List;
import org.springframework.web.server.ResponseStatusException;

@Entity
@Table(name = "workflow_states")
public class WorkflowState extends BaseEntity {
  @ManyToOne(optional = false)
  @JoinColumn(name = "current_state_id2", nullable = false)
  @JsonBackReference
  Workflow workflow;

  @Transient private Integer workflowId;

  @OneToMany
  @JoinColumn(name = "from_id")
  List<ChangeStateRules> fromRules;

  @OneToMany
  @JoinColumn(name = "to_id")
  List<ChangeStateRules> toRules;

  @Transient private Long totalEntities;

  public WorkflowState() {}

  /** Throws if that is null. */
  public WorkflowState(WorkflowState that, Long totalEntities, Integer workflowId)
      throws ResponseStatusException {
    super(that);

    ErrorUtils.serverAssertNeq(that, null);
    this.workflow = that.workflow;
    this.toRules = that.toRules;
    this.fromRules = that.fromRules;

    // transient
    this.workflowId = workflowId;
    this.totalEntities = totalEntities;
  }

  public WorkflowState(NewWorkflowStateDTO newWorkflowState, Workflow workflow) {
    super(newWorkflowState);

    this.workflow = workflow;
    this.workflowId = workflow.getId();
    this.fromRules = new ArrayList<>();
    this.toRules = new ArrayList<>();
  }

  public Integer getWorkflowId() {
    return this.workflowId;
  }

  public Workflow getWorkflow() {
    return this.workflow;
  }

  public Long getTotalEntities() {
    return this.totalEntities;
  }

  public List<ChangeStateRules> getFromRules() {
    return this.fromRules;
  }

  public List<ChangeStateRules> getToRules() {
    return this.toRules;
  }
}
