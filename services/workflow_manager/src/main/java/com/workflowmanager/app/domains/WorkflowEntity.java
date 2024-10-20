package com.workflowmanager.app.domains;

import com.workflowmanager.app.core.BaseEntity;
import com.workflowmanager.app.core.AuthorizationDTO;
import com.workflowmanager.app.core.ErrorUtils;
import com.workflowmanager.app.domains.NewWorkflowEntityDTO;
import com.workflowmanager.app.domains.WorkflowEntity;
import com.workflowmanager.app.domains.WorkflowState;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.NotBlank;
import org.springframework.web.server.ResponseStatusException;

@Entity
@Table(name = "workflow_entities")
public class WorkflowEntity extends BaseEntity {
    @ManyToOne(optional = false)
    Workflow workflow;
    @ManyToOne(optional = false)
    WorkflowState currentState;

    public WorkflowEntity() {}

    public WorkflowEntity(NewWorkflowEntityDTO newWorkflowEntity, AuthorizationDTO auth, Workflow workflow) throws ResponseStatusException {
        super(newWorkflowEntity, auth);

        ErrorUtils.assertNeq(workflow.getInitialState(), null, "Workflow[id:%s] doesn't have an initial state.");

        this.workflow = workflow;
        this.currentState = workflow.getInitialState();
    }
}
