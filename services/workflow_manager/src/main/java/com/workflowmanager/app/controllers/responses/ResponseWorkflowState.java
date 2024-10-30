package com.workflowmanager.app.controllers.responses;

import com.workflowmanager.app.core.ErrorUtils;
import com.workflowmanager.app.domains.WorkflowState;
import com.workflowmanager.app.domains.state.ChangeStateRules;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.web.server.ResponseStatusException;

public class ResponseWorkflowState extends ResponseBaseEntity {
  @NotNull public Integer workflowId;
  @NotNull public List<ResponseChangeStateRules> changeRules;

  public ResponseWorkflowState(WorkflowState state) {
    super(state);

    this.workflowId = state.getWorkflowId();
    this.changeRules =
        state.getChangeRules().stream()
            .map(rules -> new ResponseChangeStateRules(rules))
            .collect(Collectors.toList());
  }

  public class ResponseChangeStateRules {
    @NotNull public Integer fromId;
    @NotNull public Integer toId;
    @NotNull public List<String> expressions;
    @NotNull public Instant creationTime;
    @NotNull public Instant updateTime;

    public ResponseChangeStateRules(ChangeStateRules rules) throws ResponseStatusException {
      ErrorUtils.serverAssertNeq(rules, null);

      this.fromId = rules.getFromId();
      this.toId = rules.getToId();
      this.expressions = rules.getExpressions();
      this.creationTime = rules.getCreationTime();
      this.updateTime = rules.getUpdateTime();
    }
  }
}
