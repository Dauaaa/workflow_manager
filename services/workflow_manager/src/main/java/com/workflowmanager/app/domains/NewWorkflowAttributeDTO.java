package com.workflowmanager.app.domains;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Currency;
import java.util.Date;

public class NewWorkflowAttributeDTO {
  public Integer parentWorkflowId;

  public Long integer;
  public Double floating;
  public String enumeration;
  public BigDecimal decimal;
  public Currency currency;
  public Date date;
  public Instant timestamp;
  public Boolean flag;
  public String text;
}
