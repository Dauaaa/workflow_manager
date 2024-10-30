package com.workflowmanager.app.controllers.responses;

import com.workflowmanager.app.core.BaseEntity;
import com.workflowmanager.app.core.ErrorUtils;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import org.springframework.web.server.ResponseStatusException;

public abstract class ResponseBaseEntity {
  @NotNull public Integer id;

  @NotNull public String name;

  @NotNull public Integer userId;

  @NotNull public Integer clientId;

  @NotNull public Instant creationTime;

  @NotNull public Instant updateTime;

  public Instant deletionTime;

  public ResponseBaseEntity(BaseEntity entity) throws ResponseStatusException {
    ErrorUtils.serverAssertNeq(entity, null);

    this.name = entity.getName();
    this.id = entity.getId();
    this.clientId = entity.getClientId();
    this.userId = entity.getUserId();
    this.creationTime = entity.getCreationTime();
    this.updateTime = entity.getUpdateTime();
    this.deletionTime = entity.getDeletionTime();
  }
}
