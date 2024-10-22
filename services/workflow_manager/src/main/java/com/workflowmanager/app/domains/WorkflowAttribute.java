package com.workflowmanager.app.domains;

import com.workflowmanager.app.core.ErrorUtils;
import com.workflowmanager.app.domains.WorkflowAttributeDescription.WorkflowAttributeType;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Currency;
import java.util.Date;
import java.util.List;

@Entity
@Table(name = "workflow_attributes")
public class WorkflowAttribute {
  @EmbeddedId private WorkflowAttributeId id;

  // values
  private List<Long> integer;
  private List<Double> floating;
  private List<String> enumeration;
  private List<BigDecimal> decimal;
  private List<Currency> currency;
  private List<Date> date;
  private List<Instant> timestamp;
  private List<Boolean> flag;
  private List<String> text;

  public WorkflowAttribute() {}

  public WorkflowAttribute(
      WorkflowAttributeDescription description,
      Workflow workflow,
      WorkflowState state,
      WorkflowEntity entity,
      List<Long> integer,
      List<Double> floating,
      List<String> enumeration,
      List<BigDecimal> decimal,
      List<Currency> currency,
      List<Date> date,
      List<Instant> timestamp,
      List<Boolean> flag,
      List<String> text) {
    this.id = new WorkflowAttributeId(description, workflow, state, entity);
    this.integer = integer;
    this.floating = floating;
    this.enumeration = enumeration;
    this.decimal = decimal;
    this.currency = currency;
    this.date = date;
    this.timestamp = timestamp;
    this.flag = flag;
    this.text = text;
  }

  public List<Long> getInteger() {
    return this.integer;
  }

  public List<Double> getFloating() {
    return this.floating;
  }

  public List<String> getEnumeration() {
    return this.enumeration;
  }

  public List<BigDecimal> getDecimal() {
    return this.decimal;
  }

  public List<Currency> getCurrency() {
    return this.currency;
  }

  public List<Date> getDate() {
    return this.date;
  }

  public List<Instant> getTimestamp() {
    return this.timestamp;
  }

  public List<Boolean> getFlag() {
    return this.flag;
  }

  public List<String> getText() {
    return this.text;
  }

  public void setInteger(List<Long> integer) {
    ErrorUtils.assertEq(WorkflowAttributeType.INTEGER, this.id.getDescription().getAttrType());

    this.integer = integer;
  }

  public void setFloating(List<Double> floating) {
    ErrorUtils.assertEq(WorkflowAttributeType.FLOATING, this.id.getDescription().getAttrType());

    this.floating = floating;
  }

  public void setEnumeration(List<String> enumeration) {
    ErrorUtils.assertEq(WorkflowAttributeType.ENUMERATION, this.id.getDescription().getAttrType());

    this.enumeration = enumeration;
  }

  public void setDecimal(List<BigDecimal> decimal) {
    ErrorUtils.assertEq(WorkflowAttributeType.DECIMAL, this.id.getDescription().getAttrType());

    this.decimal = decimal;
  }

  public void setCurrency(List<Currency> currency) {
    ErrorUtils.assertEq(WorkflowAttributeType.CURRENCY, this.id.getDescription().getAttrType());

    this.currency = currency;
  }

  public void setDate(List<Date> date) {
    ErrorUtils.assertEq(WorkflowAttributeType.DATE, this.id.getDescription().getAttrType());

    this.date = date;
  }

  public void setTimestamp(List<Instant> timestamp) {
    ErrorUtils.assertEq(WorkflowAttributeType.TIMESTAMP, this.id.getDescription().getAttrType());

    this.timestamp = timestamp;
  }

  public void setFlag(List<Boolean> flag) {
    ErrorUtils.assertEq(WorkflowAttributeType.FLAG, this.id.getDescription().getAttrType());

    this.flag = flag;
  }

  public void setText(List<String> text) {
    ErrorUtils.assertEq(WorkflowAttributeType.TEXT, this.id.getDescription().getAttrType());

    this.text = text;
  }
}
