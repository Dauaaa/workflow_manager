package com.workflowmanager.app.domains.state;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class NewChangeStateRulesDTO {
    @Schema(name = "Id of the workflow state that the entity is in.")
    @NotNull
    public Integer fromId;
    @Schema(name = "Id of the workflow state that the entity will go to.")
    @NotNull
    public Integer toId;
    @Schema(name = "The expressions that need to return true so the change may happen")
    @Size(min = 1)
    @NotNull
    public String[] expressions;
}
