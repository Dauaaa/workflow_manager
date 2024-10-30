package com.workflowmanager.app.controllers.requests;

import jakarta.validation.constraints.NotNull;

public abstract class RequestNewBaseEntity {
  @NotNull public String name;
}
