package com.workflowmanager.app.domains;

import com.workflowmanager.app.controllers.requests.RequestNewAttribute;
import java.math.BigDecimal;
import java.math.BigInteger;
import java.time.Instant;
import java.util.Date;

public class NewWorkflowAttributeDTO {
  public BigInteger integer;
  public Double floating;
  public String enumeration;
  public BigDecimal decimal;
  public Date date;
  public Instant timestamp;
  public Boolean flag;
  public String text;

  public NewWorkflowAttributeDTO(RequestNewAttribute request) {
    if (request.integer != null) this.integer = new BigInteger(request.integer);
    this.floating = request.floating;
    this.enumeration = request.enumeration;
    if (this.decimal != null) new BigDecimal(request.decimal);
    this.date = request.date;
    this.timestamp = request.timestamp;
    this.flag = request.flag;
    this.text = request.text;
  }
}
