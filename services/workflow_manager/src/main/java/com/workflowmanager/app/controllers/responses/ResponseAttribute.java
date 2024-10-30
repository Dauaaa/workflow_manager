package com.workflowmanager.app.controllers.responses;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.workflowmanager.app.core.ErrorUtils;
import com.workflowmanager.app.domains.WorkflowAttribute;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Currency;
import java.util.Date;

public class ResponseAttribute {
  @NotNull public String descriptionName;
  @NotNull public Integer parentWorkflowId;
  @NotNull public Integer baseEntityId;

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

  public ResponseAttribute(WorkflowAttribute attribute) {
    ErrorUtils.serverAssertNeq(attribute, null);

    this.descriptionName = attribute.getDescriptionName();
    this.parentWorkflowId = attribute.getParentWorkflowId();
    this.baseEntityId = attribute.getBaseEntityId();
    this.integer = attribute.getInteger();
    this.floating = attribute.getFloating();
    this.enumeration = attribute.getEnumeration();
    this.decimal = attribute.getDecimal();
    this.currency = attribute.getCurrency();
    this.date = attribute.getDate();
    this.timestamp = attribute.getTimestamp();
    this.flag = attribute.getFlag();
    this.text = attribute.getText();
  }
}
