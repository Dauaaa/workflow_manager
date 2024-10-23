package com.workflowmanager.app.domains.state;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public class NewChangeStateRulesDTO {
  @Schema(description = "Id of the workflow state that the entity is in.")
  @NotNull
  public Integer fromId;

  @Schema(description = "Id of the workflow state that the entity will go to.")
  @NotNull
  public Integer toId;

  @Schema(description = "The expressions that need to return true so the change may happen")
  @Size(min = 1)
  @NotNull
  public List<String> expressions;
}
