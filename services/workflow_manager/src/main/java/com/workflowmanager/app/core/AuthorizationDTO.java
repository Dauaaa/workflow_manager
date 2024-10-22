package com.workflowmanager.app.core;

public class AuthorizationDTO {
  public int clientId;
  public int userId;

  public AuthorizationDTO(int clientId, int userId) {
    this.clientId = clientId;
    this.userId = userId;
  }
}
