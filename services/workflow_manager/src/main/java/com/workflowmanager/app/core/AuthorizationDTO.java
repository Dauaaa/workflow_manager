package com.workflowmanager.app.core;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public class AuthorizationDTO {
  public UUID clientId;
  public UUID userId;
  private Instant creationTime;

  public Instant getCreationTime() {
      return this.creationTime;
  }

  public AuthorizationDTO(Map<String, String> headers) {
    String temp = headers.get("client-id");
    ErrorUtils.assertNeq(temp, null, "missing client-id header");
    this.clientId = UUID.fromString(temp);

    temp = headers.get("user-id");
    ErrorUtils.assertNeq(temp, null, "missing client-id header");
    this.userId = UUID.fromString(temp);

    this.creationTime = Instant.now();
  }
}
