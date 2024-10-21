package com.workflowmanager.app.core;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public abstract class NewBaseEntityDTO {
    @Schema(description = "Name of the entity, max of 50 characters.")
    @Size(min = 2, max = 50)
    @NotNull
    @Valid
    public String name;
}
