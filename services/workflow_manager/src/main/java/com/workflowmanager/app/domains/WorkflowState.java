package com.workflowmanager.app.domains;

import com.workflowmanager.app.core.BaseEntity;
import com.workflowmanager.app.core.AuthorizationDTO;
import com.workflowmanager.app.domains.NewWorkflowStateDTO;
import com.workflowmanager.app.domains.WorkflowEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(name = "workflow_states")
public class WorkflowState extends BaseEntity {
    @ManyToOne
    Workflow workflow;

    public WorkflowState() {}

    public WorkflowState(NewWorkflowStateDTO newWorkflowState, AuthorizationDTO auth, Workflow workflow) {
        super(newWorkflowState, auth);

        this.workflow = workflow;
    }

    public Workflow getWorkflow() {
        return this.workflow;
    }
}
