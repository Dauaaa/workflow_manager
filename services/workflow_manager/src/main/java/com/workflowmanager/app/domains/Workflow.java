package com.workflowmanager.app.domains;

import com.workflowmanager.app.core.BaseEntity;
import com.workflowmanager.app.core.AuthorizationDTO;
import com.workflowmanager.app.core.ErrorUtils;
import com.workflowmanager.app.domains.NewWorkflowDTO;
import com.workflowmanager.app.domains.workflow.WorkflowConfig;
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
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.NotBlank;
import io.swagger.v3.oas.annotations.media.Schema;
import org.springframework.web.server.ResponseStatusException;

@Entity
@Table(name = "workflows")
public class Workflow extends BaseEntity {
    public Workflow() {}

    @OneToOne(optional = true, cascade = CascadeType.ALL)
    @Schema(description = "Starting states for all entities in this workflow.")
    @JoinColumn(name = "initialStateId", referencedColumnName = "id")
    private WorkflowState initialState;

    public Workflow(NewWorkflowDTO newWorkflow, AuthorizationDTO auth) {
        super(newWorkflow, auth);
    }

    public WorkflowState getInitialState() {
        return this.initialState;
    }

    /**
     * This method first validates all constraints and only then sets the values
     * so it doesn't change the object if it throws.
     */
    public void updateConfig(WorkflowConfig config) throws ResponseStatusException {
        // validate
        if (config.initialState != null) {
            ErrorUtils.assertEq(config.initialState.workflow.getId(), this.getId());
        }

        // set
        this.initialState = config.initialState;
    }
}
