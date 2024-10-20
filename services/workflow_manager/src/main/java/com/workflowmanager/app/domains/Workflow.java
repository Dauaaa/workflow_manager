package com.workflowmanager.app.domains;

import com.workflowmanager.app.core.BaseEntity;
import com.workflowmanager.app.core.AuthorizationDTO;
import com.workflowmanager.app.domains.NewWorkflowDTO;
import com.workflowmanager.app.domains.WorkflowEntity;
import com.workflowmanager.app.domains.WorkflowState;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import jakarta.persistence.CascadeType;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(name = "workflows")
public class Workflow extends BaseEntity {
    public Workflow() {}

    @OneToOne(optional = true)
    @JoinColumn(name = "initial_state_id")
    private WorkflowState initialState;

    public Workflow(NewWorkflowDTO newWorkflow, AuthorizationDTO auth) {
        super(newWorkflow, auth);
    }

    public WorkflowState getInitialState() {
        return this.initialState;
    }
}
