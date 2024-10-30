package com.workflowmanager.app.domains;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.workflowmanager.app.core.BaseEntity;
import com.workflowmanager.app.core.ErrorUtils;
import com.workflowmanager.app.domains.workflow.WorkflowConfig;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PostLoad;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import java.util.List;
import org.springframework.web.server.ResponseStatusException;

@Entity
@Table(name = "workflows")
public class Workflow extends BaseEntity {
  public Workflow() {}

  @OneToOne(optional = true)
  @Schema(description = "Starting states for all entities in this workflow.")
  @JoinColumn(name = "intial_state_id", referencedColumnName = "id")
  @JsonBackReference
  private WorkflowState initialState;

  @Transient private Integer initialStateId;

  @OneToMany(cascade = CascadeType.ALL)
  @Schema(description = "Attributes for this workflow.")
  private List<WorkflowAttribute> attrs;

  public List<WorkflowAttribute> getAttrs() {
    return this.attrs;
  }

  public Workflow(NewWorkflowDTO newWorkflow) {
    super(newWorkflow);
  }

  public WorkflowState getInitialState() {
    return this.initialState;
  }

  public Integer getInitialStateId() {
    return this.initialStateId;
  }

  /**
   * This method first validates all constraints and only then sets the values so it doesn't change
   * the object if it throws.
   */
  public void updateConfig(WorkflowConfig config) throws ResponseStatusException {
    // validate
    if (config.initialState != null) {
      ErrorUtils.assertEq(config.initialState.workflow.getId(), this.getId());
    }

    // set
    this.initialState = config.initialState;
  }

  @PostLoad
  protected void onLoad() {
    if (this.initialState != null) this.initialStateId = this.initialState.getId();
  }
}
