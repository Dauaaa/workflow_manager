package com.workflowmanager.app.domains;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.workflowmanager.app.core.BaseEntity;
import com.workflowmanager.app.core.ErrorUtils;
import com.workflowmanager.app.domains.state.ChangeStateRules;
import com.workflowmanager.app.domains.state.ChangeStateRulesCEL;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.web.server.ResponseStatusException;

@Entity
@Table(name = "workflow_states")
public class WorkflowState extends BaseEntity {
  @ManyToOne(optional = false)
  @JoinColumn(name = "current_state_id2", nullable = false)
  @JsonBackReference
  Workflow workflow;

  @Transient private Integer workflowId;

  @OneToMany(mappedBy = "from")
  private List<ChangeStateRules> changeRules;

  @Transient private Long totalEntities;

  /** when was the last time the state's got/removed entities */
  @NonNull private Instant lastCurrentEntitiesChange;

  public WorkflowState() {}

  /** Throws if that is null. */
  public WorkflowState(WorkflowState that, Long totalEntities, Integer workflowId)
      throws ResponseStatusException {
    super(that);

    ErrorUtils.serverAssertNeq(that, null);
    this.workflow = that.workflow;
    this.changeRules = that.changeRules;

    // transient
    this.workflowId = workflowId;
    this.totalEntities = totalEntities;
  }

  public WorkflowState(NewWorkflowStateDTO newWorkflowState, Workflow workflow) {
    super(newWorkflowState);

    this.workflow = workflow;
    this.workflowId = workflow.getId();
    this.changeRules = new ArrayList<>();
    this.lastCurrentEntitiesChange = Instant.now();
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

  public Instant getLastCurrentEntitiesChange() {
    return this.lastCurrentEntitiesChange;
  }

  public List<ChangeStateRules> getChangeRules() {
    return this.changeRules;
  }

  protected void signalLastCurrentEntitiesChange() {
    this.lastCurrentEntitiesChange = Instant.now();
  }

  public static void moveEntity(
      WorkflowState from,
      WorkflowState to,
      WorkflowEntity entity,
      List<WorkflowAttributeDescription> descriptions,
      List<WorkflowAttribute> workflowAttrs,
      List<WorkflowAttribute> entityAttrs,
      List<WorkflowAttribute> fromStateAttrs,
      List<WorkflowAttribute> toStateAttrs)
      throws ResponseStatusException {
    ChangeStateRules rule =
        from.changeRules.stream()
            .filter(x -> x.getToId().equals(to.getId()))
            .findFirst()
            .orElseThrow(
                () ->
                    new ResponseStatusException(
                        HttpStatus.UNPROCESSABLE_ENTITY,
                        String.format(
                            "rule from %s to %s does not exist", from.getId(), to.getId())));

    ChangeStateRulesCEL.applyRule(
        descriptions, rule, workflowAttrs, entityAttrs, fromStateAttrs, toStateAttrs);

    System.out.println(String.format("apply rule from %s to %s", rule.getFromId(), rule.getToId()));

    from.signalLastCurrentEntitiesChange();
    to.signalLastCurrentEntitiesChange();
    entity.setCurrentState(to);
  }
}
