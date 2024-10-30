package com.workflowmanager.app.core;

import com.workflowmanager.app.controllers.requests.RequestNewBaseEntity;
import jakarta.validation.constraints.NotNull;

public abstract class NewBaseEntityDTO {
  @NotNull public String name;

  @NotNull public Integer userId;

  @NotNull public Integer clientId;

  public NewBaseEntityDTO(RequestNewBaseEntity request, AuthorizationDTO auth) {
    this.name = request.name;
    this.userId = auth.userId;
    this.clientId = auth.clientId;
  }
}
