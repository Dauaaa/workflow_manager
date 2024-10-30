package com.workflowmanager.app.controllers.requests;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Currency;
import java.util.Date;

public class RequestNewAttribute {
  public Long integer;
  public Double floating;
  public String enumeration;

  @JsonFormat(shape = JsonFormat.Shape.STRING)
  public BigDecimal decimal;

  public Currency currency;
  public Date date;
  public Instant timestamp;
  public Boolean flag;
  public String text;
}
