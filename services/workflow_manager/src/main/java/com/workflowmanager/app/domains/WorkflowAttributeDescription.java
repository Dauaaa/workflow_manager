package com.workflowmanager.app.domains;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.workflowmanager.app.core.BaseEntity;
import com.workflowmanager.app.domains.attribute.WorkflowAttributeRegexRule;
import com.workflowmanager.app.domains.attribute.WorkflowAttributeExprRule;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Entity;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import java.io.Serializable;
import java.util.List;
import java.util.Objects;
import org.hibernate.annotations.Type;
import io.hypersistence.utils.hibernate.type.json.JsonType;

@Entity
@Table(name = "workflow_attribute_descriptions")
@IdClass(WorkflowAttributeDescriptionId.class)
public class WorkflowAttributeDescription {
    @Id
    @Schema(name = "Name of the attribute. Unique per workflow.")
    @NotNull
    private String name;

    @Id
    @ManyToOne(optional = false)
    @JoinColumn(name = "parent_workflow_id2")
    @NotNull
    @JsonBackReference
    private Workflow parentWorkflow;
    @Schema(name = "Workflow this attribute is part of, it's not related to the value it references")
    private Integer parentWorkflowId;

    private WorkflowAttributeReferenceType refType;
    private WorkflowAttributeType attrType;
    @Type(JsonType.class)
    private WorkflowAttributeExprRule expression;
    @Type(JsonType.class)
    private WorkflowAttributeRegexRule regex;
    private List<String> enumDescription;

    public WorkflowAttributeDescription() {}

    public WorkflowAttributeDescription(String name, Workflow parentWorkflow, WorkflowAttributeReferenceType refType, WorkflowAttributeType attrType, WorkflowAttributeExprRule expression, WorkflowAttributeRegexRule regex, List<String> enumDescription) {
        this.name = name;
        this.parentWorkflow = parentWorkflow;
        this.refType = refType;
        this.attrType = attrType;
        this.expression = expression;
        this.regex = regex;
        this.enumDescription = enumDescription;
    }

    public String getName() { return this.name; }

    public WorkflowAttributeReferenceType getRefType() {
        return this.refType;
    }

    public WorkflowAttributeType getAttrType() {
        return this.attrType;
    }

    public WorkflowAttributeExprRule getExpression() {
        return this.expression;
    }

    public void setExpression(WorkflowAttributeExprRule expression) {
        this.expression = expression;
    }

    public WorkflowAttributeRegexRule getRegex() {
        return this.regex;
    }

    public void setRegex(WorkflowAttributeRegexRule regex) {
        this.regex = regex;
    }

    public List<String> getEnumDescription() {
        return this.enumDescription;
    }

    public void setEnumDescription(List<String> enumDescription) {
        this.enumDescription = enumDescription;
    }

    @PrePersist
    protected void persistParentWorkflowId() {
        this.parentWorkflowId = this.parentWorkflow.getId();
    }

    public enum WorkflowAttributeType {
        INTEGER,
        FLOATING,
        ENUMERATION,
        DECIMAL,
        CURRENCY,
        DATE,
        TIMESTAMP,
        FLAG,
        TEXT,
    }

    public enum WorkflowAttributeReferenceType {
        WORKFLOW,
        WORKFLOW_STATE,
        WORKFLOW_ENTITY,
    }
}
