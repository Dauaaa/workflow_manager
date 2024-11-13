package com.workflowmanager.app.domains;

import com.workflowmanager.app.controllers.requests.RequestNewAttribute;
import java.time.Instant;
import java.util.Date;

public class NewWorkflowAttributeDTO {
  public Long integer;
  public Double floating;
  public String enumeration;
  public Date date;
  public Instant timestamp;
  public Boolean flag;
  public String text;

  public NewWorkflowAttributeDTO(RequestNewAttribute request) {
    this.integer = Long.parseLong(request.integer);
    this.floating = request.floating;
    this.enumeration = request.enumeration;
    this.date = request.date;
    this.timestamp = request.timestamp;
    this.flag = request.flag;
    this.text = request.text;
  }
}
