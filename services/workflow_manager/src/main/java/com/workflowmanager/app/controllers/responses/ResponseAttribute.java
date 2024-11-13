package com.workflowmanager.app.controllers.responses;

import com.workflowmanager.app.core.ErrorUtils;
import com.workflowmanager.app.domains.WorkflowAttribute;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Date;

public class ResponseAttribute {
  @NotNull public String descriptionName;
  @NotNull public Integer parentWorkflowId;
  @NotNull public Integer baseEntityId;
  @NotNull public Instant creationTime;
  @NotNull public Instant updateTime;

  public String integer;
  public Double floating;
  public String enumeration;
  // return string otherwise it'll be set as number in swagger :/
  // was trying this before:
  // @JsonFormat(shape = JsonFormat.Shape.STRING)
  public String decimal;
  public Date date;
  public Instant timestamp;
  public Boolean flag;
  public String text;

  public ResponseAttribute(WorkflowAttribute attribute) {
    ErrorUtils.serverAssertNeq(attribute, null);

    this.descriptionName = attribute.getDescriptionName();
    this.parentWorkflowId = attribute.getParentWorkflowId();
    this.baseEntityId = attribute.getBaseEntityId();
    this.creationTime = attribute.getCreationTime();
    this.updateTime = attribute.getUpdateTime();
    Long i = attribute.getInteger();
    if (i != null) this.integer = i.toString();
    this.floating = attribute.getFloating();
    this.enumeration = attribute.getEnumeration();
    BigDecimal d = attribute.getDecimal();
    if (d != null) this.decimal = d.toString();
    this.date = attribute.getDate();
    this.timestamp = attribute.getTimestamp();
    this.flag = attribute.getFlag();
    this.text = attribute.getText();
  }
}
