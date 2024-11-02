package com.workflowmanager.app.controllers.responses;

import java.time.Instant;
import java.util.List;
import org.springframework.lang.NonNull;

public class ResponseEntityIdsByState {
  @NonNull public List<Integer> ids;
  @NonNull public Instant lastCurrentEntitiesChange;

  public ResponseEntityIdsByState(List<Integer> ids, Instant lastCurrentEntitiesChange) {
    this.ids = ids;
    this.lastCurrentEntitiesChange = lastCurrentEntitiesChange;
  }
}
