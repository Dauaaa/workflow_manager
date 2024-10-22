package com.workflowmanager.app.domains.attribute;

import jakarta.persistence.Embeddable;
import jakarta.persistence.Lob;
import java.io.Serializable;

@Embeddable
public class WorkflowAttributeRule implements Serializable {
    @Lob
    public String rule;
    public String description;
    public String errorText;

    public WorkflowAttributeRule() {}
}
