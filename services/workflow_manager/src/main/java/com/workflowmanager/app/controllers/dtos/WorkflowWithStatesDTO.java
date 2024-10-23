package com.workflowmanager.app.controllers.dtos;

import com.workflowmanager.app.domains.Workflow;
import com.workflowmanager.app.domains.WorkflowState;
import java.util.List;

public class WorkflowWithStatesDTO {
  public Workflow workflow;
  public List<WorkflowState> states;

  public WorkflowWithStatesDTO(Workflow workflow, List<WorkflowState> states) {
    this.workflow = workflow;
    this.states = states;
  }
}
