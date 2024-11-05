package com.workflowmanager.app.controllers.responses;

import org.springframework.lang.NonNull;

public class ResponseEntityChangeState {
  @NonNull public ResponseWorkflowEntity entity;
  @NonNull public ResponseWorkflowState from;
  @NonNull public ResponseWorkflowState to;

  // too error prone to create constructor since can mess up order of from/to!
}
