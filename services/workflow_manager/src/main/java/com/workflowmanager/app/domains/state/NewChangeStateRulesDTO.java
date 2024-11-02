package com.workflowmanager.app.domains.state;

import com.workflowmanager.app.controllers.requests.RequestSetChangeStateRule;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public class NewChangeStateRulesDTO {
  @NotNull public Integer fromId;

  @NotNull public Integer toId;

  @Size(min = 1)
  @NotNull
  public List<String> expressions;

  public NewChangeStateRulesDTO(RequestSetChangeStateRule request, Integer fromId) {
    this.fromId = fromId;
    this.toId = request.toId;
    this.expressions = request.expressions;
  }
}
