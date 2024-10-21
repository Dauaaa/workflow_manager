package com.workflowmanager.app.domains.state;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.workflowmanager.app.domains.WorkflowState;
import com.workflowmanager.app.core.ErrorUtils;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.Column;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Entity;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.web.server.ResponseStatusException;

@Entity
@Table(name = "change_state_rules")
@IdClass(ChangeStateRulesId.class)
public class ChangeStateRules {
    @Id
    @Schema(name = "Workflow state that the entity is in.")
    @ManyToOne(optional = false)
    @JsonBackReference
    @NotNull
    private WorkflowState from;

    @Id
    @Schema(name = "Workflow state that the entity will go to.")
    @ManyToOne(optional = false)
    @JsonBackReference
    @NotNull
    private WorkflowState to;

    @Schema(name = "The expressions that need to return true so the change may happen")
    @Size(min = 1)
    @NotNull
    private String[] expressions;

    @Column(name = "from_id2", nullable = false, updatable = false)
    private Integer fromId;

    @Column(name = "to_id2", nullable = false, updatable = false)
    private Integer toId;

    public ChangeStateRules() {}

    public ChangeStateRules(WorkflowState from, WorkflowState to, NewChangeStateRulesDTO dto) throws ResponseStatusException {
        ErrorUtils.assertEq(from.getWorkflow().getId(), to.getWorkflow().getId(), String.format("WorkflowState[id:%s] is in Workflow[id:%s] while WorkflowState[id:%s] is in Workflow[id:%s]. They must be on the same workflow.", from.getId(), from.getWorkflow().getId(), to.getId(), to.getWorkflow().getId()));

        this.from = from;
        this.to = to;
        this.expressions = dto.expressions;
        this.fromId = from.getId();
        this.toId = to.getId();
    }

    public WorkflowState getFrom() {
        return this.from;
    }

    public WorkflowState getTo() {
        return this.to;
    }

    public Integer getFromId() {
        return this.fromId;
    }

    public Integer getToId() {
        return this.toId;
    }

    public String[] getExpressions() {
        return this.expressions;
    }

    @PrePersist
    protected void generateIds() throws ResponseStatusException {
        ErrorUtils.serverAssertNeq(this.from, null);
        ErrorUtils.serverAssertNeq(this.to, null);

        this.fromId = from.getId();
        this.toId = to.getId();
    }
}
