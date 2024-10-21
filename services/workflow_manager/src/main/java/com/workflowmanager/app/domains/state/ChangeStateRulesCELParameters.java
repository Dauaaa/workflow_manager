package com.workflowmanager.app.domains.state;

import com.workflowmanager.app.domains.Workflow;
import com.workflowmanager.app.domains.WorkflowState;
import com.workflowmanager.app.domains.WorkflowEntity;

public class ChangeStateRulesCELParameters {
    private Long fromTotalEntities;
    private Long toTotalEntities;

    public ChangeStateRulesCELParameters(Workflow workflow, WorkflowState from, WorkflowState to, WorkflowEntity entity) {

    }
}
