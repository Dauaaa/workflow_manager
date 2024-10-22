package com.workflowmanager.app.domains.state;

import com.workflowmanager.app.domains.Workflow;
import com.workflowmanager.app.domains.WorkflowEntity;
import com.workflowmanager.app.domains.WorkflowState;

public class ChangeStateRulesCELParameters {
  private Long fromTotalEntities;
  private Long toTotalEntities;

  public ChangeStateRulesCELParameters(
      Workflow workflow, WorkflowState from, WorkflowState to, WorkflowEntity entity) {}
}
